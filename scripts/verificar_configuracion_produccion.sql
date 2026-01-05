-- ============================================================================
-- VERIFICAR CONFIGURACIÓN PARA PRODUCCIÓN
-- ============================================================================
-- Este script ayuda a verificar que todo esté listo para producción
-- ============================================================================

-- 1. Verificar que existe la tabla de códigos de verificación
-- ============================================================================
SELECT 
    'Tabla codigos_verificacion' as check_item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'codigos_verificacion' 
              AND table_schema = 'public'
        )
        THEN '✅ Existe'
        ELSE '❌ NO EXISTE - Ejecuta: scripts/add_phone_verification.sql'
    END as estado;

-- 2. Verificar que existe el campo telefono_verificado
-- ============================================================================
SELECT 
    'Campo telefono_verificado' as check_item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' 
              AND column_name = 'telefono_verificado'
              AND table_schema = 'public'
        )
        THEN '✅ Existe'
        ELSE '❌ NO EXISTE - Ejecuta: scripts/add_phone_verification.sql'
    END as estado;

-- 3. Verificar que existen las funciones RPC
-- ============================================================================
SELECT 
    'Funciones RPC' as check_item,
    routine_name,
    security_type,
    CASE 
        WHEN security_type = 'DEFINER' THEN '✅ Configurada correctamente'
        ELSE '⚠️ Revisar configuración'
    END as estado
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('enviar_codigo_whatsapp', 'verificar_codigo_whatsapp', 'normalizar_telefono', 'generar_codigo_otp')
ORDER BY routine_name;

-- 4. Verificar formato de teléfonos en usuarios
-- ============================================================================
SELECT 
    'Formato de teléfonos' as check_item,
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN public.normalizar_telefono(telefono) LIKE '+54%' THEN 1 END) as formato_correcto,
    COUNT(CASE WHEN public.normalizar_telefono(telefono) NOT LIKE '+54%' THEN 1 END) as formato_incorrecto
FROM public.users;

-- 5. Verificar códigos recientes
-- ============================================================================
SELECT 
    'Códigos recientes' as check_item,
    COUNT(*) as total_codigos,
    COUNT(CASE WHEN usado = false AND expira_en > NOW() THEN 1 END) as codigos_activos,
    COUNT(CASE WHEN usado = true THEN 1 END) as codigos_usados,
    COUNT(CASE WHEN expira_en < NOW() THEN 1 END) as codigos_expirados
FROM public.codigos_verificacion
WHERE creado_en > NOW() - INTERVAL '24 hours';

-- ============================================================================
-- CONFIGURACIÓN DE EDGE FUNCTION (Verificar manualmente)
-- ============================================================================
-- En Supabase Dashboard → Edge Functions → send-whatsapp-code → Settings/Secrets
-- 
-- Variables requeridas:
-- ✅ TWILIO_ACCOUNT_SID = (tu Account SID)
-- ✅ TWILIO_AUTH_TOKEN = (tu Auth Token)
-- ✅ TWILIO_WHATSAPP_NUMBER = whatsapp:+549XXXXXXXXX (tu número de producción)
--
-- Para sandbox era: whatsapp:+14155238886
-- Para producción debe ser: whatsapp:+549XXXXXXXXX (tu número)
-- ============================================================================

-- ============================================================================
-- CHECKLIST DE PRODUCCIÓN
-- ============================================================================
-- 1. ✅ Tabla codigos_verificacion existe
-- 2. ✅ Campo telefono_verificado existe
-- 3. ✅ Funciones RPC configuradas (SECURITY DEFINER)
-- 4. ✅ Formato de teléfonos correcto (+54...)
-- 5. ⚠️ Edge Function configurada (verificar manualmente)
-- 6. ⚠️ Número de WhatsApp obtenido (verificar en Twilio)
-- 7. ⚠️ Caso de uso aprobado (verificar en Twilio)
-- ============================================================================

