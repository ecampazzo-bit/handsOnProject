-- ============================================================================
-- SCRIPT PARA VERIFICAR ARCHIVOS EN EL BUCKET "solicitudes"
-- ============================================================================
-- Este script ayuda a diagnosticar problemas con las imágenes de solicitudes
-- 1. Verificar que el bucket existe y está configurado como público
SELECT id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets
WHERE name = 'solicitudes';
-- 2. Verificar políticas RLS existentes para el bucket "solicitudes"
SELECT schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'objects'
    AND policyname LIKE '%solicitudes%'
    OR (
        qual::text LIKE '%solicitudes%'
        OR with_check::text LIKE '%solicitudes%'
    );
-- 3. Listar algunos archivos en el bucket (primeros 10)
-- NOTA: Esto requiere permisos de administrador o ejecutarse con service_role
SELECT name,
    id,
    bucket_id,
    owner,
    created_at,
    updated_at,
    last_accessed_at,
    metadata
FROM storage.objects
WHERE bucket_id = 'solicitudes'
ORDER BY created_at DESC
LIMIT 10;
-- 4. Verificar estructura de carpetas
SELECT DISTINCT (string_to_array(name, '/')) [1] as user_folder,
    COUNT(*) as file_count
FROM storage.objects
WHERE bucket_id = 'solicitudes'
GROUP BY (string_to_array(name, '/')) [1]
ORDER BY file_count DESC;
-- 5. Verificar una ruta específica (reemplazar con la ruta real)
-- Ejemplo: e5b1708a-16e5-4097-b5e5-e3a53cd4b3e5/15/1766322976722_0.jpg
SELECT name,
    id,
    created_at,
    metadata
FROM storage.objects
WHERE bucket_id = 'solicitudes'
    AND name LIKE 'e5b1708a-16e5-4097-b5e5-e3a53cd4b3e5%'
ORDER BY created_at DESC
LIMIT 20;
-- ============================================================================
-- NOTAS:
-- ============================================================================
-- Si el bucket no existe o no está público, las URLs públicas no funcionarán
-- Si las políticas RLS están bloqueando el acceso, incluso las URLs firmadas pueden fallar
-- Verifica que los archivos realmente existan en el bucket antes de intentar accederlos
-- ============================================================================