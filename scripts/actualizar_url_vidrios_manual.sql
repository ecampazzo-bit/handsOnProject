-- ============================================================================
-- ACTUALIZAR URL DE CATEGORÍA "Vidrios y Aberturas" MANUALMENTE
-- ============================================================================
-- Este script actualiza la URL de la imagen para la categoría
-- Úsalo si ya subiste la imagen manualmente desde el Dashboard de Supabase
-- ============================================================================

-- Reemplaza 'TU_URL_AQUI' con la URL completa de la imagen subida
UPDATE public.categorias
SET url = 'TU_URL_AQUI'
WHERE nombre ILIKE '%Vidrios%' OR nombre ILIKE '%vidrios%';

-- Verificar que se actualizó correctamente
SELECT id, nombre, url
FROM public.categorias
WHERE nombre ILIKE '%Vidrios%' OR nombre ILIKE '%vidrios%';

-- ============================================================================
-- ALTERNATIVA: Si conoces el ID exacto de la categoría
-- ============================================================================
-- UPDATE public.categorias
-- SET url = 'TU_URL_AQUI'
-- WHERE id = 10;  -- Reemplaza 10 con el ID correcto

