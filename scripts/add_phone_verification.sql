-- ============================================================================
-- AGREGAR VERIFICACIÓN DE TELÉFONO
-- ============================================================================
-- Este script agrega el campo telefono_verificado y las funciones necesarias
-- para verificar teléfonos mediante WhatsApp
-- ============================================================================

-- 1. Agregar campo telefono_verificado a la tabla users
-- ============================================================================
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS telefono_verificado BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.users.telefono_verificado IS 'Indica si el teléfono del usuario ha sido verificado mediante WhatsApp';

-- 2. Crear tabla para almacenar códigos de verificación
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_codigos_verificacion_telefono 
ON public.codigos_verificacion(telefono);

CREATE INDEX IF NOT EXISTS idx_codigos_verificacion_expira 
ON public.codigos_verificacion(expira_en);

-- 3. Función para generar código OTP
-- ============================================================================
CREATE OR REPLACE FUNCTION public.generar_codigo_otp()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    codigo TEXT;
BEGIN
    codigo := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    RETURN codigo;
END;
$$;

-- 4. Función para enviar código por WhatsApp
-- ============================================================================
CREATE OR REPLACE FUNCTION public.enviar_codigo_whatsapp(p_telefono TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_codigo TEXT;
    v_expira_en TIMESTAMPTZ;
    v_usuario_id UUID;
BEGIN
    IF p_telefono IS NULL OR LENGTH(TRIM(p_telefono)) < 10 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Número de teléfono inválido'
        );
    END IF;

    -- Limpiar códigos expirados
    DELETE FROM public.codigos_verificacion
    WHERE expira_en < NOW() OR usado = true;

    -- Buscar usuario por teléfono
    SELECT id INTO v_usuario_id
    FROM public.users
    WHERE telefono = p_telefono
    LIMIT 1;

    -- Generar código
    v_codigo := public.generar_codigo_otp();
    v_expira_en := NOW() + INTERVAL '15 minutes';

    -- Invalidar códigos anteriores
    UPDATE public.codigos_verificacion
    SET usado = true
    WHERE telefono = p_telefono 
      AND usado = false
      AND expira_en > NOW();

    -- Insertar nuevo código
    INSERT INTO public.codigos_verificacion (
        telefono,
        codigo,
        expira_en,
        usuario_id
    ) VALUES (
        p_telefono,
        v_codigo,
        v_expira_en,
        v_usuario_id
    );

    -- NOTA: Aquí deberías integrar con un servicio de WhatsApp (Twilio, etc.)
    -- Por ahora, el código se retorna para desarrollo
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Código generado exitosamente',
        'codigo', v_codigo, -- Solo para desarrollo
        'expira_en', v_expira_en
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- 5. Función para verificar código
-- ============================================================================
CREATE OR REPLACE FUNCTION public.verificar_codigo_whatsapp(
    p_telefono TEXT,
    p_codigo TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_codigo_record RECORD;
BEGIN
    IF p_telefono IS NULL OR p_codigo IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Teléfono y código son requeridos'
        );
    END IF;

    -- Buscar código activo
    SELECT * INTO v_codigo_record
    FROM public.codigos_verificacion
    WHERE telefono = p_telefono
      AND codigo = p_codigo
      AND usado = false
      AND expira_en > NOW()
    ORDER BY creado_en DESC
    LIMIT 1;

    IF NOT FOUND THEN
        UPDATE public.codigos_verificacion
        SET intentos = intentos + 1
        WHERE telefono = p_telefono
          AND codigo = p_codigo
          AND usado = false;
        
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Código inválido o expirado'
        );
    END IF;

    -- Verificar límite de intentos
    IF v_codigo_record.intentos >= 5 THEN
        UPDATE public.codigos_verificacion
        SET usado = true
        WHERE id = v_codigo_record.id;
        
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Demasiados intentos fallidos. Solicita un nuevo código'
        );
    END IF;

    -- Marcar como usado
    UPDATE public.codigos_verificacion
    SET usado = true
    WHERE id = v_codigo_record.id;

    -- Marcar teléfono como verificado
    IF v_codigo_record.usuario_id IS NOT NULL THEN
        UPDATE public.users
        SET telefono_verificado = true
        WHERE id = v_codigo_record.usuario_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Código verificado exitosamente',
        'usuario_id', v_codigo_record.usuario_id
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- 6. Habilitar RLS en codigos_verificacion
-- ============================================================================
ALTER TABLE public.codigos_verificacion ENABLE ROW LEVEL SECURITY;

-- Las funciones RPC tienen SECURITY DEFINER, así que pueden acceder directamente

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- Ejecuta estas queries para verificar que todo se creó correctamente:

-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'users' AND column_name = 'telefono_verificado';

-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
-- AND routine_name IN ('enviar_codigo_whatsapp', 'verificar_codigo_whatsapp');

