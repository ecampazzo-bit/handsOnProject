-- ============================================================================
-- SISTEMA DE PROMOCIONES
-- ============================================================================
-- Este script crea las tablas necesarias para gestionar promociones,
-- ofertas, cupones de descuento y publicidad de empresas en la plataforma.
-- ============================================================================
-- Crear ENUM para tipo de público objetivo
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'tipo_publico_promocion'
) THEN CREATE TYPE public.tipo_publico_promocion AS ENUM (
    'general',
    'clientes',
    'prestadores',
    'categoria_prestadores'
);
END IF;
END $$;
-- Crear ENUM para estado de promoción
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'estado_promocion'
) THEN CREATE TYPE public.estado_promocion AS ENUM (
    'borrador',
    'activa',
    'pausada',
    'finalizada',
    'cancelada'
);
END IF;
END $$;
-- Tabla principal de promociones
CREATE TABLE IF NOT EXISTS public.promociones (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Información básica
    titulo text NOT NULL,
    descripcion text,
    codigo_cupon text,
    -- Código de descuento opcional (ej: "DESCUENTO20")
    -- Imágenes
    imagen_url text,
    -- URL de la imagen principal de la promoción
    imagen_mobile_url text,
    -- URL de imagen optimizada para mobile (opcional)
    -- Fechas y duración
    fecha_inicio timestamptz NOT NULL,
    fecha_fin timestamptz NOT NULL,
    fecha_creacion timestamptz NOT NULL DEFAULT now(),
    fecha_actualizacion timestamptz NOT NULL DEFAULT now(),
    -- Público objetivo
    publico_objetivo public.tipo_publico_promocion NOT NULL DEFAULT 'general',
    categoria_id integer,
    -- Si publico_objetivo es 'categoria_prestadores', referencia a categorias.id
    servicio_id integer,
    -- Opcional: para promociones de servicios específicos
    -- Estado y configuración
    estado public.estado_promocion NOT NULL DEFAULT 'borrador',
    activa boolean NOT NULL DEFAULT true,
    orden_display integer DEFAULT 0,
    -- Orden de visualización (menor = primero)
    -- Información de la empresa/promocionante
    empresa_nombre text,
    -- Nombre de la empresa que promociona
    empresa_contacto text,
    -- Email o teléfono de contacto
    -- Estadísticas
    veces_mostrada integer DEFAULT 0,
    veces_clic integer DEFAULT 0,
    veces_usada integer DEFAULT 0,
    -- Cuántas veces se usó el cupón
    -- Metadata adicional (JSON)
    metadata jsonb,
    -- Para almacenar información adicional flexible
    -- Constraints
    CONSTRAINT promociones_fecha_fin_mayor CHECK (fecha_fin > fecha_inicio),
    CONSTRAINT promociones_categoria_fk FOREIGN KEY (categoria_id) REFERENCES public.categorias(id) ON DELETE
    SET NULL,
        CONSTRAINT promociones_servicio_fk FOREIGN KEY (servicio_id) REFERENCES public.servicios(id) ON DELETE
    SET NULL
);
-- Índices
CREATE INDEX IF NOT EXISTS idx_promociones_estado ON public.promociones(estado);
CREATE INDEX IF NOT EXISTS idx_promociones_activa ON public.promociones(activa);
CREATE INDEX IF NOT EXISTS idx_promociones_fecha_inicio ON public.promociones(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_promociones_fecha_fin ON public.promociones(fecha_fin);
CREATE INDEX IF NOT EXISTS idx_promociones_publico_objetivo ON public.promociones(publico_objetivo);
CREATE INDEX IF NOT EXISTS idx_promociones_categoria_id ON public.promociones(categoria_id);
CREATE INDEX IF NOT EXISTS idx_promociones_servicio_id ON public.promociones(servicio_id);
CREATE INDEX IF NOT EXISTS idx_promociones_codigo_cupon ON public.promociones(codigo_cupon);
CREATE INDEX IF NOT EXISTS idx_promociones_fechas_activas ON public.promociones(fecha_inicio, fecha_fin, activa, estado);
-- Índice GIN para búsqueda en metadata JSON
CREATE INDEX IF NOT EXISTS idx_promociones_metadata ON public.promociones USING GIN(metadata);
-- Índice único parcial para código_cupon (solo cuando no es NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_promociones_codigo_cupon_unique ON public.promociones(codigo_cupon)
WHERE codigo_cupon IS NOT NULL;
-- Tabla de uso de promociones (tracking)
CREATE TABLE IF NOT EXISTS public.promociones_uso (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    promocion_id uuid NOT NULL REFERENCES public.promociones(id) ON DELETE CASCADE,
    usuario_id uuid REFERENCES public.users(id) ON DELETE
    SET NULL,
        fecha_uso timestamptz NOT NULL DEFAULT now(),
        ip_address inet,
        -- Para tracking adicional
        user_agent text,
        -- User agent del navegador
        codigo_usado text,
        -- Código de cupón usado si aplica
        CONSTRAINT promociones_uso_promocion_fk FOREIGN KEY (promocion_id) REFERENCES public.promociones(id) ON DELETE CASCADE,
        CONSTRAINT promociones_uso_usuario_fk FOREIGN KEY (usuario_id) REFERENCES public.users(id) ON DELETE
    SET NULL
);
-- Índices para tracking
CREATE INDEX IF NOT EXISTS idx_promociones_uso_promocion ON public.promociones_uso(promocion_id);
CREATE INDEX IF NOT EXISTS idx_promociones_uso_usuario ON public.promociones_uso(usuario_id);
CREATE INDEX IF NOT EXISTS idx_promociones_uso_fecha ON public.promociones_uso(fecha_uso);
-- Trigger para actualizar fecha_actualizacion
CREATE OR REPLACE FUNCTION public.set_promociones_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.fecha_actualizacion = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER set_promociones_updated_at BEFORE
UPDATE ON public.promociones FOR EACH ROW EXECUTE FUNCTION public.set_promociones_updated_at();
-- Trigger para actualizar contador de veces_usada
CREATE OR REPLACE FUNCTION public.incrementar_uso_promocion() RETURNS TRIGGER AS $$ BEGIN
UPDATE public.promociones
SET veces_usada = veces_usada + 1
WHERE id = NEW.promocion_id;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER incrementar_uso_promocion
AFTER
INSERT ON public.promociones_uso FOR EACH ROW EXECUTE FUNCTION public.incrementar_uso_promocion();
-- Habilitar RLS
ALTER TABLE public.promociones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promociones_uso ENABLE ROW LEVEL SECURITY;
-- Políticas RLS para promociones
-- Lectura pública de promociones activas
CREATE POLICY "Public can view active promotions" ON public.promociones FOR
SELECT USING (
        estado = 'activa'
        AND activa = true
        AND fecha_inicio <= now()
        AND fecha_fin >= now()
    );
-- Solo administradores pueden insertar/actualizar/eliminar
CREATE POLICY "Admins can manage promotions" ON public.promociones FOR ALL USING (
    auth.role() = 'authenticated'
    AND public.is_admin(auth.uid())
) WITH CHECK (
    auth.role() = 'authenticated'
    AND public.is_admin(auth.uid())
);
-- Políticas RLS para promociones_uso
-- Usuarios pueden registrar su propio uso
CREATE POLICY "Users can track own promotion usage" ON public.promociones_uso FOR
INSERT WITH CHECK (
        auth.role() = 'authenticated'
        AND usuario_id = auth.uid()
    );
-- Lectura pública (sin datos sensibles)
CREATE POLICY "Public can view promotion usage stats" ON public.promociones_uso FOR
SELECT USING (true);
-- Administradores pueden ver todo
CREATE POLICY "Admins can view all promotion usage" ON public.promociones_uso FOR ALL USING (
    auth.role() = 'authenticated'
    AND public.is_admin(auth.uid())
) WITH CHECK (
    auth.role() = 'authenticated'
    AND public.is_admin(auth.uid())
);
-- Vista para promociones activas (optimizada)
CREATE OR REPLACE VIEW public.promociones_activas AS
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
-- Función para obtener promociones según público objetivo
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
-- Comentarios
COMMENT ON TABLE public.promociones IS 'Tabla principal de promociones, ofertas y cupones de descuento';
COMMENT ON COLUMN public.promociones.codigo_cupon IS 'Código único de cupón/descuento (ej: "VERANO2025")';
COMMENT ON COLUMN public.promociones.publico_objetivo IS 'Tipo de público al que va dirigida la promoción';
COMMENT ON COLUMN public.promociones.metadata IS 'JSON con información adicional flexible (descuento %, condiciones, etc.)';
COMMENT ON TABLE public.promociones_uso IS 'Registro de uso de promociones para tracking y estadísticas';
COMMENT ON FUNCTION public.get_promociones_por_publico IS 'Obtiene promociones activas según el tipo de usuario y categoría';
-- ============================================================================
-- NOTAS:
-- ============================================================================
-- 1. Las promociones solo son visibles públicamente si:
--    - estado = 'activa'
--    - activa = true
--    - fecha_inicio <= now()
--    - fecha_fin >= now()
--
-- 2. Solo administradores pueden crear/editar/eliminar promociones
--
-- 3. Los usuarios pueden registrar su uso de promociones
--
-- 4. El campo metadata puede almacenar información como:
--    - porcentaje_descuento
--    - monto_descuento
--    - condiciones
--    - link_externo
--    - etc.
--
-- 5. Crear bucket de Storage "promociones" para las imágenes
-- ============================================================================