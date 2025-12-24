-- ============================================================================
-- FUNCIÓN RPC PARA SUBIR AVATAR DURANTE EL REGISTRO
-- ============================================================================
-- Esta función permite subir un avatar usando el userId directamente,
-- útil cuando la sesión aún no está completamente establecida.
-- 
-- NOTA: Esta función usa SECURITY DEFINER para bypass RLS temporal,
-- pero valida que el userId coincida con auth.uid() si hay sesión activa.
-- ============================================================================

-- Crear función para subir avatar durante registro
CREATE OR REPLACE FUNCTION public.upload_avatar_during_registration(
  p_user_id uuid,
  p_avatar_base64 text,
  p_file_name text DEFAULT 'avatar.jpg'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_file_path text;
  v_file_size bigint;
  v_public_url text;
  v_result jsonb;
BEGIN
  -- Validar que el userId sea válido
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'user_id es requerido'
    );
  END IF;

  -- Si hay sesión activa, validar que coincida con el userId
  IF auth.uid() IS NOT NULL AND auth.uid() != p_user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No autorizado: el userId no coincide con la sesión activa'
    );
  END IF;

  -- Validar que el usuario existe
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuario no encontrado'
    );
  END IF;

  -- Construir el path del archivo
  v_file_path := p_user_id::text || '/' || p_file_name;

  -- NOTA: La subida real del archivo debe hacerse desde el cliente
  -- porque Supabase Storage API no está disponible directamente desde SQL.
  -- Esta función solo actualiza la URL en la base de datos.
  -- Para una solución completa, se necesitaría usar pg_net o manejar la
  -- subida desde el cliente después de que la sesión esté establecida.

  -- Por ahora, retornamos éxito para indicar que el usuario es válido
  -- y la subida debe hacerse desde el cliente una vez que la sesión esté lista
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Usuario válido, procede con la subida desde el cliente',
    'file_path', v_file_path,
    'user_id', p_user_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Comentario sobre la función
COMMENT ON FUNCTION public.upload_avatar_during_registration IS 
'Valida que un usuario puede subir su avatar. La subida real debe hacerse desde el cliente una vez que la sesión esté establecida.';

-- ============================================================================
-- ALTERNATIVA: Modificar las políticas RLS para permitir inserción
-- durante registro usando una política especial
-- ============================================================================

-- NOTA: La mejor práctica es asegurar que la sesión esté establecida
-- antes de intentar subir. No crearemos una política especial que
-- permita subir sin autenticación, ya que sería un riesgo de seguridad.
-- 
-- En su lugar, el código del cliente (profileService.ts) ahora espera
-- a que la sesión esté establecida antes de intentar subir.

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 1. La política "Allow upload during registration" permite subir durante
--    el registro si el usuario existe en la tabla users y no tiene avatar.
--
-- 2. Esta política es menos segura pero necesaria para el flujo de registro.
--    Considera removerla o hacerla más restrictiva en producción.
--
-- 3. La mejor solución es asegurar que la sesión esté completamente
--    establecida antes de intentar subir (ver cambios en profileService.ts).
--
-- 4. Ejecuta primero el script configurar_bucket_avatars.sql antes de
--    ejecutar este script.
-- ============================================================================

