-- ============================================================================
-- AGREGAR GEOLOCALIZACIÓN Y RADIO DE COBERTURA A LA TABLA PROMOCIONES
-- ============================================================================
-- Este script agrega los campos de latitud, longitud y radio de cobertura
-- a la tabla promociones para permitir búsquedas y filtros geográficos.
-- ============================================================================
-- Agregar columnas de geolocalización y radio de cobertura
ALTER TABLE public.promociones
ADD COLUMN IF NOT EXISTS latitud numeric(10, 7),
    ADD COLUMN IF NOT EXISTS longitud numeric(10, 7),
    ADD COLUMN IF NOT EXISTS radio_cobertura_km integer;
-- Agregar comentarios a las columnas
COMMENT ON COLUMN public.promociones.latitud IS 'Latitud geográfica de la promoción (formato: -34.603722)';
COMMENT ON COLUMN public.promociones.longitud IS 'Longitud geográfica de la promoción (formato: -58.381592)';
COMMENT ON COLUMN public.promociones.radio_cobertura_km IS 'Radio de cobertura en kilómetros desde el punto de geolocalización';
-- Crear índices para búsquedas geográficas
CREATE INDEX IF NOT EXISTS idx_promociones_geolocalizacion ON public.promociones(latitud, longitud)
WHERE latitud IS NOT NULL
    AND longitud IS NOT NULL;
-- Crear índice GIST para búsquedas espaciales avanzadas (requiere extensión PostGIS)
-- Si tienes PostGIS instalado, puedes descomentar estas líneas:
-- CREATE INDEX IF NOT EXISTS idx_promociones_geolocalizacion_gist 
-- ON public.promociones USING GIST(
--   ST_SetSRID(ST_MakePoint(longitud, latitud), 4326)
-- )
-- WHERE latitud IS NOT NULL AND longitud IS NOT NULL;
-- Actualizar la vista promociones_activas para incluir los nuevos campos
-- Primero eliminamos la función que depende de la vista (si existe)
DROP FUNCTION IF EXISTS public.get_promociones_por_publico(public.tipo_usuario, integer) CASCADE;
-- Eliminamos la vista existente para evitar conflictos de columnas
DROP VIEW IF EXISTS public.promociones_activas CASCADE;
-- Recrear la vista con los nuevos campos
CREATE VIEW public.promociones_activas AS
SELECT p.*,
    c.nombre as categoria_nombre,
    s.nombre as servicio_nombre
FROM public.promociones p
    LEFT JOIN public.categorias c ON p.categoria_id = c.id
    LEFT JOIN public.servicios s ON p.servicio_id = s.id
WHERE p.estado = 'activa'
    AND p.activa = true
    AND p.fecha_inicio <= now()
    AND p.fecha_fin >= now()
ORDER BY p.orden_display ASC,
    p.fecha_creacion DESC;
-- Recrear la función que depende de la vista
CREATE OR REPLACE FUNCTION public.get_promociones_por_publico(
        p_tipo_usuario public.tipo_usuario DEFAULT NULL,
        p_categoria_id integer DEFAULT NULL
    ) RETURNS SETOF public.promociones LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN RETURN QUERY
SELECT p.*
FROM public.promociones_activas p
WHERE (
        -- Promociones generales (para todos)
        p.publico_objetivo = 'general'
        OR -- Promociones para clientes
        (
            p.publico_objetivo = 'clientes'
            AND p_tipo_usuario IN ('cliente', 'ambos')
        )
        OR -- Promociones para prestadores
        (
            p.publico_objetivo = 'prestadores'
            AND p_tipo_usuario IN ('prestador', 'ambos')
        )
        OR -- Promociones para categoría específica de prestadores
        (
            p.publico_objetivo = 'categoria_prestadores'
            AND p.categoria_id = p_categoria_id
            AND p_tipo_usuario IN ('prestador', 'ambos')
        )
    )
ORDER BY p.orden_display ASC,
    p.fecha_creacion DESC;
END;
$$;
-- Crear vista para promociones con geolocalización (útil para búsquedas geográficas)
CREATE OR REPLACE VIEW public.promociones_geolocalizadas AS
SELECT p.id,
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
    p.veces_mostrada,
    p.veces_clic,
    p.veces_usada,
    c.nombre as categoria_nombre,
    s.nombre as servicio_nombre,
    -- Calcular si la promoción tiene geolocalización completa
    CASE
        WHEN p.latitud IS NOT NULL
        AND p.longitud IS NOT NULL THEN true
        ELSE false
    END as tiene_geolocalizacion,
    -- Calcular si tiene cobertura definida
    CASE
        WHEN p.latitud IS NOT NULL
        AND p.longitud IS NOT NULL
        AND p.radio_cobertura_km IS NOT NULL THEN true
        ELSE false
    END as tiene_cobertura_completa
FROM public.promociones p
    LEFT JOIN public.categorias c ON p.categoria_id = c.id
    LEFT JOIN public.servicios s ON p.servicio_id = s.id
