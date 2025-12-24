-- ============================================================================
-- Script para confirmar/verificar emails en Supabase Auth
-- Ejecutar este script en el SQL Editor del dashboard de Supabase
-- ============================================================================
-- Función para confirmar email de un usuario
-- Uso: SELECT confirm_user_email('usuario@example.com');
CREATE OR REPLACE FUNCTION public.confirm_user_email(p_email text) RETURNS TABLE(
        success boolean,
        message text,
        user_id uuid,
        email text,
        email_confirmed_at timestamp
    ) AS $$
DECLARE v_user_id uuid;
v_email text;
BEGIN -- Buscar el usuario en auth.users
SELECT id,
    email INTO v_user_id,
    v_email
FROM auth.users
WHERE email = p_email
LIMIT 1;
-- Verificar si el usuario existe
IF v_user_id IS NULL THEN RETURN QUERY
SELECT false,
    'Usuario no encontrado con el email: ' || p_email,
    NULL::uuid,
    NULL::text,
    NULL::timestamp;
RETURN;
END IF;
-- Actualizar el email_confirmed_at si no está ya confirmado
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE id = v_user_id
    AND email_confirmed_at IS NULL;
-- Retornar la información del usuario confirmado
RETURN QUERY
SELECT true,
    'Email confirmado exitosamente',
    v_user_id,
    v_email,
    (
        SELECT email_confirmed_at
        FROM auth.users
        WHERE id = v_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ============================================================================
-- Alternativamente, aquí está el SQL directo para ejecutar sin función
-- ============================================================================
-- Reemplaza 'usuario@example.com' con el email del usuario
-- UPDATE auth.users 
-- SET email_confirmed_at = NOW() 
-- WHERE email = 'usuario@example.com' AND email_confirmed_at IS NULL;
-- ============================================================================
-- Para verificar los usuarios confirmados:
-- ============================================================================
-- SELECT id, email, email_confirmed_at, created_at
-- FROM auth.users
-- ORDER BY created_at DESC
-- LIMIT 10;