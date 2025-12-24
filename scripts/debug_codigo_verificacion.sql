-- ============================================================================
-- DEBUG: Verificar Códigos de Verificación
-- ============================================================================
-- Ejecuta estos queries para diagnosticar problemas con códigos
-- ============================================================================

-- 1. Ver todos los códigos recientes
-- ============================================================================
SELECT 
    id,
    telefono,
    public.normalizar_telefono(telefono) as telefono_normalizado,
    codigo,
    usado,
    intentos,
    creado_en,
    expira_en,
    CASE 
        WHEN usado = true THEN 'Usado'
        WHEN expira_en < NOW() THEN 'Expirado'
        ELSE 'Activo'
    END as estado,
    EXTRACT(EPOCH FROM (expira_en - NOW())) / 60 as minutos_restantes
FROM public.codigos_verificacion
ORDER BY creado_en DESC
LIMIT 10;

-- 2. Buscar códigos activos para un teléfono específico
-- ============================================================================
-- Reemplaza el teléfono con el que estás probando
/*
SELECT 
    id,
    telefono,
    public.normalizar_telefono(telefono) as telefono_normalizado,
    codigo,
    usado,
    intentos,
    creado_en,
    expira_en,
    EXTRACT(EPOCH FROM (expira_en - NOW())) / 60 as minutos_restantes
FROM public.codigos_verificacion
WHERE public.normalizar_telefono(telefono) = public.normalizar_telefono('+5491112345678')
ORDER BY creado_en DESC;
*/

-- 3. Verificar normalización de teléfono
-- ============================================================================
SELECT 
    'Original' as tipo,
    telefono as valor
FROM public.codigos_verificacion
WHERE telefono IS NOT NULL
LIMIT 1
UNION ALL
SELECT 
    'Normalizado',
    public.normalizar_telefono(telefono)
FROM public.codigos_verificacion
WHERE telefono IS NOT NULL
LIMIT 1;

-- 4. Probar función de verificación directamente
-- ============================================================================
-- Reemplaza con tu teléfono y código
/*
SELECT * FROM public.verificar_codigo_whatsapp(
    '+5491112345678',  -- Tu teléfono
    '123456'           -- El código que recibiste
);
*/

-- 5. Ver códigos que están a punto de expirar
-- ============================================================================
SELECT 
    telefono,
    codigo,
    creado_en,
    expira_en,
    EXTRACT(EPOCH FROM (expira_en - NOW())) / 60 as minutos_restantes
FROM public.codigos_verificacion
WHERE usado = false
  AND expira_en > NOW()
  AND expira_en < NOW() + INTERVAL '5 minutes'
ORDER BY expira_en ASC;

-- 6. Limpiar códigos expirados manualmente
-- ============================================================================
/*
DELETE FROM public.codigos_verificacion
WHERE expira_en < NOW() OR usado = true;
*/

-- 7. Ver estadísticas de códigos
-- ============================================================================
SELECT 
    COUNT(*) as total_codigos,
    COUNT(*) FILTER (WHERE usado = true) as usados,
    COUNT(*) FILTER (WHERE usado = false AND expira_en > NOW()) as activos,
    COUNT(*) FILTER (WHERE usado = false AND expira_en < NOW()) as expirados,
    AVG(intentos) as promedio_intentos
FROM public.codigos_verificacion
WHERE creado_en > NOW() - INTERVAL '24 hours';

