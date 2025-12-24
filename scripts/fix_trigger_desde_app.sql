-- ============================================================================
-- FIX: Trigger No Funciona Desde la App
-- ============================================================================
-- Este script mejora el trigger para que funcione correctamente desde la app
-- y agrega mejor manejo de errores y logging
-- ============================================================================

-- 1. Verificar y mejorar el trigger con mejor logging
-- ============================================================================
CREATE OR REPLACE FUNCTION public.trigger_send_whatsapp() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
DECLARE 
    v_url TEXT;
    v_service_role_key TEXT;
    v_response RECORD;
    v_error_text TEXT;
BEGIN
    -- URL de tu edge function
    v_url := 'https://kqxnjpyupcxbajuzsbtx.supabase.co/functions/v1/send-whatsapp-code';
    
    -- IMPORTANTE: Reemplaza esto con tu service_role_key real
    -- Puedes encontrarlo en: Supabase Dashboard > Settings > API > service_role key
    v_service_role_key := 'sb_publishable_ztPj9JwZiHUO_CcW6VnSlA_BePbKtt0';
    
    -- Log para debug (solo visible en logs de PostgreSQL)
    RAISE NOTICE 'Trigger activado: telefono=%, codigo=%, usado=%', 
        NEW.telefono, NEW.codigo, NEW.usado;
    
    -- Solo procesar si el código no está usado
    IF NEW.usado = true THEN
        RAISE NOTICE 'Código ya usado, saltando envío';
        RETURN NEW;
    END IF;
    
    -- Intentar llamar a la edge function
    BEGIN
        -- Usar pg_net para hacer la llamada HTTP
        SELECT * INTO v_response
        FROM net.http_post(
            url := v_url,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || v_service_role_key
            )::jsonb,
            body := jsonb_build_object(
                'telefono', NEW.telefono,
                'codigo', NEW.codigo
            )::jsonb
        );
        
        RAISE NOTICE 'Llamada HTTP exitosa: status=%, response_id=%', 
            v_response.status_code, v_response.id;
            
    EXCEPTION
        WHEN OTHERS THEN
            -- Capturar el error pero no fallar la inserción
            v_error_text := SQLERRM;
            RAISE WARNING 'Error al llamar edge function para WhatsApp: %', v_error_text;
            -- Continuar con la inserción aunque falle el envío
    END;
    
    RETURN NEW;
END;
$$;

-- 2. Recrear el trigger
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_send_whatsapp ON public.codigos_verificacion;

CREATE TRIGGER trigger_send_whatsapp
AFTER INSERT ON public.codigos_verificacion
FOR EACH ROW
WHEN (NEW.usado = false) -- Solo enviar si el código no está usado
EXECUTE FUNCTION public.trigger_send_whatsapp();

-- 3. Verificar permisos RLS en codigos_verificacion
-- ============================================================================

-- Verificar políticas RLS existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'codigos_verificacion';

-- Si no hay políticas, crear una que permita insertar códigos
-- (El trigger necesita poder insertar, pero esto se hace con SECURITY DEFINER)
-- Lo importante es que los usuarios puedan insertar a través de la función RPC

-- 4. Verificar que la función RPC tenga permisos correctos
-- ============================================================================

-- La función enviar_codigo_whatsapp ya tiene SECURITY DEFINER,
-- lo que significa que se ejecuta con los permisos del creador de la función
-- Esto debería permitir que inserte en codigos_verificacion

-- 5. Crear función de prueba para verificar el trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION public.test_trigger_whatsapp()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_test_telefono TEXT := '+5491112345678';
    v_test_codigo TEXT := '999999';
    v_result TEXT;
BEGIN
    -- Insertar un código de prueba
    INSERT INTO public.codigos_verificacion (
        telefono,
        codigo,
        expira_en
    ) VALUES (
        v_test_telefono,
        v_test_codigo,
        NOW() + INTERVAL '15 minutes'
    );
    
    -- Verificar que se insertó
    SELECT 
        CASE 
            WHEN COUNT(*) > 0 THEN 'Código insertado correctamente'
            ELSE 'Error: Código no se insertó'
        END
    INTO v_result
    FROM public.codigos_verificacion
    WHERE telefono = v_test_telefono 
      AND codigo = v_test_codigo;
    
    RETURN v_result;
END;
$$;

-- 6. Verificar logs de pg_net (si está disponible)
-- ============================================================================
-- SELECT * FROM net.http_request_queue
-- ORDER BY created DESC
-- LIMIT 10;

-- ============================================================================
-- DIAGNÓSTICO
-- ============================================================================

-- Probar el trigger manualmente:
/*
SELECT public.test_trigger_whatsapp();
*/

-- Ver códigos recientes y verificar que se insertaron:
/*
SELECT 
    telefono,
    codigo,
    usado,
    creado_en,
    expira_en
FROM public.codigos_verificacion
ORDER BY creado_en DESC
LIMIT 5;
*/

-- Verificar que el trigger existe:
/*
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_send_whatsapp';
*/

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- 1. El trigger usa SECURITY DEFINER, por lo que se ejecuta con permisos elevados
-- 2. El trigger captura errores pero no falla la inserción
-- 3. Los logs (RAISE NOTICE) solo son visibles en los logs de PostgreSQL
-- 4. Si el trigger no funciona, verifica:
--    - Que pg_net esté habilitada
--    - Que el service_role_key sea correcto
--    - Que la edge function esté desplegada
--    - Que no haya errores en los logs de PostgreSQL
-- ============================================================================

