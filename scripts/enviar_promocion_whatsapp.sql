-- ============================================================================
-- FUNCIÓN PARA ENVIAR PROMOCIÓN POR WHATSAPP
-- ============================================================================
-- Esta función envía un mensaje automático de WhatsApp cuando un usuario
-- solicita usar una promoción. El mensaje incluye el nombre de la promoción.
-- ============================================================================
-- Función para enviar promoción por WhatsApp
CREATE OR REPLACE FUNCTION public.enviar_promocion_whatsapp(
        p_promocion_id uuid,
        p_usuario_telefono text DEFAULT NULL
    ) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public,
    extensions AS $$
DECLARE v_promocion RECORD;
v_whatsapp text;
v_mensaje text;
v_service_role_key text;
v_supabase_url text;
BEGIN -- Obtener información de la promoción
SELECT titulo,
    codigo_cupon,
    whatsapp INTO v_promocion
FROM public.promociones
WHERE id = p_promocion_id
    AND activa = true
    AND estado = 'activa'
    AND fecha_inicio <= now()
    AND fecha_fin >= now();
-- Verificar que la promoción existe y está activa
IF NOT FOUND THEN RETURN jsonb_build_object(
    'success',
    false,
    'error',
    'Promoción no encontrada o no disponible'
);
END IF;
-- Verificar que tiene WhatsApp configurado
IF v_promocion.whatsapp IS NULL
OR v_promocion.whatsapp = '' THEN RETURN jsonb_build_object(
    'success',
    false,
    'error',
    'La promoción no tiene WhatsApp configurado'
);
END IF;
v_whatsapp := v_promocion.whatsapp;
-- Construir mensaje con formato: "Quiero mi promoción: [nombre]"
v_mensaje := 'Quiero mi promoción: ' || v_promocion.titulo;
IF v_promocion.codigo_cupon IS NOT NULL
AND v_promocion.codigo_cupon != '' THEN v_mensaje := v_mensaje || E'\nCódigo: ' || v_promocion.codigo_cupon;
END IF;
-- Obtener service_role_key y supabase_url
-- NOTA: ⚠️ IMPORTANTE: Reemplaza estos valores con tus credenciales reales
-- Opción 1: Usar valores hardcodeados (más simple)
v_service_role_key := 'TU_SERVICE_ROLE_KEY_AQUI';
-- ⚠️ REEMPLAZAR
v_supabase_url := 'https://kqxnjpyupcxbajuzsbtx.supabase.co';
-- ⚠️ REEMPLAZAR si es diferente
-- Opción 2: Intentar obtener desde configuración (requiere configuración previa)
-- BEGIN
--   v_service_role_key := current_setting('app.settings.service_role_key', true);
--   IF v_service_role_key IS NULL THEN
--     v_service_role_key := 'TU_SERVICE_ROLE_KEY_AQUI'; -- Fallback
--   END IF;
--   v_supabase_url := current_setting('app.settings.supabase_url', true);
--   IF v_supabase_url IS NULL THEN
--     v_supabase_url := 'https://kqxnjpyupcxbajuzsbtx.supabase.co';
--   END IF;
-- EXCEPTION
--   WHEN OTHERS THEN
--     -- Usar valores por defecto si falla
--     v_service_role_key := 'TU_SERVICE_ROLE_KEY_AQUI';
--     v_supabase_url := 'https://kqxnjpyupcxbajuzsbtx.supabase.co';
-- END;
-- Llamar a la Edge Function de WhatsApp para promociones
BEGIN PERFORM net.http_post(
    url := v_supabase_url || '/functions/v1/send-whatsapp-promocion',
    headers := jsonb_build_object(
        'Content-Type',
        'application/json',
        'Authorization',
        'Bearer ' || v_service_role_key
    ),
    body := jsonb_build_object(
        'to',
        v_whatsapp,
        'message',
        v_mensaje
    )
);
EXCEPTION
WHEN OTHERS THEN -- Si falla la llamada HTTP, registrar pero no fallar completamente
RAISE WARNING 'Error al llamar Edge Function: %',
SQLERRM;
END;
-- Registrar el uso de la promoción
INSERT INTO public.promociones_uso (
        promocion_id,
        usuario_id,
        codigo_usado,
        fecha_uso
    )
VALUES (
        p_promocion_id,
        auth.uid(),
        v_promocion.codigo_cupon,
        now()
    ) ON CONFLICT DO NOTHING;
RETURN jsonb_build_object(
    'success',
    true,
    'message',
    'Mensaje de WhatsApp enviado exitosamente',
    'promocion_titulo',
    v_promocion.titulo,
    'whatsapp_destino',
    v_whatsapp
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
-- Comentario
COMMENT ON FUNCTION public.enviar_promocion_whatsapp IS 'Envía un mensaje automático de WhatsApp cuando un usuario solicita una promoción. 
El mensaje incluye "Quiero mi promoción: [nombre de la promoción]" y el código de cupón si está disponible.';
-- ============================================================================
-- NOTAS:
-- ============================================================================
-- 1. Esta función requiere que la Edge Function de WhatsApp esté configurada
--    y accesible desde la URL de Supabase.
--
-- 2. Necesitas configurar las variables de configuración:
--    - app.settings.service_role_key
--    - app.settings.supabase_url
--
-- 3. Alternativamente, puedes modificar la función para usar valores hardcodeados
--    o obtenerlos de una tabla de configuración.
--
-- 4. El mensaje se envía al número de WhatsApp configurado en la promoción.
--
-- 5. Ejemplo de uso desde la app:
--    SELECT * FROM enviar_promocion_whatsapp('promocion_id_uuid');
-- ============================================================================