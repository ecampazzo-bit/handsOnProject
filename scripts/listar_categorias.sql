-- ============================================================================
-- LISTAR TODAS LAS CATEGORÍAS
-- ============================================================================
-- Este script lista todas las categorías con su ID, nombre y URL de imagen
-- ============================================================================

-- Listar todas las categorías con información completa
SELECT 
    id,
    nombre,
    url,
    CASE 
        WHEN url IS NOT NULL THEN '✅ Tiene imagen'
        ELSE '❌ Sin imagen'
    END as estado_imagen,
    created_at
FROM public.categorias
ORDER BY nombre;

-- ============================================================================
-- CONTEO DE CATEGORÍAS
-- ============================================================================
SELECT 
    COUNT(*) as total_categorias,
    COUNT(url) as categorias_con_imagen,
    COUNT(*) - COUNT(url) as categorias_sin_imagen
FROM public.categorias;

-- ============================================================================
-- SOLO CATEGORÍAS SIN IMAGEN
-- ============================================================================
-- Descomenta para ver solo las categorías que aún no tienen imagen:
/*
SELECT 
    id,
    nombre,
    created_at
FROM public.categorias
WHERE url IS NULL
ORDER BY nombre;
*/

-- ============================================================================
-- SOLO CATEGORÍAS CON IMAGEN
-- ============================================================================
-- Descomenta para ver solo las categorías que ya tienen imagen:
/*
SELECT 
    id,
    nombre,
    url,
    created_at
FROM public.categorias
WHERE url IS NOT NULL
ORDER BY nombre;
*/

