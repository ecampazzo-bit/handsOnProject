-- ============================================================================
-- DIAGNÓSTICO: Twilio Monitor Muestra "Failed"
-- ============================================================================
-- Este script ayuda a diagnosticar por qué Twilio está fallando
-- ============================================================================

-- 1. Verificar últimas llamadas a la Edge Function
-- ============================================================================
SELECT 
    'Últimas llamadas HTTP' as tipo,
    id,
    url,
    method,
    created,
    error_msg,
    status_code,
    CASE 
        WHEN status_code = 200 THEN '✅ OK'
        WHEN status_code >= 400 AND status_code < 500 THEN '❌ Error Cliente'
        WHEN status_code >= 500 THEN '❌ Error Servidor'
        ELSE '⚠️ Desconocido'
    END as estado
FROM net.http_request_queue
WHERE url LIKE '%send-whatsapp-code%'
ORDER BY created DESC
LIMIT 10;

-- 2. Verificar códigos generados recientemente
-- ============================================================================
SELECT 
    'Códigos de verificación' as tipo,
    id,
    telefono,
    public.normalizar_telefono(telefono) as telefono_normalizado,
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
    LENGTH(telefono) as longitud_original,
    LENGTH(public.normalizar_telefono(telefono)) as longitud_normalizado,
    CASE 
        WHEN public.normalizar_telefono(telefono) LIKE '+54%' THEN '✅ Formato correcto'
        WHEN public.normalizar_telefono(telefono) LIKE '+%' THEN '⚠️ Formato internacional pero no Argentina'
        ELSE '❌ Formato incorrecto'
    END as validacion_formato
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- 4. Probar normalización de teléfono
-- ============================================================================
SELECT 
    'Prueba de normalización' as tipo,
    'Original: +5493804663809' as entrada,
    public.normalizar_telefono('+5493804663809') as salida,
    CASE 
        WHEN public.normalizar_telefono('+5493804663809') = '+5493804663809' THEN '✅ Correcto'
        ELSE '❌ Incorrecto'
    END as resultado
UNION ALL
SELECT 
    'Prueba de normalización',
    'Original: 093804663809',
    public.normalizar_telefono('093804663809'),
    CASE 
        WHEN public.normalizar_telefono('093804663809') LIKE '+54%' THEN '✅ Correcto'
        ELSE '❌ Incorrecto'
    END
UNION ALL
SELECT 
    'Prueba de normalización',
    'Original: 93804663809',
    public.normalizar_telefono('93804663809'),
    CASE 
        WHEN public.normalizar_telefono('93804663809') LIKE '+54%' THEN '✅ Correcto'
        ELSE '❌ Incorrecto'
    END;

-- ============================================================================
-- INSTRUCCIONES PARA VERIFICAR EN TWILIO
-- ============================================================================
-- 1. Ve a: https://console.twilio.com/us1/monitor/logs/messaging
-- 2. Haz clic en el mensaje que falló
-- 3. Revisa la sección "Error Details" o "Error Code"
-- 4. Anota el código de error (ej: 63016, 21211, 20003, etc.)
-- 5. Consulta: scripts/FIX_TWILIO_FAILED.md para la solución específica
-- ============================================================================

-- ============================================================================
-- VERIFICAR CONFIGURACIÓN DE EDGE FUNCTION
-- ============================================================================
-- En Supabase Dashboard → Edge Functions → send-whatsapp-code → Settings/Secrets
-- Debes tener:
-- - TWILIO_ACCOUNT_SID
-- - TWILIO_AUTH_TOKEN  
-- - TWILIO_WHATSAPP_NUMBER = whatsapp:+14155238886 (para sandbox)
-- ============================================================================

