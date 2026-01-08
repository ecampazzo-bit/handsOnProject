-- ============================================================================
-- Agregar política RLS para permitir que usuarios eliminen su propia cuenta
-- ============================================================================
-- Política para permitir a usuarios autenticados eliminar su propia cuenta
DROP POLICY IF EXISTS "Users can delete own account" ON public.users;
CREATE POLICY "Users can delete own account" ON public.users FOR DELETE USING (
    auth.role() = 'authenticated'
    AND auth.uid() = id
);
-- Comentario
COMMENT ON POLICY "Users can delete own account" ON public.users IS 'Permite que los usuarios autenticados eliminen su propia cuenta de la tabla users';