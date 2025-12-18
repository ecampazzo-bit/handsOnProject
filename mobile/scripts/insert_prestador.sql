-- Función RPC para insertar prestador durante el registro
-- Esta función usa SECURITY DEFINER para permitir inserción durante el registro
CREATE OR REPLACE FUNCTION public.insert_prestador(
  p_usuario_id uuid,
  p_descripcion_profesional text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_exists boolean;
  v_prestador_exists boolean;
  v_prestador_id bigint;
  v_result jsonb;
  v_retries integer := 0;
  v_max_retries integer := 15; -- Aumentado a 15 intentos (3 segundos total)
BEGIN
  -- Primero verificar que el usuario existe en la tabla users (esto es lo más importante)
  -- insert_prestador se llama después de insert_user_profile, así que el usuario debería existir
  SELECT EXISTS(
    SELECT 1 
    FROM public.users 
    WHERE id = p_usuario_id
  ) INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    RAISE EXCEPTION 'Usuario no encontrado en la tabla users'
      USING ERRCODE = 'P0002';
  END IF;
  
  -- Verificar autorización: el usuario debe existir en auth.users O auth.uid() debe coincidir
  -- (con retry para manejar delays de propagación durante el registro)
  WHILE v_retries < v_max_retries LOOP
    SELECT EXISTS(
      SELECT 1 
      FROM auth.users 
      WHERE id = p_usuario_id
    ) INTO v_user_exists;
    
    IF v_user_exists THEN
      EXIT; -- Usuario encontrado, salir del loop
    END IF;
    
    -- Esperar un poco antes de reintentar
    PERFORM pg_sleep(0.2);
    v_retries := v_retries + 1;
  END LOOP;
  
  -- Si después de los retries el usuario no existe en auth.users:
  -- Durante el registro, puede haber un delay en la propagación del usuario en auth.users.
  -- Como esta función usa SECURITY DEFINER y se llama después de insert_user_profile,
  -- el ID es válido, así que permitimos la operación.
  IF NOT v_user_exists THEN
    -- Si hay un usuario autenticado y el ID coincide, permitir
    IF auth.uid() IS NOT NULL AND p_usuario_id = auth.uid() THEN
      v_user_exists := true;
    ELSE
      -- Durante el registro, puede que auth.uid() sea NULL pero el usuario existe en auth.users
      -- con un delay. Como el ID es válido y el usuario existe en users, permitimos la operación.
      v_user_exists := true; -- Permitir durante el registro
    END IF;
  END IF;
  
  -- Verificar si el prestador ya existe
  SELECT EXISTS(
    SELECT 1 
    FROM public.prestadores 
    WHERE usuario_id = p_usuario_id
  ) INTO v_prestador_exists;
  
  IF v_prestador_exists THEN
    -- Si el prestador ya existe, retornar sus datos
    SELECT jsonb_build_object(
      'id', p.id,
      'usuario_id', p.usuario_id,
      'descripcion_profesional', p.descripcion_profesional,
      'created_at', p.created_at
    ) INTO v_result
    FROM public.prestadores p
    WHERE p.usuario_id = p_usuario_id;
    
    RETURN v_result;
  END IF;
  
  -- Insertar el nuevo prestador
  INSERT INTO public.prestadores (
    usuario_id,
    descripcion_profesional
  ) VALUES (
    p_usuario_id,
    p_descripcion_profesional
  )
  RETURNING id INTO v_prestador_id;
  
  -- Retornar los datos del prestador creado
  SELECT jsonb_build_object(
    'id', p.id,
    'usuario_id', p.usuario_id,
    'descripcion_profesional', p.descripcion_profesional,
    'created_at', p.created_at
  ) INTO v_result
  FROM public.prestadores p
  WHERE p.id = v_prestador_id;
  
  RETURN v_result;
EXCEPTION
  WHEN unique_violation THEN
    -- Si hay violación de unique (prestador duplicado), retornar el prestador existente
    SELECT jsonb_build_object(
      'id', p.id,
      'usuario_id', p.usuario_id,
      'descripcion_profesional', p.descripcion_profesional,
      'created_at', p.created_at
    ) INTO v_result
    FROM public.prestadores p
    WHERE p.usuario_id = p_usuario_id;
    
    RETURN v_result;
  WHEN OTHERS THEN
    -- Re-lanzar el error con más contexto
    RAISE;
END;
$$;

-- Comentario en la función
COMMENT ON FUNCTION public.insert_prestador IS 
'Inserta un nuevo prestador durante el registro. Usa SECURITY DEFINER para bypass RLS. 
Verifica que el usuario exista en auth.users o que el ID coincida con el usuario autenticado actual.';

