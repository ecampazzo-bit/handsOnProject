-- ============================================================================
-- SCRIPT PARA LIMPIAR TODAS LAS NOTIFICACIONES
-- Elimina todas las notificaciones de la base de datos
-- ============================================================================
-- IMPORTANTE: Este script eliminará TODAS las notificaciones.
-- Ejecutar solo en ambiente de desarrollo/pruebas.
BEGIN;
-- Mostrar cantidad antes de eliminar
DO $$
DECLARE notificaciones_antes integer;
BEGIN
SELECT COUNT(*) INTO notificaciones_antes
FROM public.notificaciones;
RAISE NOTICE 'Notificaciones antes de eliminar: %',
notificaciones_antes;
END $$;
-- Eliminar todas las notificaciones (leídas y no leídas)
DELETE FROM public.notificaciones;
-- Verificar que se eliminaron los datos
DO $$
DECLARE notificaciones_count integer;
BEGIN
SELECT COUNT(*) INTO notificaciones_count
FROM public.notificaciones;
RAISE NOTICE 'Notificaciones restantes: %',
notificaciones_count;
IF notificaciones_count = 0 THEN RAISE NOTICE '✅ Todas las notificaciones han sido eliminadas correctamente';
ELSE RAISE WARNING '⚠️  Aún quedan % notificaciones',
notificaciones_count;
END IF;
END $$;
COMMIT;
-- ============================================================================
-- NOTA: Este script solo elimina las notificaciones.
-- No afecta solicitudes, cotizaciones, trabajos u otros datos.
-- 
-- Después de ejecutar este script, reinicia la aplicación móvil
-- para que el contador de notificaciones se actualice.
-- ============================================================================