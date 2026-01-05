-- ============================================================================
-- POLÍTICAS RLS PARA ADMINISTRADORES
-- ============================================================================
-- Este script crea políticas RLS que permiten a los administradores
-- leer y actualizar todos los usuarios, incluyendo el campo 'activo'

-- Nota: En producción, deberías tener una tabla de roles o un campo 'is_admin'
-- en la tabla users. Por ahora, usaremos una política basada en email.

-- 1. Crear función para verificar si un usuario es administrador
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Verificar si el email contiene '@admin.' o es el email de admin
  -- Buscar en auth.users donde está el email real de autenticación
  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = user_id
      AND (
        email LIKE '%@admin.%'
        OR email = 'admin@ofisi.ar'
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Política para que administradores puedan leer todos los usuarios
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
CREATE POLICY "Admins can read all users" ON public.users
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND public.is_admin(auth.uid())
);

-- 3. Política para que administradores puedan actualizar el campo 'activo'
DROP POLICY IF EXISTS "Admins can update user status" ON public.users;
CREATE POLICY "Admins can update user status" ON public.users
FOR UPDATE
USING (
  auth.role() = 'authenticated'
  AND public.is_admin(auth.uid())
)
WITH CHECK (
  auth.role() = 'authenticated'
  AND public.is_admin(auth.uid())
);

-- 4. Política para que administradores puedan actualizar otros campos de usuarios
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update all users" ON public.users
FOR UPDATE
USING (
  auth.role() = 'authenticated'
  AND public.is_admin(auth.uid())
)
WITH CHECK (
  auth.role() = 'authenticated'
  AND public.is_admin(auth.uid())
);

-- Nota: Las políticas existentes de usuarios permiten que cada usuario
-- actualice sus propios datos, por lo que estas políticas adicionales
-- solo extienden los permisos para administradores.

