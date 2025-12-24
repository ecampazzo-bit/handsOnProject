-- ============================================================================
-- CREAR BUCKET DE STORAGE PARA PROMOCIONES
-- ============================================================================
-- Este script crea el bucket "promociones" si no existe.
-- NOTA: En Supabase, los buckets se pueden crear desde el Dashboard o con SQL.
-- ============================================================================

-- Verificar si el bucket existe
DO $$
BEGIN
  -- Intentar crear el bucket si no existe
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'promociones'
  ) THEN
    -- Insertar el bucket en la tabla storage.buckets
    INSERT INTO storage.buckets (
      id,
      name,
      public,
      file_size_limit,
      allowed_mime_types
    ) VALUES (
      'promociones',
      'promociones',
      true, -- Bucket público
      5242880, -- 5MB en bytes
      ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
    );
    
    RAISE NOTICE 'Bucket "promociones" creado exitosamente';
  ELSE
    RAISE NOTICE 'Bucket "promociones" ya existe';
  END IF;
END $$;

-- Verificar que el bucket fue creado
SELECT 
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE name = 'promociones';

-- ============================================================================
-- NOTAS:
-- ============================================================================
-- 1. Si este script falla, puedes crear el bucket manualmente desde:
--    Supabase Dashboard > Storage > New bucket
--
-- 2. Configuración recomendada:
--    - Name: promociones
--    - Public bucket: ✅ ON
--    - File size limit: 5242880 (5MB)
--    - Allowed MIME types: image/jpeg, image/png, image/webp
--
-- 3. Después de crear el bucket, ejecuta:
--    scripts/configurar_bucket_promociones.sql
--    para configurar las políticas RLS.
-- ============================================================================

