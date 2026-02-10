-- ============================================================================
-- CREAR FUNCIONES RPC PARA REGISTRO DE USUARIOS
-- Ejecuta este script SOLO si las funciones no existen
-- Estas funciones son SECURITY DEFINER para evitar problemas con RLS
-- ============================================================================

-- ============================================================================
-- 1. FUNCIÓN: insert_user_profile
-- Inserta el perfil de usuario en la tabla users
-- ============================================================================
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
    v_user jsonb;
BEGIN
    -- Verificar que el usuario existe en auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_id) THEN
        RAISE EXCEPTION 'Usuario no existe en auth.users con id: %', p_id;
    END IF;

    -- Verificar que el email no esté duplicado
    IF EXISTS (SELECT 1 FROM public.users WHERE email = p_email AND id != p_id) THEN
        RAISE EXCEPTION 'El email % ya está registrado', p_email;
    END IF;

    -- Insertar en tabla users
    INSERT INTO public.users (
        id, email, password, nombre, apellido, telefono,
        direccion, latitud, longitud, tipo_usuario
    ) VALUES (
        p_id, p_email, p_password, p_nombre, p_apellido, p_telefono,
        p_direccion, p_latitud, p_longitud, p_tipo_usuario
    )
    RETURNING jsonb_build_object(
        'id', id,
        'email', email,
        'nombre', nombre,
        'apellido', apellido,
        'telefono', telefono,
        'direccion', direccion,
        'latitud', latitud,
        'longitud', longitud,
        'tipo_usuario', tipo_usuario,
        'verificado', verificado,
        'activo', activo,
        'calificacion_promedio', calificacion_promedio,
        'cantidad_calificaciones', cantidad_calificaciones,
        'foto_perfil_url', foto_perfil_url,
        'created_at', created_at,
        'updated_at', updated_at
    ) INTO v_user;

    RETURN v_user;
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'El usuario con id % ya existe', p_id;
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error al insertar perfil de usuario: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION public.insert_user_profile IS 'Inserta el perfil de usuario en la tabla users. SECURITY DEFINER para evitar problemas con RLS durante el registro.';

-- ============================================================================
-- 2. FUNCIÓN: insert_prestador
-- Crea un registro de prestador para un usuario
-- ============================================================================
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
    v_prestador jsonb;
    v_prestador_id bigint;
BEGIN
    -- Verificar que el usuario existe
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_usuario_id) THEN
        RAISE EXCEPTION 'Usuario no existe con id: %', p_usuario_id;
    END IF;

    -- Verificar que el usuario no tenga ya un prestador
    IF EXISTS (SELECT 1 FROM public.prestadores WHERE usuario_id = p_usuario_id) THEN
        -- Si ya existe, retornar el existente
        SELECT jsonb_build_object(
            'id', id,
            'usuario_id', usuario_id,
            'descripcion_profesional', descripcion_profesional,
            'ya_existia', true
        )
        INTO v_prestador
        FROM public.prestadores
        WHERE usuario_id = p_usuario_id;
        
        RETURN v_prestador;
    END IF;

    -- Insertar nuevo prestador
    INSERT INTO public.prestadores (
        usuario_id,
        descripcion_profesional
    ) VALUES (
        p_usuario_id,
        p_descripcion_profesional
    )
    RETURNING id INTO v_prestador_id;

    -- Retornar el prestador creado
    SELECT jsonb_build_object(
        'id', id,
        'usuario_id', usuario_id,
        'descripcion_profesional', descripcion_profesional,
        'ya_existia', false
    )
    INTO v_prestador
    FROM public.prestadores
    WHERE id = v_prestador_id;

    RETURN v_prestador;
EXCEPTION
    WHEN unique_violation THEN
        -- Si hay violación de unique, retornar el existente
        SELECT jsonb_build_object(
            'id', id,
            'usuario_id', usuario_id,
            'descripcion_profesional', descripcion_profesional,
            'ya_existia', true
        )
        INTO v_prestador
        FROM public.prestadores
        WHERE usuario_id = p_usuario_id;
        
        RETURN v_prestador;
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error al insertar prestador: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION public.insert_prestador IS 'Crea un registro de prestador para un usuario. SECURITY DEFINER para evitar problemas con RLS durante el registro.';

-- ============================================================================
-- 3. FUNCIÓN: save_prestador_servicios
-- Guarda los servicios de un prestador
-- ============================================================================
CREATE OR REPLACE FUNCTION public.save_prestador_servicios(
    p_usuario_id uuid,
    p_servicios jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_prestador_id bigint;
    v_servicio jsonb;
    v_result jsonb := '{"servicios_agregados": 0, "servicios_existentes": 0}'::jsonb;
    v_agregados integer := 0;
    v_existentes integer := 0;
BEGIN
    -- Verificar que el prestador existe
    SELECT id INTO v_prestador_id
    FROM public.prestadores
    WHERE usuario_id = p_usuario_id;

    IF v_prestador_id IS NULL THEN
        RAISE EXCEPTION 'Prestador no encontrado para usuario: %', p_usuario_id;
    END IF;

    -- Procesar cada servicio
    FOR v_servicio IN SELECT * FROM jsonb_array_elements(p_servicios)
    LOOP
        -- Insertar o actualizar servicio del prestador
        INSERT INTO public.prestador_servicios (
            prestador_id,
            servicio_id
        ) VALUES (
            v_prestador_id,
            (v_servicio->>'servicio_id')::bigint
        )
        ON CONFLICT (prestador_id, servicio_id) DO NOTHING;
        
        IF FOUND THEN
            v_agregados := v_agregados + 1;
        ELSE
            v_existentes := v_existentes + 1;
        END IF;
    END LOOP;

    -- Retornar resultado
    v_result := jsonb_build_object(
        'prestador_id', v_prestador_id,
        'servicios_agregados', v_agregados,
        'servicios_existentes', v_existentes,
        'total_procesados', jsonb_array_length(p_servicios)
    );

    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error al guardar servicios del prestador: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION public.save_prestador_servicios IS 'Guarda los servicios de un prestador. SECURITY DEFINER para evitar problemas con RLS.';

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================
-- Verificar que las funciones se crearon correctamente
SELECT 
    proname as function_name,
    prosecdef as is_security_definer,
    CASE 
        WHEN prosecdef THEN '✅ IGNORA RLS (seguro)'
        ELSE '⚠️ DEPENDE DE RLS (puede fallar)'
    END as security_status
FROM pg_proc
WHERE proname IN ('insert_user_profile', 'insert_prestador', 'save_prestador_servicios')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;

-- Todas deberían mostrar is_security_definer = true
