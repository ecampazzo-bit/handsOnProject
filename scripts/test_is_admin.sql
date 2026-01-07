-- Script de prueba para verificar si la función is_admin() funciona correctamente
-- Ejecuta este script DESPUÉS de iniciar sesión como admin en la web
-- Luego ejecuta: SELECT public.is_admin();

-- Verificar si la función existe
SELECT 
  proname as function_name,
  prosrc as function_source
FROM pg_proc
WHERE proname = 'is_admin'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Probar la función (ejecuta esto después de iniciar sesión como admin)
-- SELECT public.is_admin();

-- Verificar el email del usuario actual desde el JWT
-- SELECT (auth.jwt() ->> 'email') as current_user_email;

-- Verificar el rol del usuario actual
-- SELECT auth.role() as current_user_role;

-- Verificar el UID del usuario actual
-- SELECT auth.uid() as current_user_id;

