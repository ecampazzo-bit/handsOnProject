-- ============================================================================
-- VERIFICAR LLAMADAS HTTP (VERSIÓN SIMPLE)
-- ============================================================================
-- Primero ejecuta esto para ver las columnas disponibles
-- ============================================================================

-- Paso 1: Ver columnas disponibles
SELECT 
    column_name, 
    data_type
FROM information_schema.columns
WHERE table_schema = 'net'
  AND table_name = 'http_request_queue'
ORDER BY ordinal_position;

-- Paso 2: Una vez que veas las columnas, usa este query genérico
-- (Ajusta según las columnas que veas en el Paso 1)
/*
SELECT *
FROM net.http_request_queue
WHERE url LIKE '%send-whatsapp-code%'
ORDER BY id DESC
LIMIT 10;
*/

-- ============================================================================
-- ALTERNATIVA: Ver si pg_net está habilitada
-- ============================================================================
SELECT * FROM pg_extension WHERE extname = 'pg_net';

-- ============================================================================
-- ALTERNATIVA: Ver todas las tablas en el schema 'net'
-- ============================================================================
SELECT 
    table_name
FROM information_schema.tables
WHERE table_schema = 'net'
ORDER BY table_name;

