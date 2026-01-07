-- Script para agregar políticas RLS a la tabla servicios
-- Ejecutar este script en el SQL Editor de Supabase si tienes problemas al agregar servicios
-- Verificar si RLS está habilitado (si no lo está, habilitarlo)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename = 'servicios'
        AND rowsecurity = true
) THEN
ALTER TABLE public.servicios ENABLE ROW LEVEL SECURITY;
END IF;
END $$;
-- Crear función para verificar si un usuario es administrador
-- Los administradores se identifican por su email (contiene "@admin." o es "admin@ofisi.ar")
-- Usamos auth.jwt() para obtener el email del token JWT, que es más confiable
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean AS $$
DECLARE user_email text;
BEGIN -- Obtener el email del token JWT del usuario autenticado
user_email := (auth.jwt()->>'email');
-- Si no hay email en el JWT, intentar obtenerlo de otra forma
IF user_email IS NULL THEN -- Intentar obtener desde auth.users (requiere permisos especiales)
BEGIN
SELECT email INTO user_email
FROM auth.users
WHERE id = auth.uid();
EXCEPTION
WHEN OTHERS THEN -- Si falla, retornar false
RETURN false;
END;
END IF;
-- Verificar si el email indica que es administrador
IF user_email IS NULL THEN RETURN false;
END IF;
-- Convertir a minúsculas para comparación
user_email := lower(trim(user_email));
-- Verificar si es admin según los criterios de la aplicación
RETURN user_email LIKE '%@admin.%'
OR user_email = 'admin@ofisi.ar'
OR user_email = 'admin@ofisi.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Allow authenticated users to read servicios" ON public.servicios;
DROP POLICY IF EXISTS "Allow admin users to insert servicios" ON public.servicios;
DROP POLICY IF EXISTS "Allow admin users to update servicios" ON public.servicios;
DROP POLICY IF EXISTS "Allow admin users to delete servicios" ON public.servicios;
DROP POLICY IF EXISTS "Allow authenticated users to insert servicios" ON public.servicios;
DROP POLICY IF EXISTS "Allow authenticated users to update servicios" ON public.servicios;
DROP POLICY IF EXISTS "Allow authenticated users to delete servicios" ON public.servicios;
-- Política para permitir lectura a usuarios autenticados
CREATE POLICY "Allow authenticated users to read servicios" ON public.servicios FOR
SELECT USING (auth.role() = 'authenticated');
-- Política para permitir inserción solo a administradores
CREATE POLICY "Allow admin users to insert servicios" ON public.servicios FOR
INSERT WITH CHECK (
        auth.role() = 'authenticated'
        AND public.is_admin()
    );
-- Política para permitir actualización solo a administradores
CREATE POLICY "Allow admin users to update servicios" ON public.servicios FOR
UPDATE USING (
        auth.role() = 'authenticated'
        AND public.is_admin()
    ) WITH CHECK (
        auth.role() = 'authenticated'
        AND public.is_admin()
    );
-- Política para permitir eliminación solo a administradores
CREATE POLICY "Allow admin users to delete servicios" ON public.servicios FOR DELETE USING (
    auth.role() = 'authenticated'
    AND public.is_admin()
);
-- Verificar que las políticas se crearon correctamente
DO $$
DECLARE policy_count integer;
BEGIN
SELECT COUNT(*) INTO policy_count
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'servicios';
RAISE NOTICE 'Políticas creadas para servicios: %',
policy_count;
END $$;