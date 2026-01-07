-- Script para agregar políticas RLS a la tabla servicios
-- Permisos específicos para admin@ofisi.ar
-- Ejecutar este script en el SQL Editor de Supabase

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

-- Crear función para verificar si el usuario es admin@ofisi.ar
CREATE OR REPLACE FUNCTION public.is_admin_ofisi()
RETURNS boolean AS $$
DECLARE
  user_email text;
BEGIN
  -- Obtener el email del token JWT del usuario autenticado
  user_email := (auth.jwt() ->> 'email');
  
  -- Si no hay email en el JWT, intentar obtenerlo de auth.users
  IF user_email IS NULL THEN
    BEGIN
      SELECT email INTO user_email
      FROM auth.users
      WHERE id = auth.uid();
    EXCEPTION
      WHEN OTHERS THEN
        RETURN false;
    END;
  END IF;
  
  -- Verificar si el email es admin@ofisi.ar
  IF user_email IS NULL THEN
    RETURN false;
  END IF;
  
  -- Convertir a minúsculas y comparar
  user_email := lower(trim(user_email));
  
  RETURN user_email = 'admin@ofisi.ar';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Allow authenticated users to read servicios" ON public.servicios;
DROP POLICY IF EXISTS "Allow admin users to insert servicios" ON public.servicios;
DROP POLICY IF EXISTS "Allow admin users to update servicios" ON public.servicios;
DROP POLICY IF EXISTS "Allow admin users to delete servicios" ON public.servicios;
DROP POLICY IF EXISTS "Allow authenticated users to insert servicios" ON public.servicios;
DROP POLICY IF EXISTS "Allow authenticated users to update servicios" ON public.servicios;
DROP POLICY IF EXISTS "Allow authenticated users to delete servicios" ON public.servicios;
DROP POLICY IF EXISTS "Allow admin@ofisi.ar to manage servicios" ON public.servicios;

-- Política para permitir lectura a usuarios autenticados
CREATE POLICY "Allow authenticated users to read servicios"
ON public.servicios
FOR SELECT
USING (auth.role() = 'authenticated');

-- Política para permitir inserción solo a admin@ofisi.ar
CREATE POLICY "Allow admin@ofisi.ar to insert servicios"
ON public.servicios
FOR INSERT
WITH CHECK (auth.role() = 'authenticated' AND public.is_admin_ofisi());

-- Política para permitir actualización solo a admin@ofisi.ar
CREATE POLICY "Allow admin@ofisi.ar to update servicios"
ON public.servicios
FOR UPDATE
USING (auth.role() = 'authenticated' AND public.is_admin_ofisi())
WITH CHECK (auth.role() = 'authenticated' AND public.is_admin_ofisi());

-- Política para permitir eliminación solo a admin@ofisi.ar
CREATE POLICY "Allow admin@ofisi.ar to delete servicios"
ON public.servicios
FOR DELETE
USING (auth.role() = 'authenticated' AND public.is_admin_ofisi());

-- Verificar que las políticas se crearon correctamente
DO $$
DECLARE
  policy_count integer;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'servicios';
  
  RAISE NOTICE 'Políticas creadas para servicios: %', policy_count;
  RAISE NOTICE 'Si el count es 4, las políticas se crearon correctamente';
  
  -- Verificar que la función existe
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin_ofisi') THEN
    RAISE NOTICE 'Función is_admin_ofisi() creada correctamente';
  ELSE
    RAISE WARNING 'La función is_admin_ofisi() no se creó correctamente';
  END IF;
END $$;

-- Script de prueba (ejecutar después de iniciar sesión como admin@ofisi.ar)
-- SELECT public.is_admin_ofisi(); -- Debe retornar true
-- SELECT (auth.jwt() ->> 'email') as current_email; -- Debe mostrar admin@ofisi.ar

