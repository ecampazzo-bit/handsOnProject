-- ============================================================================
-- SCRIPT PARA LIMPIAR TODOS LOS PRESUPUESTOS (COTIZACIONES)
-- Elimina todas las cotizaciones y sus notificaciones relacionadas
-- ============================================================================

-- IMPORTANTE: Este script eliminará TODAS las cotizaciones de la base de datos.
-- Ejecutar solo en ambiente de desarrollo/pruebas.

BEGIN;

-- 1. Eliminar todas las notificaciones relacionadas con cotizaciones
DELETE FROM public.notificaciones 
WHERE referencia_tipo = 'cotizacion'
   OR tipo = 'nueva_cotizacion';

-- 2. Eliminar todos los trabajos que fueron creados a partir de cotizaciones aceptadas
-- (Esto también eliminará las notificaciones relacionadas con trabajos)
DELETE FROM public.trabajos 
WHERE cotizacion_id IS NOT NULL;

-- 3. Eliminar todas las cotizaciones
DELETE FROM public.cotizaciones;

-- Verificar que se eliminaron los datos
DO $$
DECLARE
    cotizaciones_count integer;
    notificaciones_cotizaciones_count integer;
    trabajos_count integer;
BEGIN
    SELECT COUNT(*) INTO cotizaciones_count FROM public.cotizaciones;
    SELECT COUNT(*) INTO notificaciones_cotizaciones_count FROM public.notificaciones 
        WHERE referencia_tipo = 'cotizacion' OR tipo = 'nueva_cotizacion';
    SELECT COUNT(*) INTO trabajos_count FROM public.trabajos WHERE cotizacion_id IS NOT NULL;
    
    RAISE NOTICE 'Cotizaciones restantes: %', cotizaciones_count;
    RAISE NOTICE 'Notificaciones de cotizaciones restantes: %', notificaciones_cotizaciones_count;
    RAISE NOTICE 'Trabajos con cotización restantes: %', trabajos_count;
END $$;

COMMIT;

-- ============================================================================
-- NOTA: Este script NO elimina las solicitudes de servicio.
-- Si también quieres limpiar las solicitudes, ejecuta limpiar_datos_prueba.sql
-- ============================================================================

