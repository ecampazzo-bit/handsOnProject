-- ============================================================================
-- SCRIPT PARA CONFIGURAR EL BUCKET "solicitudes" COMO PÚBLICO
-- ============================================================================
-- Este script configura el bucket de solicitudes para que las imágenes
-- sean accesibles públicamente sin necesidad de autenticación.
-- 1. Crear el bucket si no existe (ejecutar en Supabase Dashboard > Storage)
-- O usar la API de Supabase para crearlo
-- 2. Configurar el bucket como público
-- NOTA: Esto debe hacerse desde el Dashboard de Supabase:
-- Storage > solicitudes > Settings > Public bucket: ON
-- 3. Crear políticas RLS para permitir lectura pública
-- ============================================================================
-- Eliminar políticas existentes si existen (para evitar duplicados)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
-- Política para permitir lectura pública de todas las imágenes
CREATE POLICY "Public Access" ON storage.objects FOR
SELECT USING (bucket_id = 'solicitudes');
-- Política para permitir que usuarios autenticados suban imágenes
-- Solo pueden subir a su propia carpeta (user_id)
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'solicitudes'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name)) [1] = auth.uid()::text
    );
-- Política para permitir que usuarios autenticados actualicen sus propias imágenes
CREATE POLICY "Users can update own images" ON storage.objects FOR
UPDATE USING (
        bucket_id = 'solicitudes'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name)) [1] = auth.uid()::text
    ) WITH CHECK (
        bucket_id = 'solicitudes'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name)) [1] = auth.uid()::text
    );
-- Política para permitir que usuarios autenticados eliminen sus propias imágenes
CREATE POLICY "Users can delete own images" ON storage.objects FOR DELETE USING (
    bucket_id = 'solicitudes'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name)) [1] = auth.uid()::text
);
-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 1. El bucket debe estar marcado como "Public" en el Dashboard de Supabase
--    Storage > solicitudes > Settings > Public bucket: ON
--
-- 2. Si el bucket es privado, las URLs públicas no funcionarán y será
--    necesario usar URLs firmadas (createSignedUrl) para todas las imágenes
--
-- 3. Verificar que el bucket existe:
--    SELECT * FROM storage.buckets WHERE name = 'solicitudes';
--
-- 4. Si el bucket no existe, créalo desde el Dashboard o con:
--    INSERT INTO storage.buckets (id, name, public)
--    VALUES ('solicitudes', 'solicitudes', true);
-- ============================================================================