WHERE p.estado = 'activa'
    AND p.activa = true
    AND p.fecha_inicio <= now()
    AND p.fecha_fin >= now()
ORDER BY p.orden_display ASC,
    p.fecha_creacion DESC;
-- Función para buscar promociones por proximidad geográfica
-- Calcula la distancia usando la fórmula de Haversine (aproximación)
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
        distancia_km numeric
    ) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN RETURN QUERY
SELECT p.id,
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
    -- Calcular distancia aproximada usando fórmula de Haversine simplificada
    CASE
        WHEN p.latitud IS NOT NULL
        AND p.longitud IS NOT NULL THEN -- Fórmula de Haversine simplificada (aproximación)
        -- Radio de la Tierra: ~6371 km
        6371 * acos(
            LEAST(
                1.0,
                cos(radians(p_latitud)) * cos(radians(p.latitud)) * cos(radians(p.longitud) - radians(p_longitud)) + sin(radians(p_latitud)) * sin(radians(p.latitud))
            )
        )
        ELSE NULL
    END as distancia_km
FROM public.promociones p
    LEFT JOIN public.categorias c ON p.categoria_id = c.id
    LEFT JOIN public.servicios s ON p.servicio_id = s.id
WHERE p.estado = 'activa'
    AND p.activa = true
    AND p.fecha_inicio <= now()
    AND p.fecha_fin >= now() -- Filtrar por tipo de usuario si se especifica
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
    ) -- Filtrar por proximidad geográfica
    AND (
        -- Promociones sin geolocalización (globales)
        (
            p.latitud IS NULL
            OR p.longitud IS NULL
        )
        OR -- Promociones dentro del radio especificado
        (
            p.latitud IS NOT NULL
            AND p.longitud IS NOT NULL
            AND (
                -- Si la promoción tiene su propio radio de cobertura, usar ese
                (
                    p.radio_cobertura_km IS NOT NULL
                    AND 6371 * acos(
                        LEAST(
                            1.0,
                            cos(radians(p_latitud)) * cos(radians(p.latitud)) * cos(radians(p.longitud) - radians(p_longitud)) + sin(radians(p_latitud)) * sin(radians(p.latitud))
                        )
                    ) <= p.radio_cobertura_km
                )
                OR -- Si no tiene radio propio, usar el radio de búsqueda
                (
                    p.radio_cobertura_km IS NULL
                    AND 6371 * acos(
                        LEAST(
                            1.0,
                            cos(radians(p_latitud)) * cos(radians(p.latitud)) * cos(radians(p.longitud) - radians(p_longitud)) + sin(radians(p_latitud)) * sin(radians(p.latitud))
                        )
                    ) <= p_radio_km
                )
            )
        )
    )
ORDER BY -- Ordenar primero por promociones con geolocalización (más relevantes)
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
-- Comentarios para las vistas y funciones
COMMENT ON VIEW public.promociones_activas IS 'Vista de promociones activas con información de categoría y servicio, incluye campos de geolocalización';
COMMENT ON VIEW public.promociones_geolocalizadas IS 'Vista especializada de promociones activas con campos de geolocalización y flags de cobertura';
COMMENT ON FUNCTION public.get_promociones_por_publico IS 'Obtiene promociones activas según el tipo de usuario y categoría. Actualizada para incluir campos de geolocalización.';
COMMENT ON FUNCTION public.get_promociones_por_proximidad IS 'Obtiene promociones activas filtradas por proximidad geográfica usando la fórmula de Haversine. Incluye promociones globales (sin geolocalización) y respeta el radio de cobertura de cada promoción.';
-- Verificar que las columnas se agregaron correctamente
SELECT column_name,
    data_type,
    numeric_precision,
    numeric_scale,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'promociones'
    AND column_name IN ('latitud', 'longitud', 'radio_cobertura_km');
-- ============================================================================
-- NOTAS:
-- ============================================================================
-- 1. Los campos latitud, longitud y radio_cobertura_km son opcionales (NULL permitido)
--    para promociones que no requieren geolocalización.
--
-- 2. Formato de coordenadas:
--    - Latitud: -90 a 90 (negativo = Sur, positivo = Norte)
--    - Longitud: -180 a 180 (negativo = Oeste, positivo = Este)
--    - Ejemplo Buenos Aires: latitud -34.603722, longitud -58.381592
--
-- 3. Radio de cobertura:
--    - Se expresa en kilómetros (integer)
--    - Define el área de cobertura desde el punto de geolocalización
--    - Si es NULL, la promoción puede ser global o sin restricción geográfica
--
-- 4. El índice idx_promociones_geolocalizacion solo incluye registros
--    que tienen valores de latitud y longitud (índice parcial).
--
-- 5. Para búsquedas geográficas avanzadas (por ejemplo, encontrar promociones
--    dentro de un radio), considera instalar la extensión PostGIS.
-- ============================================================================