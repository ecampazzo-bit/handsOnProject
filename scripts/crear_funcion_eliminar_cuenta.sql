-- ============================================================================
-- FUNCIÓN RPC PARA ELIMINAR CUENTA DE USUARIO Y TODOS SUS DATOS RELACIONADOS
-- ============================================================================
-- Esta función elimina un usuario y todos sus datos relacionados en el orden
-- correcto, manejando las relaciones con 'on delete restrict'.
--
-- IMPORTANTE: Esta función usa SECURITY DEFINER para permitir eliminaciones,
-- pero valida que el usuario solo pueda eliminar su propia cuenta.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.eliminar_cuenta_usuario()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_prestador_id bigint;
  v_result jsonb;
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

  -- Obtener el prestador_id si existe (para eliminar datos relacionados)
  SELECT id INTO v_prestador_id 
  FROM public.prestadores 
  WHERE usuario_id = v_user_id 
  LIMIT 1;

  BEGIN
    -- ========================================================================
    -- PASO 1: Eliminar datos relacionados con 'on delete restrict'
    -- ========================================================================
    
    -- 1.1. Eliminar referidos (donde el usuario es referidor o referido)
    DELETE FROM public.referidos 
    WHERE referidor_id = v_user_id OR referido_id = v_user_id;

    -- 1.2. Eliminar reportes (donde el usuario es reportante o reportado)
    DELETE FROM public.reportes 
    WHERE reportante_id = v_user_id OR reportado_id = v_user_id;

    -- 1.3. Eliminar conversaciones (donde el usuario es participante)
    -- Esto eliminará automáticamente los mensajes por CASCADE (conversacion_id tiene on delete cascade)
    DELETE FROM public.conversaciones 
    WHERE participante_1_id = v_user_id OR participante_2_id = v_user_id;
    
    -- 1.4. Eliminar mensajes restantes (si los hay en otras conversaciones)
    -- Nota: La mayoría se eliminan por CASCADE al eliminar conversaciones,
    -- pero eliminamos explícitamente por si acaso
    DELETE FROM public.mensajes 
    WHERE remitente_id = v_user_id;

    -- 1.5. Eliminar calificaciones ANTES de eliminar trabajos
    -- (las calificaciones tienen trabajo_id con on delete restrict)
    DELETE FROM public.calificaciones 
    WHERE calificador_id = v_user_id OR calificado_id = v_user_id;

    -- 1.6. Eliminar pagos ANTES de eliminar trabajos
    -- (los pagos tienen trabajo_id con on delete restrict)
    -- Eliminar pagos donde el usuario es cliente
    DELETE FROM public.pagos 
    WHERE cliente_id = v_user_id;
    
    -- Si es prestador, eliminar pagos donde el usuario es prestador
    IF v_prestador_id IS NOT NULL THEN
      DELETE FROM public.pagos 
      WHERE prestador_id = v_prestador_id;
    END IF;

    -- 1.7. Eliminar trabajos (donde el usuario es cliente o prestador)
    -- IMPORTANTE: Eliminar trabajos DESPUÉS de calificaciones y pagos
    DELETE FROM public.trabajos 
    WHERE cliente_id = v_user_id;
    
    -- Si es prestador, eliminar trabajos del prestador
    IF v_prestador_id IS NOT NULL THEN
      DELETE FROM public.trabajos 
      WHERE prestador_id = v_prestador_id;
    END IF;

    -- 1.8. Si el usuario es prestador, eliminar cotizaciones
    -- (las cotizaciones tienen solicitud_id con on delete cascade)
    IF v_prestador_id IS NOT NULL THEN
      DELETE FROM public.cotizaciones 
      WHERE prestador_id = v_prestador_id;
    END IF;

    -- 1.9. Eliminar solicitudes de servicio (donde el usuario es cliente)
    -- (las solicitudes tienen cliente_id con on delete restrict)
    DELETE FROM public.solicitudes_servicio 
    WHERE cliente_id = v_user_id;

    -- ========================================================================
    -- PASO 2: Eliminar datos relacionados con 'on delete cascade'
    -- Estos se eliminan automáticamente cuando eliminamos el usuario,
    -- pero podemos eliminarlos explícitamente para mayor claridad:
    -- - prestadores (y sus datos relacionados: prestador_servicios, 
    --   disponibilidad_prestadores, zonas_cobertura, certificaciones, portfolio)
    -- - notificaciones
    -- - favoritos
    -- ========================================================================
    -- Nota: Estos se eliminarán automáticamente por CASCADE al eliminar users,
    -- pero los eliminamos explícitamente para tener control sobre el orden

    -- Eliminar favoritos
    DELETE FROM public.favoritos 
    WHERE usuario_id = v_user_id;

    -- Eliminar notificaciones
    DELETE FROM public.notificaciones 
    WHERE usuario_id = v_user_id;

    -- Si existe prestador, sus datos relacionados se eliminarán por CASCADE
    -- al eliminar el prestador, pero los eliminamos explícitamente primero
    IF v_prestador_id IS NOT NULL THEN
      DELETE FROM public.favoritos WHERE prestador_id = v_prestador_id;
      DELETE FROM public.portfolio WHERE prestador_id = v_prestador_id;
      DELETE FROM public.certificaciones WHERE prestador_id = v_prestador_id;
      DELETE FROM public.zonas_cobertura WHERE prestador_id = v_prestador_id;
      DELETE FROM public.disponibilidad_prestadores WHERE prestador_id = v_prestador_id;
      DELETE FROM public.prestador_servicios WHERE prestador_id = v_prestador_id;
      DELETE FROM public.prestadores WHERE id = v_prestador_id;
    END IF;

    -- ========================================================================
    -- PASO 3: Eliminar el usuario de la tabla users
    -- ========================================================================
    DELETE FROM public.users 
    WHERE id = v_user_id;

    -- Retornar éxito
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Cuenta eliminada exitosamente'
    );

  EXCEPTION
    WHEN OTHERS THEN
      -- En caso de error, hacer rollback y retornar error
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Error al eliminar la cuenta: ' || SQLERRM
      );
  END;

END;
$$;

-- Comentario sobre la función
COMMENT ON FUNCTION public.eliminar_cuenta_usuario IS 
'Elimina la cuenta del usuario autenticado y todos sus datos relacionados. Solo puede eliminar su propia cuenta.';

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 1. Esta función usa SECURITY DEFINER para permitir eliminaciones que
--    normalmente estarían restringidas por RLS.
--
-- 2. La función valida que solo el usuario autenticado pueda eliminar
--    su propia cuenta usando auth.uid().
--
-- 3. El orden de eliminación es importante debido a las foreign keys:
--    - Primero se eliminan datos con 'on delete restrict'
--    - Luego se eliminan datos con 'on delete cascade'
--    - Finalmente se elimina el usuario
--
-- 4. Después de ejecutar esta función, el usuario debe cerrar sesión
--    desde el cliente, ya que el usuario ya no existirá en la base de datos.
--
-- 5. Para eliminar también el usuario de auth.users, se necesita hacer
--    desde el servidor/backend usando el servicio de administración de Supabase,
--    ya que no es posible desde el cliente por razones de seguridad.
-- ============================================================================
