-- ============================================================================
-- SCRIPT PARA LIMPIAR DATOS DE PRUEBA
-- Elimina solicitudes de presupuesto, cotizaciones, trabajos y notificaciones
-- ============================================================================

-- IMPORTANTE: Este script eliminará TODOS los datos de estas tablas.
-- Ejecutar solo en ambiente de desarrollo/pruebas.

BEGIN;

-- 1. Eliminar todos los trabajos (debe hacerse primero por la restricción)
DELETE FROM public.trabajos;

-- 2. Eliminar todas las cotizaciones
DELETE FROM public.cotizaciones;

-- 3. Eliminar todas las notificaciones relacionadas con solicitudes, cotizaciones y trabajos
DELETE FROM public.notificaciones 
WHERE referencia_tipo IN ('solicitud_servicio', 'cotizacion', 'trabajo')
   OR tipo IN ('nueva_solicitud', 'nueva_cotizacion', 'trabajo_aceptado', 'sistema');

-- 4. Eliminar todas las solicitudes de servicio
-- (Las cotizaciones se eliminarán automáticamente por CASCADE)
DELETE FROM public.solicitudes_servicio;

-- Verificar que se eliminaron los datos
DO $$
DECLARE
    trabajos_count integer;
    cotizaciones_count integer;
    solicitudes_count integer;
    notificaciones_count integer;
BEGIN
    SELECT COUNT(*) INTO trabajos_count FROM public.trabajos;
    SELECT COUNT(*) INTO cotizaciones_count FROM public.cotizaciones;
    SELECT COUNT(*) INTO solicitudes_count FROM public.solicitudes_servicio;
    SELECT COUNT(*) INTO notificaciones_count FROM public.notificaciones 
        WHERE referencia_tipo IN ('solicitud_servicio', 'cotizacion', 'trabajo')
           OR tipo IN ('nueva_solicitud', 'nueva_cotizacion', 'trabajo_aceptado', 'sistema');
    
    RAISE NOTICE 'Trabajos restantes: %', trabajos_count;
    RAISE NOTICE 'Cotizaciones restantes: %', cotizaciones_count;
    RAISE NOTICE 'Solicitudes restantes: %', solicitudes_count;
    RAISE NOTICE 'Notificaciones relacionadas restantes: %', notificaciones_count;
END $$;

COMMIT;

-- ============================================================================
-- NOTA: Si quieres también limpiar las imágenes del Storage de Supabase,
-- deberás hacerlo manualmente desde el panel de Supabase Storage:
-- - Bucket: 'solicitudes'
-- ============================================================================

