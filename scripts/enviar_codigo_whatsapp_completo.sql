-- ============================================================================
-- SCRIPT COMPLETO: RPC Directa con Normalización de Teléfono
-- ============================================================================
-- Este script crea primero la función de normalización y luego la RPC mejorada
-- Ejecuta TODO este script de una vez
-- ============================================================================
-- PASO 1: Crear función de normalización de teléfono
-- ============================================================================
CREATE OR REPLACE FUNCTION public.normalizar_telefono(p_telefono TEXT) RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE v_telefono TEXT;
BEGIN -- Remover espacios
v_telefono := TRIM(p_telefono);
-- Remover caracteres no numéricos excepto +
v_telefono := REGEXP_REPLACE(v_telefono, '[^0-9+]', '', 'g');
-- Asegurar que empiece con +
IF NOT v_telefono LIKE '+%' THEN -- Si empieza con 0, reemplazar con +54
IF v_telefono LIKE '0%' THEN v_telefono := '+54' || SUBSTRING(
    v_telefono
    FROM 2
);
-- Si no tiene código de país, agregar +54
ELSIF LENGTH(v_telefono) < 12 THEN v_telefono := '+54' || v_telefono;
ELSE v_telefono := '+' || v_telefono;
END IF;
END IF;
RETURN v_telefono;
END;
$$;
-- PASO 2: Crear/Actualizar función enviar_codigo_whatsapp con llamada directa
-- ============================================================================
CREATE OR REPLACE FUNCTION public.enviar_codigo_whatsapp(p_telefono TEXT) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_codigo TEXT;
v_expira_en TIMESTAMPTZ;
v_usuario_id UUID;
v_url TEXT;
v_service_role_key TEXT;
v_telefono_normalizado TEXT;
BEGIN -- Normalizar teléfono usando la función
v_telefono_normalizado := public.normalizar_telefono(p_telefono);
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
-- Service role key (ya configurado)
v_service_role_key := 'sb_secret_mcxbtxfJQPsXOxFxVmnkAQ_lBX9uGEX';
-- Usar pg_net para llamar a la edge function
BEGIN -- pg_net.http_post retorna un job_id, no la respuesta directa
-- La llamada se hace de forma asíncrona
PERFORM net.http_post(
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
-- Si la llamada fue exitosa (no lanzó excepción), retornar éxito
-- Nota: pg_net hace la llamada de forma asíncrona, así que no podemos
-- verificar el status_code inmediatamente, pero si no hay error, asumimos éxito
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
    v_expira_en
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
-- VERIFICACIÓN
-- ============================================================================
-- Verificar que ambas funciones existen
SELECT routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_name IN ('normalizar_telefono', 'enviar_codigo_whatsapp')
ORDER BY routine_name;
-- Probar la función de normalización
SELECT 'Original: +5491112345678' as test,
    public.normalizar_telefono('+5491112345678') as resultado
UNION ALL
SELECT 'Original: 091112345678',
    public.normalizar_telefono('091112345678')
UNION ALL
SELECT 'Original: 91112345678',
    public.normalizar_telefono('91112345678');
-- ============================================================================
-- NOTAS
-- ============================================================================
-- 1. Este script crea ambas funciones necesarias
-- 2. La función normalizar_telefono normaliza el formato del teléfono
-- 3. La función enviar_codigo_whatsapp llama directamente a la edge function
-- 4. No depende del trigger, funciona igual desde SQL y desde la app
-- 5. El service_role_key ya está configurado
-- ============================================================================