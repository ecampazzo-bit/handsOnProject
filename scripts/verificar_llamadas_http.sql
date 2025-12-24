-- ============================================================================
-- VERIFICAR LLAMADAS HTTP DESDE pg_net
-- ============================================================================
-- Este script verifica si las llamadas HTTP a la edge function se están haciendo
-- ============================================================================

-- Ver últimas llamadas HTTP
SELECT 
    id,
    url,
    method,
    created,
    error_msg,
    request_headers,
    request_body
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

-- ============================================================================
-- INTERPRETACIÓN
-- ============================================================================
-- Si NO hay registros:
-- → pg_net no está haciendo las llamadas
-- → Verifica que pg_net esté habilitada
-- → Verifica que el service_role_key sea correcto
--
-- Si hay registros pero status_code != 200:
-- → La edge function está recibiendo la llamada pero hay un error
-- → Revisa los logs de la edge function
--
-- Si hay registros con status_code = 200:
-- → La llamada HTTP funciona
-- → El problema está en Twilio o en el sandbox
-- ============================================================================

