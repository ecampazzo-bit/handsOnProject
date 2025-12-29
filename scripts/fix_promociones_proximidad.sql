-- ============================================================================
-- FIX: Corregir función get_promociones_por_proximidad
-- Problema: La función permite promociones fuera del radio de cobertura
-- Solución: Asegurar que el cálculo de distancia use el tipo correcto y 
--           que las promociones con coordenadas inválidas sean filtradas
-- ============================================================================

-- Eliminar la función existente para recrearla con la corrección
DROP FUNCTION IF EXISTS public.get_promociones_por_proximidad(numeric, numeric, integer, public.tipo_usuario, integer);

-- Recrear la función con el tipo de retorno corregido
CREATE OR REPLACE FUNCTION public.get_promociones_por_proximidad(
    p_latitud numeric,
    p_longitud numeric,
    p_radio_km integer DEFAULT 10,
    p_tipo_usuario public.tipo_usuario DEFAULT NULL,
    p_categoria_id integer DEFAULT NULL
) RETURNS TABLE (
    id uuid,
    titulo text,
    descripcion text,
    codigo_cupon text,
    imagen_url text,
    imagen_mobile_url text,
    fecha_inicio timestamptz,
    fecha_fin timestamptz,
    publico_objetivo public.tipo_publico_promocion,
    categoria_id integer,
    servicio_id integer,
    estado public.estado_promocion,
    activa boolean,
    orden_display integer,
    empresa_nombre text,
    empresa_contacto text,
    whatsapp text,
    latitud numeric,
    longitud numeric,
    radio_cobertura_km integer,
    categoria_nombre text,
    servicio_nombre text,
    distancia_km numeric  -- Cambiar a numeric para consistencia
) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ 
BEGIN 
    RETURN QUERY
    SELECT 
        p.id,
        p.titulo,
        p.descripcion,
        p.codigo_cupon,
        p.imagen_url,
        p.imagen_mobile_url,
        p.fecha_inicio,
        p.fecha_fin,
        p.publico_objetivo,
        p.categoria_id,
        p.servicio_id,
        p.estado,
        p.activa,
        p.orden_display,
        p.empresa_nombre,
        p.empresa_contacto,
        p.whatsapp,
        p.latitud,
        p.longitud,
        p.radio_cobertura_km,
        c.nombre as categoria_nombre,
        s.nombre as servicio_nombre,
        -- Calcular distancia usando fórmula de Haversine (convertir a numeric)
        CASE
            WHEN p.latitud IS NOT NULL
            AND p.longitud IS NOT NULL THEN
                -- Validar que las coordenadas sean válidas (latitud entre -90 y 90, longitud entre -180 y 180)
                CASE
                    WHEN p.latitud BETWEEN -90 AND 90 
                    AND p.longitud BETWEEN -180 AND 180 THEN
                        -- Fórmula de Haversine: distancia en km
                        (6371.0 * acos(
                            LEAST(
                                1.0,
                                cos(radians(p_latitud::double precision)) * 
                                cos(radians(p.latitud::double precision)) * 
                                cos(radians(p.longitud::double precision) - radians(p_longitud::double precision)) + 
                                sin(radians(p_latitud::double precision)) * 
                                sin(radians(p.latitud::double precision))
                            )
                        ))::numeric
                    ELSE NULL  -- Coordenadas inválidas
                END
            ELSE NULL
        END as distancia_km
    FROM public.promociones p
        LEFT JOIN public.categorias c ON p.categoria_id = c.id
        LEFT JOIN public.servicios s ON p.servicio_id = s.id
    WHERE 
        p.estado = 'activa'
        AND p.activa = true
        AND p.fecha_inicio <= now()
        AND p.fecha_fin >= now()
        -- Filtrar por tipo de usuario si se especifica
        AND (
            p_tipo_usuario IS NULL
            OR p.publico_objetivo = 'general'
            OR (
                p.publico_objetivo = 'clientes'
                AND p_tipo_usuario IN ('cliente', 'ambos')
            )
            OR (
                p.publico_objetivo = 'prestadores'
                AND p_tipo_usuario IN ('prestador', 'ambos')
            )
            OR (
                p.publico_objetivo = 'categoria_prestadores'
                AND p.categoria_id = p_categoria_id
                AND p_tipo_usuario IN ('prestador', 'ambos')
            )
        )
        -- Filtrar por proximidad geográfica
        AND (
            -- Promociones sin geolocalización (globales) - solo si realmente no tienen coordenadas
            (
                p.latitud IS NULL
                OR p.longitud IS NULL
            )
            OR 
            -- Promociones con geolocalización válida dentro del radio
            (
                p.latitud IS NOT NULL
                AND p.longitud IS NOT NULL
                -- Validar que las coordenadas sean válidas
                AND p.latitud BETWEEN -90 AND 90
                AND p.longitud BETWEEN -180 AND 180
                AND (
                    -- Si la promoción tiene su propio radio de cobertura, usar ese
                    (
                        p.radio_cobertura_km IS NOT NULL
                        AND (6371.0 * acos(
                            LEAST(
                                1.0,
                                cos(radians(p_latitud::double precision)) * 
                                cos(radians(p.latitud::double precision)) * 
                                cos(radians(p.longitud::double precision) - radians(p_longitud::double precision)) + 
                                sin(radians(p_latitud::double precision)) * 
                                sin(radians(p.latitud::double precision))
                            )
                        ))::numeric <= p.radio_cobertura_km
                    )
                    OR 
                    -- Si no tiene radio propio, usar el radio de búsqueda
                    (
                        p.radio_cobertura_km IS NULL
                        AND (6371.0 * acos(
                            LEAST(
                                1.0,
                                cos(radians(p_latitud::double precision)) * 
                                cos(radians(p.latitud::double precision)) * 
                                cos(radians(p.longitud::double precision) - radians(p_longitud::double precision)) + 
                                sin(radians(p_latitud::double precision)) * 
                                sin(radians(p.latitud::double precision))
                            )
                        ))::numeric <= p_radio_km
                    )
                )
            )
        )
    ORDER BY 
        -- Ordenar primero por promociones con geolocalización (más relevantes)
        CASE
            WHEN p.latitud IS NOT NULL
            AND p.longitud IS NOT NULL THEN 0
            ELSE 1
        END,
        -- Luego por distancia (más cercanas primero)
        distancia_km ASC NULLS LAST,
        -- Finalmente por orden de display y fecha
        p.orden_display ASC,
        p.fecha_creacion DESC;
END;
$$;

-- Comentario actualizado
COMMENT ON FUNCTION public.get_promociones_por_proximidad IS 
'Obtiene promociones activas filtradas por proximidad geográfica usando la fórmula de Haversine. 
Incluye promociones globales (sin geolocalización) y respeta el radio de cobertura de cada promoción.
Valida que las coordenadas sean válidas (latitud entre -90 y 90, longitud entre -180 y 180).
Las promociones con coordenadas inválidas o fuera del radio de cobertura son excluidas.';

