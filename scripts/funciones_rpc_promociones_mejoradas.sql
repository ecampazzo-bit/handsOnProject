-- ============================================================================
-- FUNCIONES RPC MEJORADAS PARA INCREMENTAR ESTADÍSTICAS DE PROMOCIONES
-- ============================================================================
-- Estas funciones actualizan los contadores incluso si la promoción no está
-- completamente activa, pero priorizan promociones activas.
-- ============================================================================
-- Función para incrementar el contador de vistas
CREATE OR REPLACE FUNCTION public.incrementar_vista_promocion(p_promocion_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN -- Primero intentar actualizar solo si está activa y vigente
UPDATE public.promociones
SET veces_mostrada = COALESCE(veces_mostrada, 0) + 1
WHERE id = p_promocion_id
    AND estado = 'activa'
    AND activa = true
    AND fecha_inicio <= now()
    AND fecha_fin >= now();
-- Si no se actualizó, intentar actualizar de todas formas (solo verificar que existe)
IF NOT FOUND THEN
UPDATE public.promociones
SET veces_mostrada = COALESCE(veces_mostrada, 0) + 1
WHERE id = p_promocion_id;
IF NOT FOUND THEN RAISE NOTICE 'Promoción no encontrada: %',
p_promocion_id;
ELSE RAISE NOTICE 'Vista registrada para promoción no activa: %',
p_promocion_id;
END IF;
END IF;
END;
$$;
-- Función para incrementar el contador de clicks
CREATE OR REPLACE FUNCTION public.incrementar_click_promocion(p_promocion_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN -- Primero intentar actualizar solo si está activa y vigente
UPDATE public.promociones
SET veces_clic = COALESCE(veces_clic, 0) + 1
WHERE id = p_promocion_id
    AND estado = 'activa'
    AND activa = true
    AND fecha_inicio <= now()
    AND fecha_fin >= now();
-- Si no se actualizó, intentar actualizar de todas formas (solo verificar que existe)
IF NOT FOUND THEN
UPDATE public.promociones
SET veces_clic = COALESCE(veces_clic, 0) + 1
WHERE id = p_promocion_id;
IF NOT FOUND THEN RAISE NOTICE 'Promoción no encontrada: %',
p_promocion_id;
ELSE RAISE NOTICE 'Click registrado para promoción no activa: %',
p_promocion_id;
END IF;
END IF;
END;
$$;
-- Función para incrementar el contador de usos
CREATE OR REPLACE FUNCTION public.incrementar_uso_promocion(p_promocion_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN -- Primero intentar actualizar solo si está activa y vigente
UPDATE public.promociones
SET veces_usada = COALESCE(veces_usada, 0) + 1
WHERE id = p_promocion_id
    AND estado = 'activa'
    AND activa = true
    AND fecha_inicio <= now()
    AND fecha_fin >= now();
-- Si no se actualizó, intentar actualizar de todas formas (solo verificar que existe)
IF NOT FOUND THEN
UPDATE public.promociones
SET veces_usada = COALESCE(veces_usada, 0) + 1
WHERE id = p_promocion_id;
IF NOT FOUND THEN RAISE NOTICE 'Promoción no encontrada: %',
p_promocion_id;
ELSE RAISE NOTICE 'Uso registrado para promoción no activa: %',
p_promocion_id;
END IF;
END IF;
END;
$$;
-- Comentarios
COMMENT ON FUNCTION public.incrementar_vista_promocion IS 'Incrementa el contador de veces que se ha mostrado una promoción';
COMMENT ON FUNCTION public.incrementar_click_promocion IS 'Incrementa el contador de veces que se ha hecho click en una promoción';
COMMENT ON FUNCTION public.incrementar_uso_promocion IS 'Incrementa el contador de veces que se ha usado una promoción (aplicado el cupón)';
-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- Para verificar que las funciones fueron creadas:
-- SELECT routine_name, routine_type 
-- FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
--   AND routine_name LIKE 'incrementar%promocion';
-- ============================================================================