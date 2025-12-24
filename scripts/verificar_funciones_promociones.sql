-- ============================================================================
-- VERIFICAR FUNCIONES RPC DE PROMOCIONES
-- ============================================================================
-- Este script verifica si las funciones RPC existen y están correctamente
-- configuradas.
-- ============================================================================

-- Verificar si las funciones existen
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'incrementar_vista_promocion',
    'incrementar_click_promocion',
    'incrementar_uso_promocion'
  )
ORDER BY routine_name;

-- Si no aparecen resultados, las funciones no existen.
-- Ejecuta: scripts/funciones_rpc_promociones_mejoradas.sql

-- Verificar una promoción de prueba
-- SELECT id, titulo, veces_mostrada, veces_clic, veces_usada, estado, activa
-- FROM public.promociones
-- LIMIT 1;

