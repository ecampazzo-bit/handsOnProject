-- ============================================================================
-- Script para verificar las relaciones: Usuario -> Prestador -> Servicios
-- Ejecuta esto en el SQL Editor de Supabase
-- ============================================================================
-- PASO 1: Ver todos los usuarios prestadores
SELECT u.id,
    u.email,
    u.nombre,
    u.apellido,
    u.tipo_usuario,
    p.id as prestador_id,
    COUNT(ps.id) as cantidad_servicios_vinculados
FROM public.users u
    LEFT JOIN public.prestadores p ON u.id = p.usuario_id
    LEFT JOIN public.prestador_servicios ps ON p.id = ps.prestador_id
WHERE u.tipo_usuario IN ('prestador', 'ambos')
GROUP BY u.id,
    p.id
ORDER BY u.created_at DESC;
-- PASO 2: Ver el prestador específico que quieres debuggear
-- Reemplaza 'tu_email@example.com' con el email del prestador
SELECT u.id as usuario_id,
    u.email,
    u.nombre,
    p.id as prestador_id,
    p.usuario_id,
    p.descripcion_profesional,
    p.created_at
FROM public.users u
    LEFT JOIN public.prestadores p ON u.id = p.usuario_id
WHERE u.email = 'tu_email@example.com';
-- PASO 3: Ver los servicios vinculados a ese prestador
-- (Reemplaza PRESTADOR_ID con el ID del paso anterior)
SELECT ps.id,
    ps.prestador_id,
    ps.servicio_id,
    s.nombre as servicio_nombre,
    s.id as servicio_id_en_servicios,
    ps.precio_base,
    ps.fecha_agregado
FROM public.prestador_servicios ps
    LEFT JOIN public.servicios s ON ps.servicio_id = s.id
WHERE ps.prestador_id = PRESTADOR_ID;
-- PASO 4: Ver el servicio "Albañil" completo
SELECT s.id,
    s.nombre,
    s.categoria_id,
    c.nombre as categoria_nombre,
    COUNT(ps.id) as cantidad_prestadores_con_este_servicio
FROM public.servicios s
    LEFT JOIN public.categorias c ON s.categoria_id = c.id
    LEFT JOIN public.prestador_servicios ps ON s.id = ps.servicio_id
WHERE s.nombre = 'Albañil'
GROUP BY s.id,
    c.id;
-- PASO 5: Ver todos los prestadores con "Albañil"
SELECT p.id as prestador_id,
    p.usuario_id,
    u.nombre,
    u.email,
    s.nombre as servicio,
    ps.fecha_agregado
FROM public.prestador_servicios ps
    JOIN public.prestadores p ON ps.prestador_id = p.id
    JOIN public.users u ON p.usuario_id = u.id
    JOIN public.servicios s ON ps.servicio_id = s.id
WHERE s.nombre = 'Albañil'
ORDER BY ps.fecha_agregado DESC;
-- PASO 6: Si los pasos anteriores no muestran nada, verifica qué hay en cada tabla
SELECT 'Prestadores totales' as info,
    COUNT(*) as cantidad
FROM public.prestadores
UNION ALL
SELECT 'Prestador-Servicios',
    COUNT(*)
FROM public.prestador_servicios
UNION ALL
SELECT 'Servicios totales',
    COUNT(*)
FROM public.servicios
UNION ALL
SELECT 'Usuarios prestadores',
    COUNT(*)
FROM public.users
WHERE tipo_usuario IN ('prestador', 'ambos');
-- PASO 7: Si necesitas crear la relación manualmente
-- Primero obtén los IDs
SELECT u.id as usuario_id,
    u.email,
    p.id as prestador_id,
    s.id as servicio_albañil_id,
    s.nombre
FROM public.users u
    LEFT JOIN public.prestadores p ON u.id = p.usuario_id
    LEFT JOIN public.servicios s ON s.nombre = 'Albañil'
WHERE u.email = 'tu_email@example.com';
-- Luego ejecuta esto (reemplazando los IDs):
-- INSERT INTO public.prestador_servicios (prestador_id, servicio_id)
-- VALUES (PRESTADOR_ID, SERVICIO_ALBAÑIL_ID)
-- ON CONFLICT (prestador_id, servicio_id) DO NOTHING;