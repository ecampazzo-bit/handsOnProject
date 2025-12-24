-- ============================================================================
-- FUNCIONES RPC PARA INCREMENTAR ESTADÍSTICAS DE PROMOCIONES
-- ============================================================================
-- Ejecutar este script en Supabase SQL Editor
-- Después de ejecutar, puede tomar unos segundos para que PostgREST actualice
-- su schema cache. Si los errores persisten, intenta refrescar la app.
-- ============================================================================
-- Eliminar funciones existentes si existen (para recrearlas limpiamente)
-- Usar CASCADE para eliminar todas las variantes y dependencias
DO $$
DECLARE r record;
BEGIN -- Eliminar todas las variantes de incrementar_vista_promocion
FOR r IN
SELECT oid,
    proname,
    pg_get_function_identity_arguments(oid) as args
FROM pg_proc
WHERE proname = 'incrementar_vista_promocion'
    AND pronamespace = (
        SELECT oid
        FROM pg_namespace
        WHERE nspname = 'public'
    ) LOOP EXECUTE format(
        'DROP FUNCTION IF EXISTS public.%I(%s) CASCADE',
        r.proname,
        r.args
    );
END LOOP;
-- Eliminar todas las variantes de incrementar_click_promocion
FOR r IN
SELECT oid,
    proname,
    pg_get_function_identity_arguments(oid) as args
FROM pg_proc
WHERE proname = 'incrementar_click_promocion'
    AND pronamespace = (
        SELECT oid
        FROM pg_namespace
        WHERE nspname = 'public'
    ) LOOP EXECUTE format(
        'DROP FUNCTION IF EXISTS public.%I(%s) CASCADE',
        r.proname,
        r.args
    );
END LOOP;
-- Eliminar todas las variantes de incrementar_uso_promocion
FOR r IN
SELECT oid,
    proname,
    pg_get_function_identity_arguments(oid) as args
FROM pg_proc
WHERE proname = 'incrementar_uso_promocion'
    AND pronamespace = (
        SELECT oid
        FROM pg_namespace
        WHERE nspname = 'public'
    ) LOOP EXECUTE format(
        'DROP FUNCTION IF EXISTS public.%I(%s) CASCADE',
        r.proname,
        r.args
    );
END LOOP;
END $$;
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
END IF;
END IF;
END;
$$;
-- Otorgar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.incrementar_vista_promocion(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.incrementar_click_promocion(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.incrementar_uso_promocion(uuid) TO authenticated;
-- Comentarios
COMMENT ON FUNCTION public.incrementar_vista_promocion IS 'Incrementa el contador de veces que se ha mostrado una promoción';
COMMENT ON FUNCTION public.incrementar_click_promocion IS 'Incrementa el contador de veces que se ha hecho click en una promoción';
COMMENT ON FUNCTION public.incrementar_uso_promocion IS 'Incrementa el contador de veces que se ha usado una promoción (aplicado el cupón)';
-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- Ejecuta esto después para verificar que las funciones fueron creadas:
-- SELECT routine_name, routine_type 
-- FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
--   AND routine_name LIKE 'incrementar%promocion';
-- ============================================================================
-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 1. Si después de ejecutar este script los errores persisten:
--    - Espera 10-30 segundos para que PostgREST actualice su cache
--    - Recarga completamente la app móvil
--    - Si aún no funciona, contacta soporte de Supabase o verifica los logs
--
-- 2. Para forzar la actualización del schema cache de PostgREST:
--    Puedes intentar hacer un cambio menor en una tabla (ej: agregar un comentario)
--    y luego revertirlo, o simplemente esperar unos minutos.
-- ============================================================================