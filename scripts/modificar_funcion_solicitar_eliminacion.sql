-- ============================================================================
-- MODIFICAR FUNCIÓN PARA SOLICITAR ELIMINACIÓN EN LUGAR DE ELIMINAR INMEDIATAMENTE
-- ============================================================================
-- Esta función reemplaza a eliminar_cuenta_usuario() y crea una solicitud
-- de eliminación con período de gracia de 60 días.
-- ============================================================================

-- Primero, renombrar la función antigua (por si acaso se necesita rollback)
-- CREATE OR REPLACE FUNCTION public.eliminar_cuenta_usuario_old() ...
-- (no la borramos por ahora, pero la nueva función será diferente)

-- Crear nueva función para solicitar eliminación
CREATE OR REPLACE FUNCTION public.solicitar_eliminacion_cuenta(
  p_motivo text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_fecha_eliminacion timestamptz;
  v_existe_solicitud boolean;
BEGIN
  -- Obtener el ID del usuario autenticado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuario no autenticado'
    );
  END IF;

  -- Verificar que el usuario existe
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = v_user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuario no encontrado'
    );
  END IF;

  -- Verificar si ya existe una solicitud pendiente
  SELECT EXISTS (
    SELECT 1 FROM public.solicitudes_eliminacion
    WHERE usuario_id = v_user_id AND estado = 'pendiente'
  ) INTO v_existe_solicitud;

  IF v_existe_solicitud THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Ya existe una solicitud de eliminación pendiente para esta cuenta'
    );
  END IF;

  -- Calcular fecha de eliminación (60 días desde ahora)
  v_fecha_eliminacion := now() + INTERVAL '60 days';

  -- Insertar solicitud de eliminación
  INSERT INTO public.solicitudes_eliminacion (
    usuario_id,
    fecha_eliminacion,
    motivo
  ) VALUES (
    v_user_id,
    v_fecha_eliminacion,
    p_motivo
  );

  -- Retornar éxito con información de la fecha de eliminación
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Solicitud de eliminación creada exitosamente',
    'fecha_eliminacion', v_fecha_eliminacion,
    'dias_restantes', 60
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Error al crear la solicitud de eliminación: ' || SQLERRM
    );
END;
$$;

-- Comentario sobre la función
COMMENT ON FUNCTION public.solicitar_eliminacion_cuenta IS 
'Crea una solicitud de eliminación de cuenta con período de gracia de 60 días. El usuario puede cancelar la solicitud antes de la fecha programada.';
