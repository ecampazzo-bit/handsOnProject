-- ============================================================================
-- VERIFICACIÓN DE FUNCIONES RPC CRÍTICAS PARA EL REGISTRO
-- Ejecuta este script ANTES de aplicar fix_security_rls_policies.sql
-- ============================================================================

-- Verificar si existen las funciones RPC críticas
SELECT 
    proname as function_name,
    prosecdef as is_security_definer,
    CASE 
        WHEN prosecdef THEN '✅ IGNORA RLS (seguro)'
        ELSE '⚠️ DEPENDE DE RLS (puede fallar)'
    END as security_status,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname IN ('insert_user_profile', 'insert_prestador', 'save_prestador_servicios')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;

-- Si no aparecen resultados, las funciones NO EXISTEN y necesitas crearlas
-- Ver el archivo crear_funciones_rpc_registro.sql para crearlas
