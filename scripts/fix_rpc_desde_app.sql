-- ============================================================================
-- FIX: RPC Funciona desde SQL pero no desde la App
-- ============================================================================
-- Este script asegura que la función RPC funcione correctamente desde la app
-- ============================================================================
-- Verificar y asegurar que la función tenga SECURITY DEFINER
-- ============================================================================
CREATE OR REPLACE FUNCTION public.enviar_codigo_whatsapp(p_telefono TEXT) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER -- IMPORTANTE: Esto permite que se ejecute con permisos elevados
SET search_path = public -- IMPORTANTE: Asegura que use el schema correcto
    AS $$
DECLARE v_codigo TEXT;
v_expira_en TIMESTAMPTZ;
v_usuario_id UUID;
v_url TEXT;
v_service_role_key TEXT;
v_telefono_normalizado TEXT;
v_job_id BIGINT;
BEGIN -- Normalizar teléfono usando la función
BEGIN v_telefono_normalizado := public.normalizar_telefono(p_telefono);
EXCEPTION
WHEN OTHERS THEN -- Si la función no existe, normalizar manualmente
v_telefono_normalizado := TRIM(p_telefono);
v_telefono_normalizado := REGEXP_REPLACE(v_telefono_normalizado, '[^0-9+]', '', 'g');
IF NOT v_telefono_normalizado LIKE '+%' THEN IF v_telefono_normalizado LIKE '0%' THEN v_telefono_normalizado := '+54' || SUBSTRING(
    v_telefono_normalizado
    FROM 2
);
ELSIF LENGTH(v_telefono_normalizado) < 12 THEN v_telefono_normalizado := '+54' || v_telefono_normalizado;
ELSE v_telefono_normalizado := '+' || v_telefono_normalizado;
END IF;
END IF;
END;
IF v_telefono_normalizado IS NULL
OR LENGTH(TRIM(v_telefono_normalizado)) < 10 THEN RETURN jsonb_build_object(
    'success',
    false,
    'error',
    'Número de teléfono inválido'
);
END IF;
-- Limpiar códigos expirados
DELETE FROM public.codigos_verificacion
WHERE expira_en < NOW()
    OR usado = true;
-- Buscar usuario por teléfono (normalizado)
BEGIN
SELECT id INTO v_usuario_id
FROM public.users
WHERE public.normalizar_telefono(telefono) = v_telefono_normalizado
LIMIT 1;
EXCEPTION
WHEN OTHERS THEN -- Si falla la normalización en la búsqueda, buscar sin normalizar
SELECT id INTO v_usuario_id
FROM public.users
WHERE telefono = v_telefono_normalizado
LIMIT 1;
END;
-- Generar código
v_codigo := public.generar_codigo_otp();
v_expira_en := NOW() + INTERVAL '15 minutes';
-- Invalidar códigos anteriores (usando teléfono normalizado)
BEGIN
UPDATE public.codigos_verificacion
SET usado = true
WHERE public.normalizar_telefono(telefono) = v_telefono_normalizado
    AND usado = false
    AND expira_en > NOW();
EXCEPTION
WHEN OTHERS THEN -- Si falla, intentar sin normalización
UPDATE public.codigos_verificacion
SET usado = true
WHERE telefono = v_telefono_normalizado
    AND usado = false
    AND expira_en > NOW();
END;
-- Insertar nuevo código (usando teléfono normalizado)
INSERT INTO public.codigos_verificacion (
        telefono,
        codigo,
        expira_en,
        usuario_id
    )
VALUES (
        v_telefono_normalizado,
        v_codigo,
        v_expira_en,
        v_usuario_id
    );
-- Llamar directamente a la edge function
v_url := 'https://kqxnjpyupcxbajuzsbtx.supabase.co/functions/v1/send-whatsapp-code';
v_service_role_key := 'sb_secret_mcxbtxfJQPsXOxFxVmnkAQ_lBX9uGEX';
-- Usar pg_net para llamar a la edge function
BEGIN -- pg_net.http_post retorna un job_id
SELECT net.http_post(
        url := v_url,
        headers := jsonb_build_object(
            'Content-Type',
            'application/json',
            'Authorization',
            'Bearer ' || v_service_role_key
        )::jsonb,
        body := jsonb_build_object(
            'telefono',
            v_telefono_normalizado,
            'codigo',
            v_codigo
        )::jsonb
    ) INTO v_job_id;
-- Si la llamada fue exitosa (no lanzó excepción), retornar éxito
RETURN jsonb_build_object(
    'success',
    true,
    'message',
    'Código generado y enviado exitosamente',
    'codigo',
    v_codigo,
    -- Solo para desarrollo/debug
    'telefono_normalizado',
    v_telefono_normalizado,
    'expira_en',
    v_expira_en,
    'job_id',
    v_job_id
);
EXCEPTION
WHEN OTHERS THEN -- Si falla el envío, igual retornar éxito pero con advertencia
-- El código ya está guardado, el usuario puede pedir reenvío
RETURN jsonb_build_object(
    'success',
    true,
    'message',
    'Código generado pero no se pudo enviar por WhatsApp',
    'codigo',
    v_codigo,
    -- Retornar código para desarrollo
    'telefono_normalizado',
    v_telefono_normalizado,
    'expira_en',
    v_expira_en,
    'warning',
    'Error al enviar: ' || SQLERRM
);
END;
EXCEPTION
WHEN OTHERS THEN RETURN jsonb_build_object(
    'success',
    false,
    'error',
    SQLERRM
);
END;
$$;
-- Verificar que la función tenga SECURITY DEFINER
-- ============================================================================
SELECT routine_name,
    security_type,
    routine_definition LIKE '%SECURITY DEFINER%' as has_security_definer
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_name = 'enviar_codigo_whatsapp';
-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- 1. SECURITY DEFINER permite que la función se ejecute con permisos elevados
-- 2. SET search_path asegura que use el schema correcto
-- 3. Se agregó manejo de excepciones más robusto
-- 4. Se captura el job_id de pg_net para debug
-- ============================================================================