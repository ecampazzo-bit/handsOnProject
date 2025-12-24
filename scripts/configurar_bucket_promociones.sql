-- ============================================================================
-- CONFIGURAR BUCKET DE STORAGE PARA PROMOCIONES
-- ============================================================================
-- Este script configura el bucket de Storage "promociones" para almacenar
-- las imágenes de las promociones y ofertas.
-- ============================================================================
-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Public can read promotions" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload promotions" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update promotions" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete promotions" ON storage.objects;
-- Política para permitir lectura pública de imágenes de promociones
CREATE POLICY "Public can read promotions" ON storage.objects FOR
SELECT USING (bucket_id = 'promociones');
-- Política para permitir que administradores suban imágenes de promociones
-- Permite subir a cualquier path dentro del bucket (incluyendo temp/)
CREATE POLICY "Admins can upload promotions" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'promociones'
        AND (
            -- Permitir si es admin autenticado
            (
                auth.role() = 'authenticated'
                AND public.is_admin(auth.uid())
            )
            OR -- Permitir si se usa service_role (bypass RLS)
            auth.role() = 'service_role'
        )
    );
-- Política para permitir que administradores actualicen imágenes de promociones
CREATE POLICY "Admins can update promotions" ON storage.objects FOR
UPDATE USING (
        bucket_id = 'promociones'
        AND (
            (
                auth.role() = 'authenticated'
                AND public.is_admin(auth.uid())
            )
            OR auth.role() = 'service_role'
        )
    ) WITH CHECK (
        bucket_id = 'promociones'
        AND (
            (
                auth.role() = 'authenticated'
                AND public.is_admin(auth.uid())
            )
            OR auth.role() = 'service_role'
        )
    );
-- Política para permitir que administradores eliminen imágenes de promociones
CREATE POLICY "Admins can delete promotions" ON storage.objects FOR DELETE USING (
    bucket_id = 'promociones'
    AND (
        (
            auth.role() = 'authenticated'
            AND public.is_admin(auth.uid())
        )
        OR auth.role() = 'service_role'
    )
);
-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 1. Crear el bucket "promociones" desde el Dashboard de Supabase:
--    Storage > New bucket
--    - Name: promociones
--    - Public bucket: ✅ ON (marcado como público)
--    - File size limit: 5242880 (5MB)
--    - Allowed MIME types: image/jpeg, image/png, image/webp
--
-- 2. Estructura recomendada de archivos:
--    promociones/{promocion_id}/imagen_principal.{ext}
--    promociones/{promocion_id}/imagen_mobile.{ext}
--
-- 3. Verificar que el bucket existe:
--    SELECT * FROM storage.buckets WHERE name = 'promociones';
--
-- 4. Para verificar las políticas:
--    SELECT * FROM pg_policies 
--    WHERE schemaname = 'storage' 
--      AND tablename = 'objects'
--      AND policyname LIKE '%promotion%';
-- ============================================================================