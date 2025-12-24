-- ============================================================================
-- CONFIGURAR POLÍTICAS RLS PARA EL BUCKET 'categorias'
-- ============================================================================
-- Este script configura las políticas de Row Level Security (RLS) para el
-- bucket de categorías, permitiendo:
-- - Lectura pública de las imágenes
-- - Escritura solo para administradores (service_role o usuarios admin)
-- Eliminar políticas existentes si las hay (para recrearlas)
DROP POLICY IF EXISTS "Public read access for categorias" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload categorias icons" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update categorias icons" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete categorias icons" ON storage.objects;
-- Política para lectura pública
CREATE POLICY "Public read access for categorias" ON storage.objects FOR
SELECT USING (bucket_id = 'categorias');
-- Política para INSERT (subir iconos) - solo admins
CREATE POLICY "Admins can upload categorias icons" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'categorias'
        AND (
            (
                auth.role() = 'authenticated'
                AND public.is_admin(auth.uid())
            )
            OR auth.role() = 'service_role'
        )
    );
-- Política para UPDATE (actualizar iconos) - solo admins
CREATE POLICY "Admins can update categorias icons" ON storage.objects FOR
UPDATE USING (
        bucket_id = 'categorias'
        AND (
            (
                auth.role() = 'authenticated'
                AND public.is_admin(auth.uid())
            )
            OR auth.role() = 'service_role'
        )
    );
-- Política para DELETE (eliminar iconos) - solo admins
CREATE POLICY "Admins can delete categorias icons" ON storage.objects FOR DELETE USING (
    bucket_id = 'categorias'
    AND (
        (
            auth.role() = 'authenticated'
            AND public.is_admin(auth.uid())
        )
        OR auth.role() = 'service_role'
    )
);
-- Verificar políticas creadas
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
    AND policyname LIKE '%categorias%';