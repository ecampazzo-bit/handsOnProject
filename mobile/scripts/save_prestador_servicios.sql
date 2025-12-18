-- Función RPC para guardar servicios de un prestador
-- Esta función usa SECURITY DEFINER para permitir guardar servicios durante el registro
CREATE OR REPLACE FUNCTION public.save_prestador_servicios(
        p_usuario_id uuid,
        p_servicios jsonb -- Array de objetos: [{"servicio_id": 1}, {"servicio_id": 2}, ...]
    ) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_user_exists boolean;
v_prestador_id bigint;
v_servicio jsonb;
v_servicio_id bigint;
v_result jsonb;
v_retries integer := 0;
v_max_retries integer := 5;
v_inserted_count integer := 0;
BEGIN -- Verificar que el usuario existe en la tabla users
SELECT EXISTS(
        SELECT 1
        FROM public.users
        WHERE id = p_usuario_id
    ) INTO v_user_exists;
IF NOT v_user_exists THEN RAISE EXCEPTION 'Usuario no encontrado en la tabla users' USING ERRCODE = 'P0002';
END IF;
-- Verificar autorización: 
-- Como esta función usa SECURITY DEFINER, podemos ser más permisivos
-- Verificar que el usuario existe en auth.users O que auth.uid() coincide
-- (con retry para manejar delays en auth.users)
-- Primero verificar si hay un usuario autenticado y el ID coincide (caso más común)
IF auth.uid() IS NOT NULL
AND p_usuario_id = auth.uid() THEN -- Usuario autenticado y ID coincide - permitir operación directamente
-- No necesitamos verificar auth.users en este caso
NULL;
-- Continuar con la operación
ELSE -- Si auth.uid() no coincide o es NULL, verificar que el usuario existe en auth.users
v_retries := 0;
v_user_exists := false;
WHILE v_retries < v_max_retries LOOP
SELECT EXISTS(
        SELECT 1
        FROM auth.users
        WHERE id = p_usuario_id
    ) INTO v_user_exists;
IF v_user_exists THEN EXIT;
-- Usuario encontrado, salir del loop
END IF;
-- Esperar un poco antes de reintentar
PERFORM pg_sleep(0.2);
v_retries := v_retries + 1;
END LOOP;
-- Si después de los retries el usuario no existe en auth.users, lanzar error
IF NOT v_user_exists THEN RAISE EXCEPTION 'Unauthorized: user must exist in auth.users or match authenticated user' USING ERRCODE = 'P0001';
END IF;
END IF;
-- Obtener el prestador_id del usuario
SELECT id INTO v_prestador_id
FROM public.prestadores
WHERE usuario_id = p_usuario_id;
IF v_prestador_id IS NULL THEN RAISE EXCEPTION 'Prestador no encontrado para el usuario especificado' USING ERRCODE = 'P0003';
END IF;
-- Validar que p_servicios es un array
IF jsonb_typeof(p_servicios) != 'array' THEN RAISE EXCEPTION 'p_servicios debe ser un array JSON' USING ERRCODE = 'P0004';
END IF;
-- Eliminar servicios existentes del prestador (opcional: comentar esta línea si quieres agregar en lugar de reemplazar)
-- DELETE FROM public.prestador_servicios WHERE prestador_id = v_prestador_id;
-- Insertar los nuevos servicios
FOR v_servicio IN
SELECT *
FROM jsonb_array_elements(p_servicios) LOOP -- Extraer servicio_id del objeto JSON
    v_servicio_id := (v_servicio->>'servicio_id')::bigint;
-- Validar que servicio_id existe
IF NOT EXISTS(
    SELECT 1
    FROM public.servicios
    WHERE id = v_servicio_id
) THEN CONTINUE;
-- Saltar servicios inválidos
END IF;
-- Insertar o actualizar el servicio del prestador
INSERT INTO public.prestador_servicios (
        prestador_id,
        servicio_id,
        precio_base,
        precio_desde,
        experiencia_años
    )
VALUES (
        v_prestador_id,
        v_servicio_id,
        (v_servicio->>'precio_base')::numeric,
        (v_servicio->>'precio_desde')::numeric,
        (v_servicio->>'experiencia_años')::integer
    ) ON CONFLICT (prestador_id, servicio_id) DO
UPDATE
SET precio_base = EXCLUDED.precio_base,
    precio_desde = EXCLUDED.precio_desde,
    experiencia_años = EXCLUDED.experiencia_años,
    fecha_agregado = now();
v_inserted_count := v_inserted_count + 1;
END LOOP;
-- Retornar resultado
SELECT jsonb_build_object(
        'success',
        true,
        'prestador_id',
        v_prestador_id,
        'servicios_guardados',
        v_inserted_count,
        'total_servicios',
        jsonb_array_length(p_servicios)
    ) INTO v_result;
RETURN v_result;
EXCEPTION
WHEN OTHERS THEN -- Re-lanzar el error con más contexto
RAISE;
END;
$$;
-- Comentario en la función
COMMENT ON FUNCTION public.save_prestador_servicios IS 'Guarda los servicios de un prestador. Usa SECURITY DEFINER para bypass RLS. 
Verifica que el usuario exista en auth.users o que el ID coincida con el usuario autenticado actual.
Recibe un array JSON de servicios: [{"servicio_id": 1, "precio_base": 1000, ...}, ...]';