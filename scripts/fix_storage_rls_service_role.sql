-- ============================================================================
-- ARREGLAR POLÍTICAS RLS PARA PERMITIR SERVICE_ROLE EN STORAGE
-- ============================================================================
-- Este script permite que el service_role_key pueda subir archivos
-- sin ser bloqueado por las políticas RLS
-- ============================================================================

-- Opción 1: Agregar política que permite service_role (RECOMENDADO)
-- Esta política permite que el service_role (role = 'service_role') pueda hacer todo
DROP POLICY IF EXISTS "service_role_full_access" ON storage.objects;

CREATE POLICY "service_role_full_access" ON storage.objects
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Opción 2: Si la opción 1 no funciona, puedes temporalmente deshabilitar RLS
-- (NO recomendado para producción, solo para debugging)
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Después de probar, vuelve a habilitar RLS:
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFICAR POLÍTICAS
-- ============================================================================
-- Para ver todas las políticas de storage.objects:
-- SELECT policyname, roles, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE tablename = 'objects' AND schemaname = 'storage'
-- ORDER BY policyname;

