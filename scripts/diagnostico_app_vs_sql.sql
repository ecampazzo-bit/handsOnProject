-- ============================================================================
-- DIAGNÓSTICO: Funciona desde SQL pero no desde la App
-- ============================================================================
-- Este script ayuda a diagnosticar por qué funciona desde SQL pero no desde la app
-- ============================================================================

-- 1. Verificar la función actual
-- ============================================================================
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'enviar_codigo_whatsapp';

-- 2. Verificar llamadas HTTP recientes
-- ============================================================================
SELECT 
    id,
    url,
    method,
    created,
    error_msg,
    request_headers->>'Authorization' as auth_header
FROM net.http_request_queue
WHERE url LIKE '%send-whatsapp-code%'
ORDER BY created DESC
LIMIT 10;

-- 3. Verificar si hay diferencias en los códigos generados
-- ============================================================================
SELECT 
    telefono,
    codigo,
    usado,
    creado_en,
    expira_en,
    usuario_id
FROM public.codigos_verificacion
ORDER BY creado_en DESC
LIMIT 10;

-- 4. Probar la función directamente (simulando llamada desde app)
-- ============================================================================
-- Ejecuta esto y compara con lo que hace la app
/*
SELECT * FROM public.enviar_codigo_whatsapp('+5493804663809');
*/

-- 5. Verificar permisos RLS
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'codigos_verificacion';

-- 6. Verificar que la función tenga SECURITY DEFINER
-- ============================================================================
SELECT 
    routine_name,
    security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'enviar_codigo_whatsapp';

-- ============================================================================
-- POSIBLES PROBLEMAS
-- ============================================================================
-- 1. La función puede no tener SECURITY DEFINER → No puede insertar
-- 2. RLS puede estar bloqueando la inserción desde la app
-- 3. pg_net puede no estar funcionando cuando se llama desde la app
-- 4. El service_role_key puede ser incorrecto
-- ============================================================================

