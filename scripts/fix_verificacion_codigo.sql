-- ============================================================================
-- FIX: Código Inválido o Expirado
-- ============================================================================
-- Este script mejora las funciones para normalizar el formato del teléfono
-- y agregar mejor logging para debug
-- ============================================================================

-- Función auxiliar para normalizar teléfono
-- ============================================================================
CREATE OR REPLACE FUNCTION public.normalizar_telefono(p_telefono TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_telefono TEXT;
BEGIN
    -- Remover espacios
    v_telefono := TRIM(p_telefono);
    
    -- Remover caracteres no numéricos excepto +
    v_telefono := REGEXP_REPLACE(v_telefono, '[^0-9+]', '', 'g');
    
    -- Asegurar que empiece con +
    IF NOT v_telefono LIKE '+%' THEN
        -- Si empieza con 0, reemplazar con +54
        IF v_telefono LIKE '0%' THEN
            v_telefono := '+54' || SUBSTRING(v_telefono FROM 2);
        -- Si no tiene código de país, agregar +54
        ELSIF LENGTH(v_telefono) < 12 THEN
            v_telefono := '+54' || v_telefono;
        ELSE
            v_telefono := '+' || v_telefono;
        END IF;
    END IF;
    
    RETURN v_telefono;
END;
$$;

-- Actualizar función enviar_codigo_whatsapp para normalizar teléfono
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
    v_telefono_normalizado TEXT;
BEGIN
    -- Normalizar teléfono
    v_telefono_normalizado := public.normalizar_telefono(p_telefono);
    
    IF v_telefono_normalizado IS NULL OR LENGTH(TRIM(v_telefono_normalizado)) < 10 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Número de teléfono inválido'
        );
    END IF;

    -- Limpiar códigos expirados
    DELETE FROM public.codigos_verificacion
    WHERE expira_en < NOW() OR usado = true;

    -- Buscar usuario por teléfono (normalizado)
    SELECT id INTO v_usuario_id
    FROM public.users
    WHERE public.normalizar_telefono(telefono) = v_telefono_normalizado
    LIMIT 1;

    -- Generar código
    v_codigo := public.generar_codigo_otp();
    v_expira_en := NOW() + INTERVAL '15 minutes';

    -- Invalidar códigos anteriores (usando teléfono normalizado)
    UPDATE public.codigos_verificacion
    SET usado = true
    WHERE public.normalizar_telefono(telefono) = v_telefono_normalizado
      AND usado = false
      AND expira_en > NOW();

    -- Insertar nuevo código (usando teléfono normalizado)
    INSERT INTO public.codigos_verificacion (
        telefono,
        codigo,
        expira_en,
        usuario_id
    ) VALUES (
        v_telefono_normalizado,
        v_codigo,
        v_expira_en,
        v_usuario_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Código generado exitosamente',
        'codigo', v_codigo, -- Solo para desarrollo
        'telefono_normalizado', v_telefono_normalizado, -- Para debug
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

-- Actualizar función verificar_codigo_whatsapp para normalizar teléfono
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
    v_telefono_normalizado TEXT;
BEGIN
    IF p_telefono IS NULL OR p_codigo IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Teléfono y código son requeridos'
        );
    END IF;

    -- Normalizar teléfono
    v_telefono_normalizado := public.normalizar_telefono(p_telefono);
    
    -- Limpiar espacios del código
    p_codigo := TRIM(p_codigo);

    -- Buscar código activo (usando teléfono normalizado)
    SELECT * INTO v_codigo_record
    FROM public.codigos_verificacion
    WHERE public.normalizar_telefono(telefono) = v_telefono_normalizado
      AND TRIM(codigo) = p_codigo
      AND usado = false
      AND expira_en > NOW()
    ORDER BY creado_en DESC
    LIMIT 1;

    IF NOT FOUND THEN
        -- Intentar actualizar intentos (usando teléfono normalizado)
        UPDATE public.codigos_verificacion
        SET intentos = intentos + 1
        WHERE public.normalizar_telefono(telefono) = v_telefono_normalizado
          AND TRIM(codigo) = p_codigo
          AND usado = false;
        
        -- Para debug: retornar información sobre códigos disponibles
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Código inválido o expirado',
            'debug_info', jsonb_build_object(
                'telefono_buscado', v_telefono_normalizado,
                'codigo_buscado', p_codigo,
                'códigos_disponibles', (
                    SELECT jsonb_agg(jsonb_build_object(
                        'telefono', telefono,
                        'telefono_normalizado', public.normalizar_telefono(telefono),
                        'codigo', codigo,
                        'usado', usado,
                        'expira_en', expira_en,
                        'creado_en', creado_en
                    ))
                    FROM public.codigos_verificacion
                    WHERE public.normalizar_telefono(telefono) = v_telefono_normalizado
                      AND usado = false
                      AND expira_en > NOW()
                    ORDER BY creado_en DESC
                    LIMIT 3
                )
            )
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

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Probar la función de normalización
SELECT 
    'Original: +5491112345678' as test,
    public.normalizar_telefono('+5491112345678') as resultado
UNION ALL
SELECT 
    'Original: 091112345678',
    public.normalizar_telefono('091112345678')
UNION ALL
SELECT 
    'Original: 91112345678',
    public.normalizar_telefono('91112345678')
UNION ALL
SELECT 
    'Original: 5491112345678',
    public.normalizar_telefono('5491112345678');

-- ============================================================================
-- NOTAS
-- ============================================================================
-- 1. Esta versión normaliza el teléfono antes de guardarlo y compararlo
-- 2. Agrega información de debug en caso de error
-- 3. Compara códigos sin espacios
-- 4. Usa la misma normalización en ambas funciones
-- ============================================================================

