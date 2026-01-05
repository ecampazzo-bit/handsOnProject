-- ============================================================================
-- FIX RLS: Habilitar lectura de usuarios para queries administrativas
-- ============================================================================
-- Verificar políticas actuales de users
SELECT tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'users'
ORDER BY policyname;
-- Crear política que permita lectura pública de usuarios
-- (esto es necesario para que el admin pueda obtener datos de usuarios)
CREATE POLICY "Public read users" ON public.users FOR
SELECT USING (true);
-- Verificar que se creó
SELECT tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'users'
ORDER BY policyname;