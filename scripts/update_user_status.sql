-- ============================================================================
-- FUNCIÓN RPC PARA ACTUALIZAR ESTADO DE USUARIO
-- ============================================================================
-- Esta función permite actualizar el campo 'activo' de un usuario
-- usando SECURITY DEFINER para bypass RLS

CREATE OR REPLACE FUNCTION public.update_user_status(
  p_user_id uuid,
  p_activo boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Actualizar el estado del usuario
  UPDATE public.users
  SET activo = p_activo,
      updated_at = now()
  WHERE id = p_user_id;

  -- Verificar que se actualizó correctamente
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuario no encontrado'
    );
  END IF;

  -- Obtener el usuario actualizado para confirmar
  SELECT jsonb_build_object(
    'success', true,
    'user_id', id,
    'activo', activo,
    'updated_at', updated_at
  ) INTO v_result
  FROM public.users
  WHERE id = p_user_id;

  RETURN v_result;
END;
$$;

-- Comentario para documentación
COMMENT ON FUNCTION public.update_user_status(uuid, boolean) IS 
'Actualiza el estado activo/inactivo de un usuario. Usa SECURITY DEFINER para bypass RLS.';

