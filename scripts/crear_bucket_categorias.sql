-- ============================================================================
-- CREAR BUCKET DE STORAGE PARA ICONOS DE CATEGORÍAS
-- ============================================================================
-- Este script crea el bucket 'categorias' en Supabase Storage para almacenar
-- los iconos de las categorías.

-- Insertar el bucket si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'categorias',
  'categorias',
  true, -- Público para que las imágenes sean accesibles
  2097152, -- 2MB límite de tamaño (2 * 1024 * 1024)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Verificar que el bucket fue creado
SELECT 
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types 
FROM storage.buckets 
WHERE id = 'categorias';

