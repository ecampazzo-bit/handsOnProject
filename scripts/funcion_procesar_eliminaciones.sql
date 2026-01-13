-- ============================================================================
-- FUNCIÓN PARA PROCESAR ELIMINACIONES PROGRAMADAS
-- ============================================================================
-- Esta función debe ejecutarse periódicamente (cron job) para procesar
-- las solicitudes de eliminación cuya fecha_eliminacion ha llegado.
-- ============================================================================

-- Mantener la función original para procesar eliminaciones
CREATE OR REPLACE FUNCTION public.procesar_eliminacion_cuenta(
  p_usuario_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prestador_id bigint;
BEGIN
  -- Verificar que el usuario existe
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_usuario_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuario no encontrado'
    );
  END IF;

  -- Obtener el prestador_id si existe (para eliminar datos relacionados)
  SELECT id INTO v_prestador_id 
  FROM public.prestadores 
  WHERE usuario_id = p_usuario_id 
  LIMIT 1;

  BEGIN
    -- ========================================================================
    -- PASO 1: Eliminar datos relacionados con 'on delete restrict'
    -- ========================================================================
    
    -- 1.1. Eliminar referidos (donde el usuario es referidor o referido)
    DELETE FROM public.referidos 
    WHERE referidor_id = p_usuario_id OR referido_id = p_usuario_id;

    -- 1.2. Eliminar reportes (donde el usuario es reportante o reportado)
    DELETE FROM public.reportes 
    WHERE reportante_id = p_usuario_id OR reportado_id = p_usuario_id;

    -- 1.3. Eliminar conversaciones (donde el usuario es participante)
    DELETE FROM public.conversaciones 
    WHERE participante_1_id = p_usuario_id OR participante_2_id = p_usuario_id;
    
    -- 1.4. Eliminar mensajes restantes
    DELETE FROM public.mensajes 
    WHERE remitente_id = p_usuario_id;

    -- 1.5. Eliminar calificaciones ANTES de eliminar trabajos
    DELETE FROM public.calificaciones 
    WHERE calificador_id = p_usuario_id OR calificado_id = p_usuario_id;

    -- 1.6. Eliminar pagos ANTES de eliminar trabajos
    DELETE FROM public.pagos 
    WHERE cliente_id = p_usuario_id;
    
    IF v_prestador_id IS NOT NULL THEN
      DELETE FROM public.pagos 
      WHERE prestador_id = v_prestador_id;
    END IF;

    -- 1.7. Eliminar trabajos
    DELETE FROM public.trabajos 
    WHERE cliente_id = p_usuario_id;
    
    IF v_prestador_id IS NOT NULL THEN
      DELETE FROM public.trabajos 
      WHERE prestador_id = v_prestador_id;
    END IF;

    -- 1.8. Si el usuario es prestador, eliminar cotizaciones
    IF v_prestador_id IS NOT NULL THEN
      DELETE FROM public.cotizaciones 
      WHERE prestador_id = v_prestador_id;
    END IF;

    -- 1.9. Eliminar solicitudes de servicio
    DELETE FROM public.solicitudes_servicio 
    WHERE cliente_id = p_usuario_id;

    -- ========================================================================
    -- PASO 2: Eliminar datos relacionados con 'on delete cascade'
    -- ========================================================================

    DELETE FROM public.favoritos 
    WHERE usuario_id = p_usuario_id;

    DELETE FROM public.notificaciones 
    WHERE usuario_id = p_usuario_id;

    IF v_prestador_id IS NOT NULL THEN
      -- Eliminar favoritos donde el prestador es favorito
      DELETE FROM public.favoritos WHERE prestador_id = v_prestador_id;
      -- Eliminar portfolio del prestador (si existe)
      DELETE FROM public.portfolio WHERE prestador_id = v_prestador_id;
      -- Eliminar certificaciones del prestador (si existe)
      DELETE FROM public.certificaciones WHERE prestador_id = v_prestador_id;
      -- Eliminar prestador_servicios del prestador
      DELETE FROM public.prestador_servicios WHERE prestador_id = v_prestador_id;
      -- Eliminar el prestador (las tablas con on delete cascade se eliminarán automáticamente)
      DELETE FROM public.prestadores WHERE id = v_prestador_id;
    END IF;

    -- ========================================================================
    -- PASO 3: Eliminar el usuario de la tabla users
    -- ========================================================================
    DELETE FROM public.users 
    WHERE id = p_usuario_id;

    -- Actualizar estado de la solicitud
    UPDATE public.solicitudes_eliminacion
    SET estado = 'procesada',
        procesada_at = now()
    WHERE usuario_id = p_usuario_id AND estado = 'pendiente';

    -- Retornar éxito
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Cuenta eliminada exitosamente'
    );

  EXCEPTION
    WHEN OTHERS THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Error al eliminar la cuenta: ' || SQLERRM
      );
  END;

END;
$$;

-- Función para procesar todas las eliminaciones pendientes cuya fecha ha llegado
CREATE OR REPLACE FUNCTION public.procesar_eliminaciones_programadas()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_solicitud RECORD;
  v_resultado jsonb;
  v_procesadas integer := 0;
  v_errores integer := 0;
BEGIN
  -- Procesar todas las solicitudes cuya fecha_eliminacion ha llegado
  FOR v_solicitud IN
    SELECT usuario_id
    FROM public.solicitudes_eliminacion
    WHERE estado = 'pendiente'
      AND fecha_eliminacion <= now()
  LOOP
    -- Procesar cada eliminación
    v_resultado := public.procesar_eliminacion_cuenta(v_solicitud.usuario_id);
    
    IF (v_resultado->>'success')::boolean THEN
      v_procesadas := v_procesadas + 1;
    ELSE
      v_errores := v_errores + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'procesadas', v_procesadas,
    'errores', v_errores,
    'total', v_procesadas + v_errores
  );

END;
$$;

COMMENT ON FUNCTION public.procesar_eliminacion_cuenta IS 
'Procesa la eliminación efectiva de una cuenta de usuario y todos sus datos relacionados. Usado por administradores o procesos automatizados.';

COMMENT ON FUNCTION public.procesar_eliminaciones_programadas IS 
'Procesa todas las solicitudes de eliminación cuya fecha_eliminacion ha llegado. Debe ejecutarse periódicamente mediante un cron job.';
