-- ============================================================================
-- FUNCIONES PARA GESTIÓN DE STORAGE (FOTOS)
-- Funciones helper para obtener URLs y gestionar archivos en Supabase Storage
-- ============================================================================

-- ============================================================================
-- NOTA: Las operaciones de subida/eliminación de archivos se hacen desde el cliente
-- Estas funciones son solo para documentación y referencia de cómo usar Storage
-- ============================================================================

-- ============================================================================
-- BUCKETS CONFIGURADOS EN SUPABASE STORAGE
-- ============================================================================

/*
1. avatars (Público)
   - Propósito: Fotos de perfil de usuarios
   - Estructura: {user_id}/avatar.{ext}
   - Tamaño máximo: 2MB
   - Tipos: image/jpeg, image/png, image/webp

2. portfolios (Público)
   - Propósito: Fotos de trabajos realizados por prestadores
   - Estructura: {user_id}/{timestamp}_{filename}.{ext}
   - Tamaño máximo: 5MB
   - Tipos: image/jpeg, image/png, image/webp

3. certificados (Privado)
   - Propósito: Certificados, matrículas y documentación
   - Estructura: {user_id}/certificados/{filename}.{ext}
   - Tamaño máximo: 10MB
   - Tipos: image/jpeg, image/png, application/pdf

4. servicios (Público)
   - Propósito: Imágenes de categorías de servicios
   - Estructura: categorias/{categoria_nombre}.{ext}
   - Tamaño máximo: 1MB
   - Tipos: image/jpeg, image/png, image/webp, image/svg+xml
*/

-- ============================================================================
-- FUNCIÓN PARA GENERAR URL PÚBLICA DE AVATAR
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_avatar_url(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_avatar_url text;
BEGIN
  -- Obtener la URL del avatar del usuario
  SELECT foto_perfil_url INTO v_avatar_url
  FROM public.users
  WHERE id = p_user_id;

  -- Si no tiene URL, retornar null (el cliente puede usar una imagen por defecto)
  RETURN v_avatar_url;
END;
$$;

COMMENT ON FUNCTION public.get_avatar_url IS 
'Retorna la URL de la foto de perfil de un usuario. Usa esta función para obtener la URL del avatar.';

-- ============================================================================
-- FUNCIÓN PARA VALIDAR Y LIMPIAR URLS DE FOTOS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.validate_photo_urls(p_urls text[])
RETURNS text[]
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_valid_urls text[];
  v_url text;
BEGIN
  -- Filtrar URLs vacías o null
  SELECT array_agg(DISTINCT url)
  INTO v_valid_urls
  FROM unnest(p_urls) AS url
  WHERE url IS NOT NULL 
    AND url != ''
    AND (url LIKE 'http://%' OR url LIKE 'https://%');

  RETURN COALESCE(v_valid_urls, ARRAY[]::text[]);
END;
$$;

COMMENT ON FUNCTION public.validate_photo_urls IS 
'Valida y limpia un array de URLs de fotos, eliminando valores vacíos o inválidos.';

-- ============================================================================
-- EJEMPLOS DE USO DESDE EL CLIENTE (TypeScript/JavaScript)
-- ============================================================================

/*
// 1. SUBIR FOTO DE PERFIL (Avatar)
const uploadAvatar = async (userId: string, file: File) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/avatar.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) throw error;

  // Obtener URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  // Actualizar en la base de datos
  const { error: updateError } = await supabase.rpc('update_user_profile_picture', {
    p_user_id: userId,
    p_foto_perfil_url: publicUrl
  });

  if (updateError) throw updateError;
  return publicUrl;
};

// 2. SUBIR FOTOS AL PORTFOLIO
const uploadPortfolioPhotos = async (userId: string, files: File[]) => {
  const timestamp = Date.now();
  const uploadedUrls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${timestamp}_${i}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('portfolios')
      .upload(fileName, file, {
        cacheControl: '3600'
      });

    if (error) {
      console.error('Error uploading file:', error);
      continue;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('portfolios')
      .getPublicUrl(fileName);

    uploadedUrls.push(publicUrl);
  }

  return uploadedUrls;
};

// 3. SUBIR CERTIFICADO (Privado)
const uploadCertificado = async (userId: string, file: File, tipo: string) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/certificados/${tipo}_${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('certificados')
    .upload(fileName, file, {
      cacheControl: '3600'
    });

  if (error) throw error;

  // Para buckets privados, necesitas crear una URL firmada
  const { data: { signedUrl }, error: urlError } = await supabase.storage
    .from('certificados')
    .createSignedUrl(fileName, 3600); // URL válida por 1 hora

  if (urlError) throw urlError;
  return signedUrl;
};

// 4. ELIMINAR FOTO
const deletePhoto = async (bucket: string, path: string) => {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) throw error;
};

// 5. OBTENER TODAS LAS FOTOS DE UN PORTFOLIO
const getPortfolioPhotos = async (userId: string) => {
  const { data, error } = await supabase.storage
    .from('portfolios')
    .list(userId, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' }
    });

  if (error) throw error;

  // Convertir a URLs públicas
  return data.map(file => {
    const { data: { publicUrl } } = supabase.storage
      .from('portfolios')
      .getPublicUrl(`${userId}/${file.name}`);
    return publicUrl;
  });
};
*/

-- ============================================================================
-- POLÍTICAS DE STORAGE (Configurar en Supabase Dashboard > Storage > Policies)
-- ============================================================================

/*
POLÍTICAS PARA BUCKET 'avatars':

1. SELECT (Leer) - Público:
   - Cualquiera puede leer avatares

2. INSERT/UPDATE (Subir) - Autenticado propio:
   - Solo el usuario autenticado puede subir/actualizar su propio avatar
   - Policy: (bucket_id = 'avatars') AND ((storage.foldername(name))[1] = auth.uid()::text)

3. DELETE (Eliminar) - Autenticado propio:
   - Solo el usuario autenticado puede eliminar su propio avatar
   - Policy: (bucket_id = 'avatars') AND ((storage.foldername(name))[1] = auth.uid()::text)

POLÍTICAS PARA BUCKET 'portfolios':

1. SELECT (Leer) - Público:
   - Cualquiera puede leer portfolios

2. INSERT/UPDATE (Subir) - Autenticado propio:
   - Solo el usuario autenticado puede subir a su propia carpeta
   - Policy: (bucket_id = 'portfolios') AND ((storage.foldername(name))[1] = auth.uid()::text)

3. DELETE (Eliminar) - Autenticado propio:
   - Solo el usuario autenticado puede eliminar de su propia carpeta
   - Policy: (bucket_id = 'portfolios') AND ((storage.foldername(name))[1] = auth.uid()::text)

POLÍTICAS PARA BUCKET 'certificados':

1. SELECT (Leer) - Autenticado propio:
   - Solo el usuario puede ver sus propios certificados
   - Policy: (bucket_id = 'certificados') AND ((storage.foldername(name))[1] = auth.uid()::text)

2. INSERT/UPDATE (Subir) - Autenticado propio:
   - Solo el usuario puede subir certificados a su carpeta
   - Policy: (bucket_id = 'certificados') AND ((storage.foldername(name))[1] = auth.uid()::text)

3. DELETE (Eliminar) - Autenticado propio:
   - Solo el usuario puede eliminar sus certificados
   - Policy: (bucket_id = 'certificados') AND ((storage.foldername(name))[1] = auth.uid()::text)
*/

