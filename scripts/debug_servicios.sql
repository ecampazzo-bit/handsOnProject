-- ============================================================================
-- Script para verificar y debuggear los servicios y prestadores
-- Ejecuta esto en el SQL Editor de Supabase
-- ============================================================================
-- 1. Ver todos los servicios disponibles
SELECT id,
  nombre,
  categoria_id
FROM public.servicios
ORDER BY nombre;
-- 2. Ver las categorías
SELECT id,
  nombre
FROM public.categorias
ORDER BY nombre;
-- 3. Ver prestadores creados
SELECT id,
  usuario_id,
  descripcion_profesional,
  created_at
FROM public.prestadores
ORDER BY created_at DESC
LIMIT 10;
-- 4. Ver usuarios y sus tipos
SELECT id,
  email,
  nombre,
  apellido,
  tipo_usuario,
  verificado
FROM public.users
ORDER BY created_at DESC
LIMIT 10;
-- 5. Ver servicios de prestadores (prestador_servicios)
SELECT ps.id,
  ps.prestador_id,
  ps.servicio_id,
  s.nombre as nombre_servicio,
  p.usuario_id,
  u.nombre as nombre_usuario
FROM public.prestador_servicios ps
  LEFT JOIN public.prestadores p ON ps.prestador_id = p.id
  LEFT JOIN public.users u ON p.usuario_id = u.id
  LEFT JOIN public.servicios s ON ps.servicio_id = s.id
ORDER BY ps.fecha_agregado DESC
LIMIT 20;
-- 6. Buscar específicamente por "Albañil"
SELECT id,
  nombre,
  categoria_id
FROM public.servicios
WHERE nombre ILIKE '%Alb%';
-- 7. Si necesitas crear los servicios que faltan, ejecuta esto:
-- (Esto solo si los servicios no existen en la BD)
-- Primero, obtener o crear las categorías
DO $$
DECLARE v_construccion_id bigint;
BEGIN -- Obtener ID de categoría "Construcción y Albañilería"
SELECT id INTO v_construccion_id
FROM public.categorias
WHERE nombre = 'Construcción y Albañilería'
LIMIT 1;
-- Si no existe, crearla
IF v_construccion_id IS NULL THEN
INSERT INTO public.categorias (nombre)
VALUES ('Construcción y Albañilería')
RETURNING id INTO v_construccion_id;
END IF;
-- Insertar servicios de construcción si no existen
INSERT INTO public.servicios (nombre, categoria_id)
VALUES ('Albañil', v_construccion_id),
  ('Constructor', v_construccion_id),
  ('Maestro mayor de obras', v_construccion_id) ON CONFLICT DO NOTHING;
END $$;
-- 8. Para debugging: Ver qué está intentando guardar un usuario específico
-- Reemplaza 'usuario@example.com' con el email real
SELECT u.id,
  u.email,
  u.nombre,
  u.tipo_usuario,
  p.id as prestador_id,
  COUNT(ps.id) as cantidad_servicios
FROM public.users u
  LEFT JOIN public.prestadores p ON u.id = p.usuario_id
  LEFT JOIN public.prestador_servicios ps ON p.id = ps.prestador_id
WHERE u.email = 'usuario@example.com'
GROUP BY u.id,
  p.id;