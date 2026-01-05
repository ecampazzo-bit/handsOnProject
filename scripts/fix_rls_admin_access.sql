-- ============================================================================
-- FIX RLS: Permitir acceso de lectura a tablas necesarias para el admin
-- ============================================================================
-- Este script habilita RLS en las tablas que no lo tienen y crea políticas
-- para permitir que usuarios autenticados puedan leer los datos necesarios
-- Categorías: permitir lectura pública
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access for categorias" ON public.categorias;
CREATE POLICY "Public read access for categorias" ON public.categorias FOR
SELECT USING (true);
-- Servicios: permitir lectura pública  
ALTER TABLE public.servicios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access for servicios" ON public.servicios;
CREATE POLICY "Public read access for servicios" ON public.servicios FOR
SELECT USING (true);
-- Prestador_servicios: permitir lectura a usuarios autenticados
ALTER TABLE public.prestador_servicios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated read access for prestador_servicios" ON public.prestador_servicios;
CREATE POLICY "Authenticated read access for prestador_servicios" ON public.prestador_servicios FOR
SELECT USING (auth.role() = 'authenticated');
-- Verificar que las políticas fueron creadas correctamente
SELECT tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('categorias', 'servicios', 'prestador_servicios')
ORDER BY tablename,
    policyname;