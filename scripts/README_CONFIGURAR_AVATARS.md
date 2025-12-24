# Configurar Políticas RLS para Bucket "avatars"

Este script configura las políticas RLS (Row-Level Security) para el bucket de Storage "avatars" que almacena las fotos de perfil de los usuarios.

## 🚨 Problema Resuelto

Si estás viendo el error:
```
Error al subir imagen: [StorageApiError: new row violates row-level security policy]
```

Este script soluciona ese problema configurando las políticas correctas.

## 📋 Pasos para Ejecutar

### 1. Verificar que el bucket existe

En Supabase Dashboard:
- Ve a **Storage**
- Verifica que existe el bucket llamado `avatars`
- Si no existe, créalo con estas configuraciones:
  - **Name**: `avatars`
  - **Public bucket**: ✅ ON (marcado como público)
  - **File size limit**: 2097152 (2MB)
  - **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`

### 2. Ejecutar el script SQL

1. Ve a **SQL Editor** en Supabase Dashboard
2. Abre el archivo `scripts/configurar_bucket_avatars.sql`
3. Copia y pega el contenido completo
4. Haz clic en **Run** o presiona `Ctrl+Enter` (o `Cmd+Enter` en Mac)

### 3. Verificar las políticas

Ejecuta esta consulta para verificar que las políticas se crearon correctamente:

```sql
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%avatar%';
```

Deberías ver 4 políticas:
- `Public can read avatars` (SELECT)
- `Users can upload own avatar` (INSERT)
- `Users can update own avatar` (UPDATE)
- `Users can delete own avatar` (DELETE)

## ✅ Verificación Final

Para probar que todo funciona:

1. En la app móvil, intenta subir una foto de perfil durante el registro
2. Verifica que no aparezca el error de RLS
3. Verifica que la foto se muestre correctamente en el perfil

## ⚠️ Problema Especial: Subida Durante el Registro

Durante el registro, la sesión puede no estar completamente establecida cuando se intenta subir la foto de perfil. El código ahora maneja esto automáticamente:

1. **Espera activa**: El código espera hasta 5 segundos (10 intentos × 500ms) a que la sesión esté establecida
2. **Reintento automático**: Si falla por RLS, reintenta automáticamente después de esperar la sesión
3. **No bloquea el registro**: Si la subida falla, el registro continúa y el usuario puede subir la foto más tarde desde su perfil

### ¿Qué hacer si sigue fallando?

1. **Verificar que ejecutaste el script SQL**: Asegúrate de haber ejecutado `configurar_bucket_avatars.sql`
2. **Verificar que el bucket es público**: Ve a Storage > avatars > Settings y verifica que "Public bucket" está activado
3. **Verificar la sesión**: Si el problema persiste, revisa los logs para ver si la sesión se está estableciendo correctamente

## 🔍 Troubleshooting

### El bucket no existe

Si el bucket no existe, créalo desde el Dashboard o ejecuta:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);
```

### Las políticas no se crean

Si ves errores al crear las políticas, verifica:

1. Que el bucket existe: `SELECT * FROM storage.buckets WHERE name = 'avatars';`
2. Que tienes permisos de administrador en Supabase
3. Que no hay políticas duplicadas que puedan causar conflictos

### Sigue apareciendo el error de RLS

Si después de ejecutar el script sigue apareciendo el error:

1. Verifica que ejecutaste el script completo
2. Verifica que el usuario está autenticado: `SELECT auth.uid();`
3. Verifica que el formato del archivo es correcto: `{user_id}/avatar.jpg`
4. Intenta eliminar todas las políticas y volver a ejecutar el script:
   ```sql
   DROP POLICY IF EXISTS "Public can read avatars" ON storage.objects;
   DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
   DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
   DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
   ```
   Luego ejecuta el script completo nuevamente.

## 📝 Notas Importantes

- **Bucket público**: El bucket debe estar marcado como público para que las URLs públicas funcionen
- **Formato de archivo**: Los avatares deben seguir el formato `{user_id}/avatar.jpg`
- **Autenticación**: Solo usuarios autenticados pueden subir/actualizar/eliminar sus propios avatares
- **Lectura pública**: Cualquiera puede ver las imágenes de avatar (necesario para mostrar fotos de perfil)

## 🔗 Archivos Relacionados

- `mobile/src/services/profileService.ts` - Servicio que sube las fotos de perfil
- `mobile/src/screens/RegisterScreen.tsx` - Pantalla de registro donde se sube la foto

