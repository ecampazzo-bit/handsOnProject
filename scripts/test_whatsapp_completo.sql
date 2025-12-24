-- ============================================================================
-- TEST COMPLETO DE WHATSAPP - DIAGNÓSTICO
-- ============================================================================
-- Ejecuta estos queries uno por uno para diagnosticar el problema
-- ============================================================================

-- 1. Verificar que la función RPC existe
-- ============================================================================
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'enviar_codigo_whatsapp';

-- 2. Verificar que el trigger existe
-- ============================================================================
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_send_whatsapp';

-- 3. Verificar extensión pg_net
-- ============================================================================
SELECT 
    extname,
    extversion
FROM pg_extension
WHERE extname = 'pg_net';

-- Si no existe, ejecuta:
-- CREATE EXTENSION IF NOT EXISTS pg_net;

-- 4. Verificar tabla de códigos
-- ============================================================================
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'codigos_verificacion';

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

-- 6. Probar la función RPC directamente
-- ============================================================================
-- NOTA: Reemplaza el teléfono con uno válido que esté en tu lista de Twilio
-- IMPORTANTE: El teléfono debe estar en formato internacional: +5491112345678
/*
SELECT * FROM public.enviar_codigo_whatsapp('+5491112345678');
*/

-- 7. Verificar configuración del trigger
-- ============================================================================
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgenabled as enabled
FROM pg_trigger
WHERE tgname = 'trigger_send_whatsapp';

-- 8. Insertar código de prueba (esto activará el trigger)
-- ============================================================================
-- NOTA: Reemplaza el teléfono con uno válido
-- IMPORTANTE: El teléfono debe estar en formato internacional: +5491112345678
/*
INSERT INTO public.codigos_verificacion (
    telefono,
    codigo,
    expira_en
) VALUES (
    '+5491112345678',  -- Cambiar por tu número
    '123456',
    NOW() + INTERVAL '15 minutes'
) RETURNING *;
*/

-- 9. Verificar logs de pg_net (si está disponible)
-- ============================================================================
-- SELECT * FROM net.http_request_queue
-- ORDER BY created DESC
-- LIMIT 10;

-- ============================================================================
-- INTERPRETACIÓN DE RESULTADOS
-- ============================================================================

-- Si la función RPC no existe:
-- → Ejecuta: scripts/add_phone_verification.sql

-- Si el trigger no existe:
-- → Ejecuta: scripts/setup_whatsapp_trigger_fixed.sql
-- → IMPORTANTE: Reemplaza el service_role_key

-- Si pg_net no está habilitada:
-- → Ve a Database > Extensions y habilita pg_net

-- Si los códigos se insertan pero no se envían:
-- → Revisa los logs de la edge function
-- → Verifica que la edge function esté desplegada
-- → Verifica las variables de entorno
-- → Verifica que estés en el WhatsApp Sandbox (si usas sandbox)

-- ============================================================================

