-- ============================================================================
-- AGREGAR CAMPO URL A TABLA CATEGORIAS
-- ============================================================================
-- Este script agrega un campo 'url' a la tabla 'categorias' para almacenar
-- la URL de la imagen representativa de cada categoría.
-- ============================================================================
-- Agregar columna 'url' a la tabla categorias
ALTER TABLE public.categorias
ADD COLUMN IF NOT EXISTS url TEXT;
-- Agregar comentario a la columna para documentación
COMMENT ON COLUMN public.categorias.url IS 'URL de la imagen representativa de la categoría';
-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- Ejecuta este query para verificar que la columna fue agregada correctamente:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
--   AND table_name = 'categorias'
-- ORDER BY ordinal_position;
-- ============================================================================
-- EJEMPLO DE USO
-- ============================================================================
-- Para actualizar una categoría con su imagen:
-- UPDATE public.categorias 
-- SET url = 'https://ejemplo.com/imagenes/categoria-construccion.jpg'
-- WHERE id = 1;