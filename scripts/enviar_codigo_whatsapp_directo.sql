-- ============================================================================
-- VERSIÓN ALTERNATIVA: Llamar a Edge Function Directamente desde la RPC
-- ============================================================================
-- Esta versión llama directamente a la edge function sin depender del trigger
-- Úsala si el trigger no funciona
-- ============================================================================
-- IMPORTANTE: Reemplaza 'TU_SERVICE_ROLE_KEY_AQUI' con tu service_role_key real
-- Puedes encontrarlo en: Supabase Dashboard > Settings > API > service_role key
CREATE OR REPLACE FUNCTION public.enviar_codigo_whatsapp(p_telefono TEXT) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_codigo TEXT;
v_expira_en TIMESTAMPTZ;
v_usuario_id UUID;
v_url TEXT;
v_service_role_key TEXT;
v_response JSONB;
v_http_response RECORD;
BEGIN IF p_telefono IS NULL
OR LENGTH(TRIM(p_telefono)) < 10 THEN RETURN jsonb_build_object(
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
    )
VALUES (
        p_telefono,
        v_codigo,
        v_expira_en,
        v_usuario_id
    );
-- Llamar directamente a la edge function
v_url := 'https://kqxnjpyupcxbajuzsbtx.supabase.co/functions/v1/send-whatsapp-code';
v_service_role_key := 'TU_SERVICE_ROLE_KEY_AQUI';
-- REEMPLAZA ESTO
-- Usar pg_net para llamar a la edge function
BEGIN
SELECT * INTO v_http_response
FROM net.http_post(
        url := v_url,
        headers := jsonb_build_object(
            'Content-Type',
            'application/json',
            'Authorization',
            'Bearer ' || v_service_role_key
        )::jsonb,
        body := jsonb_build_object(
            'telefono',
            p_telefono,
            'codigo',
            v_codigo
        )::jsonb
    );
-- Si la llamada fue exitosa, retornar éxito
RETURN jsonb_build_object(
    'success',
    true,
    'message',
    'Código generado y enviado exitosamente',
    'codigo',
    v_codigo,
    -- Solo para desarrollo/debug
    'expira_en',
    v_expira_en
);
EXCEPTION
WHEN OTHERS THEN -- Si falla el envío, igual retornar éxito pero con advertencia
-- El código ya está guardado, el usuario puede pedir reenvío
RAISE WARNING 'Error al enviar código por WhatsApp: %',
SQLERRM;
RETURN jsonb_build_object(
    'success',
    true,
    'message',
    'Código generado pero no se pudo enviar por WhatsApp',
    'codigo',
    v_codigo,
    -- Retornar código para desarrollo
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
-- ============================================================================
-- NOTAS:
-- ============================================================================
-- 1. Esta versión NO depende del trigger
-- 2. Llama directamente a la edge function desde la RPC
-- 3. Si falla el envío, igual guarda el código (el usuario puede pedir reenvío)
-- 4. IMPORTANTE: Reemplaza 'TU_SERVICE_ROLE_KEY_AQUI' con tu service_role_key
-- 5. Asegúrate de que pg_net esté habilitada
-- ============================================================================