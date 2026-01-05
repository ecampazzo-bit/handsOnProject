-- ============================================================================
-- VERIFICAR ESTADO DE TWILIO SANDBOX
-- ============================================================================
-- Este script ayuda a diagnosticar problemas con el envío de WhatsApp
-- ============================================================================

-- 1. Verificar últimas llamadas a la Edge Function
-- ============================================================================
SELECT 
    'Últimas llamadas a Edge Function' as tipo,
    id,
    url,
    method,
    created,
    error_msg,
    status_code
FROM net.http_request_queue
WHERE url LIKE '%send-whatsapp-code%'
ORDER BY created DESC
LIMIT 10;

-- 2. Verificar códigos generados recientemente
-- ============================================================================
SELECT 
    'Códigos generados recientemente' as tipo,
    id,
    telefono,
    codigo,
    usado,
    intentos,
    creado_en,
    expira_en,
    CASE 
        WHEN usado = true THEN '❌ Usado'
        WHEN expira_en < NOW() THEN '⏰ Expirado'
        ELSE '✅ Activo'
    END as estado
FROM public.codigos_verificacion
ORDER BY creado_en DESC
LIMIT 10;

-- 3. Verificar formato de teléfonos en usuarios
-- ============================================================================
SELECT 
    'Formato de teléfonos' as tipo,
    id,
    email,
    telefono,
    public.normalizar_telefono(telefono) as telefono_normalizado,
    telefono_verificado
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- INSTRUCCIONES PARA VERIFICAR TWILIO
-- ============================================================================
-- 1. Ve a: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
-- 2. Verifica que tu número esté en la lista de permitidos
-- 3. Si NO está, envía WhatsApp desde tu número a: +1 415 523 8886
-- 4. Mensaje: join <codigo> (reemplaza con el código del dashboard)
-- 5. Espera confirmación: "You're all set!"
-- ============================================================================

