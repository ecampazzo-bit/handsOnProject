-- ============================================================================
-- CONFIGURAR TRIGGER PARA LLAMAR A EDGE FUNCTION DE WHATSAPP
-- ============================================================================
-- Este script configura un trigger que llama automáticamente a la edge function
-- cuando se inserta un nuevo código de verificación
-- ============================================================================

-- Opción 1: Usar pg_net (Recomendado - más confiable)
-- ============================================================================

-- Habilitar extensión pg_net si no está habilitada
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Crear función que llama a la edge function
CREATE OR REPLACE FUNCTION public.trigger_send_whatsapp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_url TEXT;
    v_service_role_key TEXT;
BEGIN
    -- URL de tu edge function
    v_url := 'https://kqxnjpyupcxbajuzsbtx.supabase.co/functions/v1/send-whatsapp-code';
    
    -- Obtener service_role_key desde las configuraciones del proyecto
    -- Nota: En producción, deberías almacenar esto de forma segura
    -- Por ahora, puedes pasarlo como parámetro o usar una variable de entorno
    
    -- Intentar obtener de la configuración (si está disponible)
    BEGIN
        v_service_role_key := current_setting('app.settings.service_role_key', true);
    EXCEPTION
        WHEN OTHERS THEN
            -- Si no está disponible, usar anon key (menos seguro pero funciona)
            v_service_role_key := current_setting('app.settings.anon_key', true);
    END;
    
    -- Llamar a la edge function usando pg_net
    PERFORM
        net.http_post(
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
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log el error pero no fallar la inserción del código
        RAISE WARNING 'Error al llamar edge function para WhatsApp: %', SQLERRM;
        -- Continuar con la inserción aunque falle el envío
        RETURN NEW;
END;
$$;

-- Crear el trigger
DROP TRIGGER IF EXISTS trigger_send_whatsapp ON public.codigos_verificacion;
CREATE TRIGGER trigger_send_whatsapp
AFTER INSERT ON public.codigos_verificacion
FOR EACH ROW
WHEN (NEW.usado = false) -- Solo enviar si el código no está usado
EXECUTE FUNCTION public.trigger_send_whatsapp();

-- ============================================================================
-- ALTERNATIVA: Usar http extension (si pg_net no está disponible)
-- ============================================================================

/*
-- Habilitar extensión http
CREATE EXTENSION IF NOT EXISTS http;

-- Función alternativa usando http
CREATE OR REPLACE FUNCTION public.trigger_send_whatsapp_http()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_url TEXT;
    v_response http_response;
BEGIN
    v_url := 'https://kqxnjpyupcxbajuzsbtx.supabase.co/functions/v1/send-whatsapp-code';
    
    SELECT * INTO v_response
    FROM http_post(
        v_url,
        jsonb_build_object(
            'telefono', NEW.telefono,
            'codigo', NEW.codigo
        )::text,
        'application/json'
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error al llamar edge function: %', SQLERRM;
        RETURN NEW;
END;
$$;
*/

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Verificar que el trigger existe
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_send_whatsapp';

-- Probar insertando un código (debería activar el trigger)
-- NOTA: Esto solo funciona si la edge function está desplegada
/*
INSERT INTO public.codigos_verificacion (
    telefono,
    codigo,
    expira_en
) VALUES (
    '+5491112345678',
    '123456',
    NOW() + INTERVAL '15 minutes'
);
*/

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- 1. El trigger se ejecuta DESPUÉS de insertar el código
-- 2. Si la edge function falla, el código igual se guarda (no bloquea)
-- 3. El trigger solo se activa para códigos nuevos (usado = false)
-- 4. Necesitas tener la edge function desplegada para que funcione
-- 5. Asegúrate de configurar las variables de entorno en la edge function
-- ============================================================================

