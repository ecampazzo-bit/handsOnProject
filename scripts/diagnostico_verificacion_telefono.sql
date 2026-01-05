-- ============================================================================
-- DIAGNÓSTICO: Verificación de Teléfono No Funciona
-- ============================================================================
-- Este script verifica el estado de las funciones y tablas relacionadas
-- ============================================================================

-- 1. Verificar que existe la tabla codigos_verificacion
-- ============================================================================
SELECT 
    'Tabla codigos_verificacion' as check_item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'codigos_verificacion' AND table_schema = 'public')
        THEN '✅ Existe'
        ELSE '❌ NO EXISTE'
    END as estado;

-- 2. Verificar estructura de la tabla
-- ============================================================================
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'codigos_verificacion' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar que existe el campo telefono_verificado en users
-- ============================================================================
SELECT 
    'Campo telefono_verificado en users' as check_item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' 
              AND column_name = 'telefono_verificado'
              AND table_schema = 'public'
        )
        THEN '✅ Existe'
        ELSE '❌ NO EXISTE'
    END as estado;

-- 4. Verificar que existen las funciones RPC
-- ============================================================================
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('enviar_codigo_whatsapp', 'verificar_codigo_whatsapp', 'normalizar_telefono', 'generar_codigo_otp')
ORDER BY routine_name;

-- 5. Verificar códigos recientes en la tabla
-- ============================================================================
SELECT 
    id,
    telefono,
    codigo,
    usado,
    intentos,
    creado_en,
    expira_en,
    usuario_id,
    CASE 
        WHEN usado = true THEN '❌ Usado'
        WHEN expira_en < NOW() THEN '⏰ Expirado'
        ELSE '✅ Activo'
    END as estado
FROM public.codigos_verificacion
ORDER BY creado_en DESC
LIMIT 10;

-- 6. Probar función normalizar_telefono
-- ============================================================================
SELECT 
    'normalizar_telefono' as funcion,
    public.normalizar_telefono('+5491112345678') as resultado_1,
    public.normalizar_telefono('091112345678') as resultado_2,
    public.normalizar_telefono('91112345678') as resultado_3,
    public.normalizar_telefono('5491112345678') as resultado_4;

-- 7. Verificar usuarios con teléfonos
-- ============================================================================
SELECT 
    id,
    email,
    telefono,
    telefono_verificado,
    public.normalizar_telefono(telefono) as telefono_normalizado
FROM public.users
ORDER BY created_at DESC
LIMIT 5;

-- 8. Probar función enviar_codigo_whatsapp (comentado para no generar código)
-- ============================================================================
-- SELECT * FROM public.enviar_codigo_whatsapp('+5491112345678');

-- ============================================================================
-- PROBLEMAS COMUNES Y SOLUCIONES
-- ============================================================================
-- 1. Si la tabla codigos_verificacion no existe: ejecutar add_phone_verification.sql
-- 2. Si falta el campo telefono_verificado: ejecutar add_phone_verification.sql
-- 3. Si las funciones no existen: ejecutar fix_verificacion_codigo.sql
-- 4. Si hay problemas de normalización: ejecutar fix_verificacion_codigo.sql
-- ============================================================================

