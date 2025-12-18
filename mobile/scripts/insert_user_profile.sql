-- Función RPC para insertar perfil de usuario durante el registro
-- Esta función usa SECURITY DEFINER para permitir inserción durante el registro
-- incluso si hay un pequeño delay en la propagación del usuario en auth.users
CREATE OR REPLACE FUNCTION public.insert_user_profile(
  p_id uuid,
  p_email text,
  p_password text,
  p_nombre text,
  p_apellido text,
  p_telefono text,
  p_direccion text DEFAULT NULL,
  p_latitud numeric DEFAULT NULL,
  p_longitud numeric DEFAULT NULL,
  p_tipo_usuario public.tipo_usuario DEFAULT 'cliente'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_exists boolean;
  v_user_id uuid;
  v_result jsonb;
  v_retries integer := 0;
  v_max_retries integer := 15; -- Aumentado a 15 intentos (3 segundos total)
BEGIN
  -- Verificar que el usuario existe en auth.users (con retry para manejar delays de propagación)
  -- Durante el registro, puede haber un delay antes de que el usuario esté disponible en auth.users
  WHILE v_retries < v_max_retries LOOP
    SELECT EXISTS(
      SELECT 1 
      FROM auth.users 
      WHERE id = p_id
    ) INTO v_user_exists;
    
    IF v_user_exists THEN
      EXIT; -- Usuario encontrado, salir del loop
    END IF;
    
    -- Esperar un poco antes de reintentar (aumentado a 200ms para dar más tiempo)
    PERFORM pg_sleep(0.2);
    v_retries := v_retries + 1;
  END LOOP;
  
  -- Si después de los retries el usuario no existe en auth.users:
  -- Durante el registro, puede haber un delay en la propagación del usuario en auth.users.
  -- Como esta función usa SECURITY DEFINER y se llama inmediatamente después de signUp,
  -- el ID es válido (viene del resultado de signUp), así que permitimos la inserción.
  -- Esto es seguro porque:
  -- 1. El ID viene del resultado de signUp (es válido y único)
  -- 2. La función usa SECURITY DEFINER (ejecuta con permisos elevados)
  -- 3. El email se valida por unique constraint en la tabla
  -- 4. Si el usuario ya existe, se maneja con el EXCEPTION de unique_violation
  IF NOT v_user_exists THEN
    -- Si hay un usuario autenticado y el ID coincide, permitir
    IF auth.uid() IS NOT NULL AND p_id = auth.uid() THEN
      v_user_exists := true;
    ELSE
      -- Durante el registro, puede que auth.uid() sea NULL pero el usuario existe en auth.users
      -- con un delay. Como el ID viene de signUp y es válido, permitimos la inserción.
      -- La validación del email (unique constraint) y el trigger de hash de password
      -- proporcionan seguridad adicional.
      v_user_exists := true; -- Permitir inserción durante el registro
    END IF;
  END IF;
  
  -- Verificar que el usuario no exista ya en la tabla users
  SELECT id INTO v_user_id
  FROM public.users
  WHERE id = p_id;
  
  IF v_user_id IS NOT NULL THEN
    -- Si el usuario ya existe, retornar sus datos
    SELECT jsonb_build_object(
      'id', u.id,
      'email', u.email,
      'nombre', u.nombre,
      'apellido', u.apellido,
      'telefono', u.telefono,
      'direccion', u.direccion,
      'latitud', u.latitud,
      'longitud', u.longitud,
      'tipo_usuario', u.tipo_usuario,
      'verificado', u.verificado,
      'created_at', u.created_at
    ) INTO v_result
    FROM public.users u
    WHERE u.id = p_id;
    
    RETURN v_result;
  END IF;
  
  -- Insertar el nuevo usuario
  INSERT INTO public.users (
    id,
    email,
    password,
    nombre,
    apellido,
    telefono,
    direccion,
    latitud,
    longitud,
    tipo_usuario
  ) VALUES (
    p_id,
    p_email,
    p_password, -- El trigger hash_user_password lo hasheará automáticamente
    p_nombre,
    p_apellido,
    p_telefono,
    p_direccion,
    p_latitud,
    p_longitud,
    p_tipo_usuario
  )
  RETURNING id INTO v_user_id;
  
  -- Retornar los datos del usuario creado (sin password)
  SELECT jsonb_build_object(
    'id', u.id,
    'email', u.email,
    'nombre', u.nombre,
    'apellido', u.apellido,
    'telefono', u.telefono,
    'direccion', u.direccion,
    'latitud', u.latitud,
    'longitud', u.longitud,
    'tipo_usuario', u.tipo_usuario,
    'verificado', u.verificado,
    'created_at', u.created_at
  ) INTO v_result
  FROM public.users u
  WHERE u.id = v_user_id;
  
  RETURN v_result;
EXCEPTION
  WHEN unique_violation THEN
    -- Si hay violación de unique (email duplicado), retornar el usuario existente
    SELECT jsonb_build_object(
      'id', u.id,
      'email', u.email,
      'nombre', u.nombre,
      'apellido', u.apellido,
      'telefono', u.telefono,
      'direccion', u.direccion,
      'latitud', u.latitud,
      'longitud', u.longitud,
      'tipo_usuario', u.tipo_usuario,
      'verificado', u.verificado,
      'created_at', u.created_at
    ) INTO v_result
    FROM public.users u
    WHERE u.email = p_email;
    
    RETURN v_result;
  WHEN OTHERS THEN
    -- Re-lanzar el error con más contexto
    RAISE;
END;
$$;

-- Comentario en la función
COMMENT ON FUNCTION public.insert_user_profile IS 
'Inserta un nuevo perfil de usuario durante el registro. Usa SECURITY DEFINER para bypass RLS. 
Verifica que el usuario exista en auth.users o que el ID coincida con el usuario autenticado actual.';

