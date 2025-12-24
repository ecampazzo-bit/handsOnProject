-- ============================================================================
-- SCRIPT PARA CONFIGURAR EL BUCKET "avatars" CON POLÍTICAS RLS
-- ============================================================================
-- Este script configura el bucket de avatares para que:
-- 1. Las imágenes sean accesibles públicamente (lectura)
-- 2. Solo los usuarios autenticados puedan subir/actualizar/eliminar
--    su propio avatar en su carpeta personal
-- ============================================================================
-- Eliminar políticas existentes si existen (para evitar duplicados)
DROP POLICY IF EXISTS "Public can read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
-- Política para permitir lectura pública de todas las imágenes de avatar
CREATE POLICY "Public can read avatars" ON storage.objects FOR
SELECT USING (bucket_id = 'avatars');
-- Política para permitir que usuarios autenticados suban su avatar
-- Solo pueden subir a su propia carpeta (user_id/avatar.jpg)
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'avatars'
        AND auth.role() = 'authenticated'
        AND (
            (storage.foldername(name)) [1] = auth.uid()::text
            OR name LIKE auth.uid()::text || '/%'
        )
    );
-- Política para permitir que usuarios autenticados actualicen su propio avatar
CREATE POLICY "Users can update own avatar" ON storage.objects FOR
UPDATE USING (
        bucket_id = 'avatars'
        AND auth.role() = 'authenticated'
        AND (
            (storage.foldername(name)) [1] = auth.uid()::text
            OR name LIKE auth.uid()::text || '/%'
        )
    ) WITH CHECK (
        bucket_id = 'avatars'
        AND auth.role() = 'authenticated'
        AND (
            (storage.foldername(name)) [1] = auth.uid()::text
            OR name LIKE auth.uid()::text || '/%'
        )
    );
-- Política para permitir que usuarios autenticados eliminen su propio avatar
CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (
        (storage.foldername(name)) [1] = auth.uid()::text
        OR name LIKE auth.uid()::text || '/%'
    )
);
-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 1. El bucket debe estar marcado como "Public" en el Dashboard de Supabase
--    Storage > avatars > Settings > Public bucket: ON
--
-- 2. Verificar que el bucket existe:
--    SELECT * FROM storage.buckets WHERE name = 'avatars';
--
-- 3. Si el bucket no existe, créalo desde el Dashboard o con:
--    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
--    VALUES (
--      'avatars',
--      'avatars',
--      true,
--      2097152, -- 2MB
--      ARRAY['image/jpeg', 'image/png', 'image/webp']
--    );
--
-- 4. Formato de archivo esperado: {user_id}/avatar.jpg
--    Ejemplo: 550e8400-e29b-41d4-a716-446655440000/avatar.jpg
--
-- 5. Para verificar las políticas creadas:
--    SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';
-- ============================================================================