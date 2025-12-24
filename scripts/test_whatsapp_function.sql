-- ============================================================================
-- SCRIPT DE PRUEBA PARA VERIFICAR LA FUNCIÓN DE WHATSAPP
-- ============================================================================
-- Este script ayuda a diagnosticar problemas con el envío de códigos por WhatsApp
-- ============================================================================

-- 1. Verificar que la función RPC existe
-- ============================================================================
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'enviar_codigo_whatsapp';

-- 2. Verificar que el trigger existe
-- ============================================================================
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_send_whatsapp';

-- 3. Verificar extensión pg_net
-- ============================================================================
SELECT 
    extname,
    extversion
FROM pg_extension
WHERE extname = 'pg_net';

-- Si no existe, habilitarla:
-- CREATE EXTENSION IF NOT EXISTS pg_net;

-- 4. Probar insertar un código (esto debería activar el trigger)
-- ============================================================================
-- NOTA: Reemplaza el teléfono con uno válido que esté en tu lista de Twilio
/*
INSERT INTO public.codigos_verificacion (
    telefono,
    codigo,
    expira_en,
    usuario_id
) VALUES (
    '+5491112345678',  -- Cambiar por tu número
    '123456',
    NOW() + INTERVAL '15 minutes',
    NULL
) RETURNING *;
*/

-- 5. Verificar códigos recientes
-- ============================================================================
SELECT 
    id,
    telefono,
    codigo,
    usado,
    creado_en,
    expira_en,
    intentos
FROM public.codigos_verificacion
ORDER BY creado_en DESC
LIMIT 5;

-- 6. Verificar logs de pg_net (si está disponible)
-- ============================================================================
-- SELECT * FROM net.http_request_queue
-- ORDER BY created DESC
-- LIMIT 10;

-- 7. Probar la función RPC directamente
-- ============================================================================
-- NOTA: Esto generará un código y lo intentará enviar
/*
SELECT * FROM public.enviar_codigo_whatsapp('+5491112345678');
*/

-- 8. Verificar configuración del trigger
-- ============================================================================
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgenabled as enabled,
    pg_get_triggerdef(oid) as definition
FROM pg_trigger
WHERE tgname = 'trigger_send_whatsapp';

-- ============================================================================
-- DIAGNÓSTICO DE PROBLEMAS
-- ============================================================================

-- Si el trigger no existe:
-- → Ejecuta: scripts/setup_whatsapp_trigger.sql

-- Si pg_net no está habilitada:
-- → Ve a Database > Extensions y habilita pg_net

-- Si la función RPC no existe:
-- → Ejecuta: scripts/add_phone_verification.sql

-- Si los códigos se insertan pero no se envían:
-- → Revisa los logs de la edge function en Supabase Dashboard
-- → Verifica que la edge function esté desplegada
-- → Verifica las variables de entorno (TWILIO_ACCOUNT_SID, etc.)

-- ============================================================================

