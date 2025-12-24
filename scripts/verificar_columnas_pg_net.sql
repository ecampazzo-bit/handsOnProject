-- ============================================================================
-- VERIFICAR COLUMNAS DE net.http_request_queue
-- ============================================================================
-- Este script verifica qué columnas tiene realmente la tabla
-- ============================================================================

-- Ver todas las columnas disponibles
SELECT 
    column_name, 
    data_type,
    ordinal_position
FROM information_schema.columns
WHERE table_schema = 'net'
  AND table_name = 'http_request_queue'
ORDER BY ordinal_position;

-- ============================================================================
-- Una vez que veas las columnas, usa las correctas en el query
-- ============================================================================

