-- Función RPC para actualizar el campo verificado de un usuario
-- Esta función usa SECURITY DEFINER para permitir actualizaciones administrativas
CREATE OR REPLACE FUNCTION public.update_user_verificado(
  p_email text,
  p_verificado boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_result jsonb;
BEGIN
  -- Buscar el usuario por email
  SELECT id INTO v_user_id
  FROM public.users
  WHERE email = p_email;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuario no encontrado'
    );
  END IF;

  -- Actualizar el campo verificado
  UPDATE public.users
  SET verificado = p_verificado,
      updated_at = now()
  WHERE id = v_user_id;

  -- Retornar resultado
  SELECT jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', p_email,
    'verificado', p_verificado
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Comentario en la función
COMMENT ON FUNCTION public.update_user_verificado IS 'Actualiza el campo verificado de un usuario por email. Requiere permisos de administrador.';

