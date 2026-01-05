-- ============================================================================
-- FUNCIÓN RPC PARA OBTENER PRESTADORES POR CATEGORÍA
-- ============================================================================
-- Esta función retorna la cantidad de prestadores activos por categoría

CREATE OR REPLACE FUNCTION public.get_prestadores_por_categoria()
RETURNS TABLE (
  categoria_id bigint,
  categoria_nombre text,
  cantidad_prestadores bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as categoria_id,
    c.nombre as categoria_nombre,
    COUNT(DISTINCT p.id) as cantidad_prestadores
  FROM public.categorias c
  INNER JOIN public.servicios s ON s.categoria_id = c.id
  INNER JOIN public.prestador_servicios ps ON ps.servicio_id = s.id
  INNER JOIN public.prestadores p ON p.id = ps.prestador_id
  INNER JOIN public.users u ON u.id = p.usuario_id
  WHERE u.activo = true
  GROUP BY c.id, c.nombre
  ORDER BY c.nombre;
END;
$$;

-- Comentario para documentación
COMMENT ON FUNCTION public.get_prestadores_por_categoria() IS 
'Retorna la cantidad de prestadores activos por categoría. Usa SECURITY DEFINER para bypass RLS.';

