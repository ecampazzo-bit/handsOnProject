-- ============================================================================
-- CORREGIR FOREIGN KEY CONSTRAINT PARA PERMITIR UPDATE
-- ============================================================================
-- El problema: La foreign key usuarios_eliminados_solicitud_eliminacion_id_fkey
-- tiene update_rule = 'NO ACTION', lo que impide actualizar solicitudes_eliminacion
-- cuando hay registros en usuarios_eliminados que la referencian.
--
-- Solución: Eliminar la constraint actual y recrearla con ON UPDATE CASCADE
-- para permitir actualizaciones en solicitudes_eliminacion.
-- ============================================================================

-- Eliminar la constraint existente
ALTER TABLE public.usuarios_eliminados
DROP CONSTRAINT IF EXISTS usuarios_eliminados_solicitud_eliminacion_id_fkey;

-- Recrear la constraint con ON UPDATE CASCADE
ALTER TABLE public.usuarios_eliminados
ADD CONSTRAINT usuarios_eliminados_solicitud_eliminacion_id_fkey
FOREIGN KEY (solicitud_eliminacion_id)
REFERENCES public.solicitudes_eliminacion(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

COMMENT ON CONSTRAINT usuarios_eliminados_solicitud_eliminacion_id_fkey 
ON public.usuarios_eliminados IS 
'Foreign key que permite actualizar solicitudes_eliminacion. Si se elimina la solicitud, se pone NULL en usuarios_eliminados.';
