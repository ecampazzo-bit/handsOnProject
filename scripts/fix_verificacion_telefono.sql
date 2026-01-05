-- ============================================================================
-- FIX: Verificación de Teléfono No Funciona
-- ============================================================================
-- Este script corrige los problemas comunes con la verificación de teléfono
-- ============================================================================
-- 1. Asegurar que existe el campo telefono_verificado
-- ============================================================================
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS telefono_verificado BOOLEAN NOT NULL DEFAULT false;
-- 2. Asegurar que existe la tabla codigos_verificacion con todos los campos
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.codigos_verificacion (
    id BIGSERIAL PRIMARY KEY,
    telefono TEXT NOT NULL,
    codigo TEXT NOT NULL,
    intentos INTEGER NOT NULL DEFAULT 0,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expira_en TIMESTAMPTZ NOT NULL,
    usado BOOLEAN NOT NULL DEFAULT false,
    usuario_id UUID REFERENCES public.users(id) ON DELETE CASCADE
);
-- Agregar campo intentos si no existe
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'codigos_verificacion'
        AND column_name = 'intentos'
        AND table_schema = 'public'
) THEN
ALTER TABLE public.codigos_verificacion
ADD COLUMN intentos INTEGER NOT NULL DEFAULT 0;
END IF;
END $$;
-- Índices
CREATE INDEX IF NOT EXISTS idx_codigos_verificacion_telefono ON public.codigos_verificacion(telefono);
CREATE INDEX IF NOT EXISTS idx_codigos_verificacion_expira ON public.codigos_verificacion(expira_en);
CREATE INDEX IF NOT EXISTS idx_codigos_verificacion_usado ON public.codigos_verificacion(usado);
-- 3. Función para normalizar teléfono (mejorada)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.normalizar_telefono(p_telefono TEXT) RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE v_telefono TEXT;
BEGIN -- Validar entrada
IF p_telefono IS NULL THEN RETURN NULL;
END IF;
-- Remover espacios y caracteres especiales excepto +
v_telefono := TRIM(p_telefono);
v_telefono := REGEXP_REPLACE(v_telefono, '[^0-9+]', '', 'g');
-- Si está vacío después de limpiar, retornar NULL
IF LENGTH(v_telefono) = 0 THEN RETURN NULL;
END IF;
-- Asegurar que empiece con +
IF NOT v_telefono LIKE '+%' THEN -- Si empieza con 0, reemplazar con +54
IF v_telefono LIKE '0%' THEN v_telefono := '+54' || SUBSTRING(
    v_telefono
    FROM 2
);
-- Si empieza con 54, agregar +
ELSIF v_telefono LIKE '54%' THEN v_telefono := '+' || v_telefono;
-- Si no tiene código de país, agregar +54
ELSIF LENGTH(v_telefono) < 12 THEN v_telefono := '+54' || v_telefono;
ELSE v_telefono := '+' || v_telefono;
END IF;
END IF;
RETURN v_telefono;
END;
$$;
-- 4. Función para generar código OTP
-- ============================================================================
CREATE OR REPLACE FUNCTION public.generar_codigo_otp() RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE codigo TEXT;
BEGIN -- Generar código de 6 dígitos
codigo := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
RETURN codigo;
END;
$$;
-- 5. Función enviar_codigo_whatsapp (mejorada)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.enviar_codigo_whatsapp(p_telefono TEXT) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_codigo TEXT;
v_expira_en TIMESTAMPTZ;
v_usuario_id UUID;
v_telefono_normalizado TEXT;
BEGIN -- Normalizar teléfono
v_telefono_normalizado := public.normalizar_telefono(p_telefono);
IF v_telefono_normalizado IS NULL
OR LENGTH(TRIM(v_telefono_normalizado)) < 10 THEN RETURN jsonb_build_object(
    'success',
    false,
    'error',
    'Número de teléfono inválido'
);
END IF;
-- Limpiar códigos expirados (más de 1 hora)
DELETE FROM public.codigos_verificacion
WHERE expira_en < NOW() - INTERVAL '1 hour';
-- Buscar usuario por teléfono (normalizado)
SELECT id INTO v_usuario_id
FROM public.users
WHERE public.normalizar_telefono(telefono) = v_telefono_normalizado
LIMIT 1;
-- Generar código
v_codigo := public.generar_codigo_otp();
v_expira_en := NOW() + INTERVAL '15 minutes';
-- Invalidar códigos anteriores del mismo teléfono
UPDATE public.codigos_verificacion
SET usado = true
WHERE public.normalizar_telefono(telefono) = v_telefono_normalizado
    AND usado = false
    AND expira_en > NOW();
-- Insertar nuevo código (guardar teléfono normalizado)
INSERT INTO public.codigos_verificacion (
        telefono,
        codigo,
        expira_en,
        usuario_id,
        intentos
    )
VALUES (
        v_telefono_normalizado,
        v_codigo,
        v_expira_en,
        v_usuario_id,
        0
    );
