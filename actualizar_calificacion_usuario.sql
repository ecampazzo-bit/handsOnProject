-- Función RPC para actualizar el promedio y cantidad de calificaciones de un usuario
-- Esta función puede ser llamada por cualquier usuario autenticado para actualizar
-- las estadísticas de calificación de cualquier usuario (necesario para el sistema de calificaciones)
CREATE OR REPLACE FUNCTION public.actualizar_calificacion_usuario(
        p_usuario_id uuid,
        p_promedio numeric,
        p_cantidad integer
    ) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN -- Actualizar el promedio y cantidad de calificaciones del usuario
UPDATE public.users
SET calificacion_promedio = p_promedio,
    cantidad_calificaciones = p_cantidad,
    updated_at = now()
WHERE id = p_usuario_id;
END;
$$;
-- Otorgar permisos para ejecutar la función a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.actualizar_calificacion_usuario(uuid, numeric, integer) TO authenticated;
-- Comentario sobre la función
COMMENT ON FUNCTION public.actualizar_calificacion_usuario(uuid, numeric, integer) IS 'Actualiza el promedio y cantidad de calificaciones de un usuario. Usa SECURITY DEFINER para permitir actualizar cualquier usuario.';