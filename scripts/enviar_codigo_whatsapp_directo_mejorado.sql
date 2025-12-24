-- ============================================================================
-- RPC DIRECTA MEJORADA: Llamar a Edge Function Directamente
-- ============================================================================
-- Esta versión llama directamente a la edge function sin depender del trigger
-- Funciona igual desde SQL y desde la app
-- ============================================================================
-- IMPORTANTE: Reemplaza 'TU_SERVICE_ROLE_KEY_AQUI' con tu service_role_key real
-- Puedes encontrarlo en: Supabase Dashboard > Settings > API > service_role key
-- El service_role_key debe ser un JWT largo (empieza con eyJ...)
-- NO uses el que empieza con sb_publishable_ (ese es el anon_key)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.enviar_codigo_whatsapp(p_telefono TEXT) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_codigo TEXT;
v_expira_en TIMESTAMPTZ;
v_usuario_id UUID;
v_url TEXT;
v_service_role_key TEXT;
v_http_response RECORD;
v_telefono_normalizado TEXT;
BEGIN -- Normalizar teléfono (usar la función si existe, sino normalizar manualmente)
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
    )
VALUES (
        v_telefono_normalizado,
        v_codigo,
        v_expira_en,
        v_usuario_id
    );
-- Llamar directamente a la edge function
v_url := 'https://kqxnjpyupcxbajuzsbtx.supabase.co/functions/v1/send-whatsapp-code';
-- IMPORTANTE: Reemplaza esto con tu service_role_key real
-- Debe ser el JWT secreto, NO el anon_key
v_service_role_key := 'sb_secret_mcxbtxfJQPsXOxFxVmnkAQ_lBX9uGEX';
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
            v_telefono_normalizado,
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
    'telefono_normalizado',
    v_telefono_normalizado,
    'expira_en',
    v_expira_en,
    'http_status',
    v_http_response.status_code
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
-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- 1. Esta versión NO depende del trigger
-- 2. Llama directamente a la edge function desde la RPC
-- 3. Si falla el envío, igual guarda el código (el usuario puede pedir reenvío)
-- 4. IMPORTANTE: Reemplaza 'TU_SERVICE_ROLE_KEY_AQUI' con tu service_role_key
-- 5. El service_role_key debe ser el JWT secreto (empieza con eyJ...)
-- 6. NO uses el anon_key (empieza con sb_publishable_)
-- 7. Asegúrate de que pg_net esté habilitada
-- 8. Usa normalización de teléfono para consistencia
-- ============================================================================