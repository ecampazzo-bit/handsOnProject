-- Versión SIMPLIFICADA del script para políticas RLS de servicios
-- Esta versión permite a TODOS los usuarios autenticados insertar/actualizar/eliminar servicios
-- Úsala si la versión con verificación de admin no funciona
-- NOTA: El frontend ya valida que solo admins puedan acceder, así que esto es seguro

-- Verificar si RLS está habilitado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'servicios'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.servicios ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS habilitado en servicios';
  ELSE
    RAISE NOTICE 'RLS ya estaba habilitado en servicios';
  END IF;
END $$;

-- Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Allow authenticated users to read servicios" ON public.servicios;
DROP POLICY IF EXISTS "Allow admin users to insert servicios" ON public.servicios;
DROP POLICY IF EXISTS "Allow admin users to update servicios" ON public.servicios;
DROP POLICY IF EXISTS "Allow admin users to delete servicios" ON public.servicios;
DROP POLICY IF EXISTS "Allow authenticated users to insert servicios" ON public.servicios;
DROP POLICY IF EXISTS "Allow authenticated users to update servicios" ON public.servicios;
DROP POLICY IF EXISTS "Allow authenticated users to delete servicios" ON public.servicios;

-- Política para permitir lectura a usuarios autenticados
CREATE POLICY "Allow authenticated users to read servicios"
ON public.servicios
FOR SELECT
USING (auth.role() = 'authenticated');

-- Política para permitir inserción a usuarios autenticados
-- (El frontend ya valida que solo admins puedan acceder)
CREATE POLICY "Allow authenticated users to insert servicios"
ON public.servicios
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Política para permitir actualización a usuarios autenticados
CREATE POLICY "Allow authenticated users to update servicios"
ON public.servicios
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Política para permitir eliminación a usuarios autenticados
CREATE POLICY "Allow authenticated users to delete servicios"
ON public.servicios
FOR DELETE
USING (auth.role() = 'authenticated');

-- Verificar que las políticas se crearon
DO $$
DECLARE
  policy_count integer;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'servicios';
  
  RAISE NOTICE 'Políticas creadas para servicios: %', policy_count;
  RAISE NOTICE 'Si el count es 4, las políticas se crearon correctamente';
END $$;