RETURN jsonb_build_object(
    'success',
    true,
    'message',
    'Código generado exitosamente',
    'codigo',
    v_codigo,
    -- Solo para desarrollo/debug
    'telefono_normalizado',
    v_telefono_normalizado,
    'expira_en',
    v_expira_en
);
EXCEPTION
WHEN OTHERS THEN RETURN jsonb_build_object(
    'success',
    false,
    'error',
    SQLERRM
);
END;
$$;
-- 6. Función verificar_codigo_whatsapp (mejorada)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.verificar_codigo_whatsapp(p_telefono TEXT, p_codigo TEXT) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_codigo_record RECORD;
v_telefono_normalizado TEXT;
v_codigo_limpio TEXT;
v_debug_codigos JSONB;
BEGIN -- Validar parámetros
IF p_telefono IS NULL
OR p_codigo IS NULL THEN RETURN jsonb_build_object(
    'success',
    false,
    'error',
    'Teléfono y código son requeridos'
);
END IF;
-- Normalizar teléfono
v_telefono_normalizado := public.normalizar_telefono(p_telefono);
IF v_telefono_normalizado IS NULL THEN RETURN jsonb_build_object(
    'success',
    false,
    'error',
    'Número de teléfono inválido'
);
END IF;
-- Limpiar código (remover espacios)
v_codigo_limpio := TRIM(p_codigo);
-- Buscar código activo (usando teléfono normalizado)
SELECT * INTO v_codigo_record
FROM public.codigos_verificacion
WHERE public.normalizar_telefono(telefono) = v_telefono_normalizado
    AND TRIM(codigo) = v_codigo_limpio
    AND usado = false
    AND expira_en > NOW()
ORDER BY creado_en DESC
LIMIT 1;
IF NOT FOUND THEN -- Incrementar intentos fallidos (si existe un código con ese teléfono)
UPDATE public.codigos_verificacion
SET intentos = intentos + 1
WHERE public.normalizar_telefono(telefono) = v_telefono_normalizado
    AND TRIM(codigo) = v_codigo_limpio
    AND usado = false
    AND expira_en > NOW();
-- Obtener códigos disponibles para debug
WITH codigos_recientes AS (
    SELECT telefono,
        codigo,
        usado,
        expira_en,
        creado_en,
        intentos
    FROM public.codigos_verificacion
    WHERE public.normalizar_telefono(telefono) = v_telefono_normalizado
        AND usado = false
        AND expira_en > NOW()
    ORDER BY creado_en DESC
    LIMIT 3
)
SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'telefono',
                cr.telefono,
                'telefono_normalizado',
                public.normalizar_telefono(cr.telefono),
                'codigo',
                cr.codigo,
                'usado',
                cr.usado,
                'expira_en',
                cr.expira_en,
                'creado_en',
                cr.creado_en,
                'intentos',
                cr.intentos
            )
        ),
        '[]'::jsonb
    ) INTO v_debug_codigos
FROM codigos_recientes cr;
-- Retornar error con información de debug
RETURN jsonb_build_object(
    'success',
    false,
    'error',
    'Código inválido o expirado',
    'debug_info',
    jsonb_build_object(
        'telefono_buscado',
        v_telefono_normalizado,
        'codigo_buscado',
        v_codigo_limpio,
        'códigos_disponibles',
        v_debug_codigos
    )
);
END IF;
-- Verificar límite de intentos
IF v_codigo_record.intentos >= 5 THEN
UPDATE public.codigos_verificacion
SET usado = true
WHERE id = v_codigo_record.id;
RETURN jsonb_build_object(
    'success',
    false,
    'error',
    'Demasiados intentos fallidos. Solicita un nuevo código'
);
END IF;
-- Marcar código como usado
UPDATE public.codigos_verificacion
SET usado = true
WHERE id = v_codigo_record.id;
-- Marcar teléfono como verificado en la tabla users
IF v_codigo_record.usuario_id IS NOT NULL THEN
UPDATE public.users
SET telefono_verificado = true
WHERE id = v_codigo_record.usuario_id;
ELSE -- Si no hay usuario_id, buscar por teléfono normalizado
UPDATE public.users
SET telefono_verificado = true
WHERE public.normalizar_telefono(telefono) = v_telefono_normalizado;
END IF;
RETURN jsonb_build_object(
    'success',
    true,
    'message',
    'Código verificado exitosamente',
    'usuario_id',
    v_codigo_record.usuario_id
);
EXCEPTION
WHEN OTHERS THEN RETURN jsonb_build_object(
    'success',
    false,
    'error',
    SQLERRM
);
END;
$$;
-- 7. Limpiar códigos antiguos
-- ============================================================================
DELETE FROM public.codigos_verificacion
WHERE expira_en < NOW() - INTERVAL '24 hours';
-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- Ejecutar para verificar que todo está correcto:
-- SELECT routine_name, security_type 
-- FROM information_schema.routines
-- WHERE routine_schema = 'public'
--   AND routine_name IN ('enviar_codigo_whatsapp', 'verificar_codigo_whatsapp', 'normalizar_telefono', 'generar_codigo_otp');
-- ============================================================================