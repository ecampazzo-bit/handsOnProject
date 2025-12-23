-- ============================================================================
-- CONFIGURAR BUCKET "servicios" PARA IMÁGENES DE CATEGORÍAS
-- ============================================================================
-- NOTA: Los buckets deben crearse desde el Dashboard de Supabase
-- Storage > New bucket > nombre: "servicios" > Public: ON
-- 
-- Este script solo configura las políticas RLS para el bucket existente
-- ============================================================================

-- Verificar que el bucket existe (esto debe hacerse manualmente desde el Dashboard)
-- Si el bucket no existe:
--   1. Ve a: Supabase Dashboard > Storage
--   2. Haz clic en "New bucket"
--   3. Nombre: "servicios"
--   4. Marca "Public bucket" como ON
--   5. Haz clic en "Create bucket"

-- ============================================================================
-- POLÍTICAS RLS PARA EL BUCKET "servicios"
-- ============================================================================

-- Eliminar políticas existentes para evitar duplicados
DROP POLICY IF EXISTS "servicios_public_read" ON storage.objects;
DROP POLICY IF EXISTS "servicios_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "servicios_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "servicios_authenticated_delete" ON storage.objects;

-- Política: Todos pueden leer las imágenes (bucket público)
CREATE POLICY "servicios_public_read" ON storage.objects
FOR SELECT
USING (bucket_id = 'servicios');

-- Política: Usuarios autenticados pueden subir imágenes a la carpeta categorias
CREATE POLICY "servicios_authenticated_insert" ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'servicios'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'categorias'
);

-- Política: Usuarios autenticados pueden actualizar imágenes en categorias
CREATE POLICY "servicios_authenticated_update" ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'servicios'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'categorias'
)
WITH CHECK (
    bucket_id = 'servicios'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'categorias'
);

-- Política: Usuarios autenticados pueden eliminar imágenes en categorias
CREATE POLICY "servicios_authenticated_delete" ON storage.objects
FOR DELETE
USING (
    bucket_id = 'servicios'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'categorias'
);

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- Para verificar las políticas creadas, ejecuta:
-- 
-- SELECT policyname, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'objects' 
--   AND policyname LIKE 'servicios%';
--
-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 1. El bucket "servicios" debe estar marcado como PÚBLICO en el Dashboard
-- 2. La estructura de archivos es: categorias/{nombre_categoria}.{ext}
-- 3. Cualquier usuario autenticado puede subir/modificar/eliminar imágenes
--    en la carpeta categorias (ajustar según tus necesidades de seguridad)
-- 4. Para operaciones administrativas, usa el service_role_key que bypass RLS

