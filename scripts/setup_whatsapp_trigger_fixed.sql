-- ============================================================================
-- TRIGGER MEJORADO PARA WHATSAPP - VERSIÓN CON SERVICE_ROLE_KEY HARDCODEADO
-- ============================================================================
-- IMPORTANTE: Reemplaza 'TU_SERVICE_ROLE_KEY_AQUI' con tu service_role_key real
-- Puedes encontrarlo en: Supabase Dashboard > Settings > API > service_role key
-- ============================================================================
-- Habilitar extensión pg_net si no está habilitada
CREATE EXTENSION IF NOT EXISTS pg_net;
-- Crear función que llama a la edge function
CREATE OR REPLACE FUNCTION public.trigger_send_whatsapp() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_url TEXT;
v_service_role_key TEXT;
BEGIN -- URL de tu edge function
v_url := 'https://kqxnjpyupcxbajuzsbtx.supabase.co/functions/v1/send-whatsapp-code';
-- IMPORTANTE: Reemplaza esto con tu service_role_key real
-- Puedes encontrarlo en: Supabase Dashboard > Settings > API > service_role key
v_service_role_key := 'sb_publishable_ztPj9JwZiHUO_CcW6VnSlA_BePbKtt0';
-- Si prefieres usar una variable de configuración, puedes crear una tabla de configuración:
-- SELECT value INTO v_service_role_key FROM app_config WHERE key = 'service_role_key';
-- Llamar a la edge function usando pg_net
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
        NEW.telefono,
        'codigo',
        NEW.codigo
    )::jsonb
);
RETURN NEW;
EXCEPTION
WHEN OTHERS THEN -- Log el error pero no fallar la inserción del código
RAISE WARNING 'Error al llamar edge function para WhatsApp: %',
SQLERRM;
-- Continuar con la inserción aunque falle el envío
RETURN NEW;
END;
$$;
-- Crear el trigger
DROP TRIGGER IF EXISTS trigger_send_whatsapp ON public.codigos_verificacion;
CREATE TRIGGER trigger_send_whatsapp
AFTER
INSERT ON public.codigos_verificacion FOR EACH ROW
    WHEN (NEW.usado = false) -- Solo enviar si el código no está usado
    EXECUTE FUNCTION public.trigger_send_whatsapp();
-- ============================================================================
-- ALTERNATIVA: Usar tabla de configuración (más seguro)
-- ============================================================================
/*
 -- Crear tabla de configuración
 CREATE TABLE IF NOT EXISTS public.app_config (
 key TEXT PRIMARY KEY,
 value TEXT NOT NULL,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 );
 
 -- Insertar service_role_key (hazlo manualmente desde el dashboard)
 -- INSERT INTO public.app_config (key, value) 
 -- VALUES ('service_role_key', 'TU_SERVICE_ROLE_KEY_AQUI')
 -- ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
 
 -- Función mejorada que lee de la tabla
 CREATE OR REPLACE FUNCTION public.trigger_send_whatsapp()
 RETURNS TRIGGER
 LANGUAGE plpgsql
 SECURITY DEFINER
 AS $$
 DECLARE
 v_url TEXT;
 v_service_role_key TEXT;
 BEGIN
 v_url := 'https://kqxnjpyupcxbajuzsbtx.supabase.co/functions/v1/send-whatsapp-code';
 
 -- Leer service_role_key de la tabla de configuración
 SELECT value INTO v_service_role_key
 FROM public.app_config
 WHERE key = 'service_role_key';
 
 IF v_service_role_key IS NULL THEN
 RAISE WARNING 'service_role_key no configurado en app_config';
 RETURN NEW;
 END IF;
 
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
 RAISE WARNING 'Error al llamar edge function para WhatsApp: %', SQLERRM;
 RETURN NEW;
 END;
 $$;
 */