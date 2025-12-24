-- ============================================================================
-- FUNCIONES RPC PARA INCREMENTAR ESTADÍSTICAS DE PROMOCIONES
-- ============================================================================
-- Estas funciones permiten incrementar los contadores de vistas y clicks
-- de las promociones sin necesidad de permisos de administrador.
-- ============================================================================

-- Función para incrementar el contador de vistas
CREATE OR REPLACE FUNCTION public.incrementar_vista_promocion(
    p_promocion_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.promociones
    SET veces_mostrada = COALESCE(veces_mostrada, 0) + 1
    WHERE id = p_promocion_id
      AND estado = 'activa'
      AND activa = true
      AND fecha_inicio <= now()
      AND fecha_fin >= now();
    
    -- Si no se actualizó ninguna fila, la promoción no existe o no está activa
    IF NOT FOUND THEN
        RAISE NOTICE 'Promoción no encontrada o no activa: %', p_promocion_id;
    END IF;
END;
$$;

-- Función para incrementar el contador de clicks
CREATE OR REPLACE FUNCTION public.incrementar_click_promocion(
    p_promocion_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.promociones
    SET veces_clic = COALESCE(veces_clic, 0) + 1
    WHERE id = p_promocion_id
      AND estado = 'activa'
      AND activa = true
      AND fecha_inicio <= now()
      AND fecha_fin >= now();
    
    -- Si no se actualizó ninguna fila, la promoción no existe o no está activa
    IF NOT FOUND THEN
        RAISE NOTICE 'Promoción no encontrada o no activa: %', p_promocion_id;
    END IF;
END;
$$;

-- Función para incrementar el contador de usos (cuando se aplica el cupón)
CREATE OR REPLACE FUNCTION public.incrementar_uso_promocion(
    p_promocion_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.promociones
    SET veces_usada = COALESCE(veces_usada, 0) + 1
    WHERE id = p_promocion_id
      AND estado = 'activa'
      AND activa = true
      AND fecha_inicio <= now()
      AND fecha_fin >= now();
    
    -- Si no se actualizó ninguna fila, la promoción no existe o no está activa
    IF NOT FOUND THEN
        RAISE NOTICE 'Promoción no encontrada o no activa: %', p_promocion_id;
    END IF;
END;
$$;

-- Comentarios
COMMENT ON FUNCTION public.incrementar_vista_promocion IS 'Incrementa el contador de veces que se ha mostrado una promoción';
COMMENT ON FUNCTION public.incrementar_click_promocion IS 'Incrementa el contador de veces que se ha hecho click en una promoción';
COMMENT ON FUNCTION public.incrementar_uso_promocion IS 'Incrementa el contador de veces que se ha usado una promoción (aplicado el cupón)';

-- ============================================================================
-- NOTAS:
-- ============================================================================
-- 1. Estas funciones son seguras porque solo actualizan promociones activas
-- 2. Usan SECURITY DEFINER para permitir que usuarios autenticados las llamen
-- 3. Los contadores solo se incrementan si la promoción está activa y vigente
-- ============================================================================

