-- ============================================================================
-- FIX RLS: Habilitar lectura pública de prestadores
-- ============================================================================
-- El problema es que la tabla prestadores tiene RLS habilitado pero
-- la política no permite lectura correctamente.
-- Verificar políticas actuales
SELECT tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'prestadores'
ORDER BY policyname;
-- Borrar política anterior
DROP POLICY IF EXISTS "Authenticated users can read all prestadores" ON public.prestadores;
-- Crear política que permita lectura pública (cualquiera puede leer)
CREATE POLICY "Public read prestadores" ON public.prestadores FOR
SELECT USING (true);
-- También permitir que usuarios autenticados lean
CREATE POLICY "Authenticated read prestadores" ON public.prestadores FOR
SELECT USING (auth.role() = 'authenticated');
-- Verificar que se crearon
SELECT tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'prestadores'
ORDER BY policyname;