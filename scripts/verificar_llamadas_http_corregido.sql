-- ============================================================================
-- VERIFICAR LLAMADAS HTTP DESDE pg_net (CORREGIDO)
-- ============================================================================
-- Este script verifica si las llamadas HTTP a la edge function se están haciendo
-- ============================================================================

-- Ver últimas llamadas HTTP
SELECT 
    id,
    url,
    method,
    created,
    error_msg
FROM net.http_request_queue
ORDER BY created DESC
LIMIT 10;

-- Ver solo llamadas a la edge function de WhatsApp
SELECT 
    id,
    url,
    method,
    created,
    error_msg
FROM net.http_request_queue
WHERE url LIKE '%send-whatsapp-code%'
ORDER BY created DESC
LIMIT 10;

-- Ver llamadas con errores
SELECT 
    id,
    url,
    method,
    created,
    error_msg
FROM net.http_request_queue
WHERE error_msg IS NOT NULL
ORDER BY created DESC
LIMIT 10;

-- Ver todas las columnas disponibles (para debug)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'net'
  AND table_name = 'http_request_queue'
ORDER BY ordinal_position;

-- ============================================================================
-- INTERPRETACIÓN
-- ============================================================================
-- Si NO hay registros:
-- → pg_net no está haciendo las llamadas
-- → Verifica que pg_net esté habilitada
-- → Verifica que el service_role_key sea correcto
--
-- Si hay registros pero hay error_msg:
-- → La llamada HTTP falló
-- → Revisa el error_msg para ver el problema
--
-- Si hay registros sin error_msg:
-- → La llamada HTTP se hizo correctamente
-- → El problema puede estar en la edge function o en Twilio
-- ============================================================================

