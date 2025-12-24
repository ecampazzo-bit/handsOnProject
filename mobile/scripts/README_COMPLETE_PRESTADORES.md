# Completar Tablas de Prestadores - Documentación

Este documento describe las funcionalidades completadas para las tablas relacionadas con prestadores y cómo usarlas.

## 📋 Tablas Completadas

### 1. Calificaciones (`calificaciones`)
- ✅ Políticas RLS configuradas
- ✅ Función RPC: `create_calificacion`
- ✅ Función helper: `update_user_rating` (actualiza calificación promedio)
- ✅ Índices optimizados

### 2. Portfolio (`portfolio`)
- ✅ Políticas RLS configuradas
- ✅ Función RPC: `upsert_portfolio_item`
- ✅ Índices optimizados

### 3. Conversaciones y Mensajes (`conversaciones`, `mensajes`)
- ✅ Políticas RLS configuradas
- ✅ Función RPC: `get_or_create_conversacion`
- ✅ Función RPC: `send_message`
- ✅ Índices optimizados

### 4. Certificaciones (`certificaciones`)
- ✅ Políticas RLS configuradas
- ✅ Índices optimizados

### 5. Foto de Perfil
- ✅ Función RPC: `update_user_profile_picture`
- ✅ Integración con Supabase Storage (bucket `avatars`)

## 🚀 Cómo Aplicar

### Paso 1: Ejecutar Script de Completar Tablas

En Supabase SQL Editor, ejecuta:

```sql
-- Ejecutar el script completo
\i mobile/scripts/complete_prestadores_tables.sql
```

O copia y pega el contenido del archivo `complete_prestadores_tables.sql` en el SQL Editor de Supabase.

### Paso 2: Configurar Storage Buckets

1. Ve a **Supabase Dashboard > Storage**
2. Crea los siguientes buckets si no existen:

#### Bucket: `avatars` (Público)
- **Público**: Sí
- **Tamaño máximo de archivo**: 2MB
- **Tipos permitidos**: `image/jpeg`, `image/png`, `image/webp`

#### Bucket: `portfolios` (Público)
- **Público**: Sí
- **Tamaño máximo de archivo**: 5MB
- **Tipos permitidos**: `image/jpeg`, `image/png`, `image/webp`

#### Bucket: `certificados` (Privado)
- **Público**: No
- **Tamaño máximo de archivo**: 10MB
- **Tipos permitidos**: `image/jpeg`, `image/png`, `application/pdf`

### Paso 3: Configurar Políticas de Storage

Para cada bucket, configura las políticas RLS:

#### Políticas para `avatars`:

**SELECT (Leer) - Público:**
```sql
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
```

**INSERT/UPDATE (Subir) - Usuario propio:**
```sql
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**DELETE (Eliminar) - Usuario propio:**
```sql
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Políticas para `portfolios`:

**SELECT (Leer) - Público:**
```sql
CREATE POLICY "Portfolio images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'portfolios');
```

**INSERT/UPDATE/DELETE - Usuario propio:**
```sql
CREATE POLICY "Users can manage own portfolio images"
ON storage.objects FOR ALL
USING (
  bucket_id = 'portfolios'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'portfolios'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Políticas para `certificados`:

**SELECT/INSERT/UPDATE/DELETE - Usuario propio:**
```sql
CREATE POLICY "Users can manage own certificates"
ON storage.objects FOR ALL
USING (
  bucket_id = 'certificados'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'certificados'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

## 📖 Uso de las Funciones RPC

### 1. Actualizar Foto de Perfil

```typescript
// Primero subir la imagen a Storage
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
  const { data: result, error: updateError } = await supabase.rpc(
    'update_user_profile_picture',
    {
      p_user_id: userId,
      p_foto_perfil_url: publicUrl
    }
  );

  if (updateError) throw updateError;
  return result;
};
```

### 2. Crear/Actualizar Item del Portfolio

```typescript
const savePortfolioItem = async (
  portfolioId: number | null,
  prestadorId: number,
  servicioId: number,
  titulo: string,
  descripcion: string,
  fotosUrls: string[],
  fechaTrabajo?: string,
  destacado: boolean = false
) => {
  // Primero subir las fotos a Storage
  const uploadedUrls = await uploadPortfolioPhotos(userId, files);

  // Luego crear/actualizar el item
  const { data, error } = await supabase.rpc('upsert_portfolio_item', {
    p_portfolio_id: portfolioId,
    p_prestador_id: prestadorId,
    p_servicio_id: servicioId,
    p_titulo: titulo,
    p_descripcion: descripcion,
    p_fotos_urls: uploadedUrls,
    p_fecha_trabajo: fechaTrabajo || null,
    p_destacado: destacado
  });

  if (error) throw error;
  return data;
};
```

### 3. Crear Calificación

```typescript
const createCalificacion = async (
  trabajoId: number,
  calificadoId: string,
  tipoCalificacion: 'cliente_a_prestador' | 'prestador_a_cliente',
  puntuacion: number,
  comentario?: string,
  detalles?: {
    puntualidad?: number;
    calidadTrabajo?: number;
    limpieza?: number;
    comunicacion?: number;
    relacionPrecioCalidad?: number;
  }
) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase.rpc('create_calificacion', {
    p_trabajo_id: trabajoId,
    p_calificador_id: user!.id,
    p_calificado_id: calificadoId,
    p_tipo_calificacion: tipoCalificacion,
    p_puntuacion: puntuacion,
    p_comentario: comentario || null,
    p_puntualidad: detalles?.puntualidad || null,
    p_calidad_trabajo: detalles?.calidadTrabajo || null,
    p_limpieza: detalles?.limpieza || null,
    p_comunicacion: detalles?.comunicacion || null,
    p_relacion_precio_calidad: detalles?.relacionPrecioCalidad || null
  });

  if (error) throw error;
  return data;
};
```

### 4. Obtener o Crear Conversación

```typescript
const getOrCreateConversation = async (
  participante1Id: string,
  participante2Id: string,
  solicitudId?: number
) => {
  const { data, error } = await supabase.rpc('get_or_create_conversacion', {
    p_participante_1_id: participante1Id,
    p_participante_2_id: participante2Id,
    p_solicitud_id: solicitudId || null
  });

  if (error) throw error;
  return data;
};
```

### 5. Enviar Mensaje

```typescript
const sendMessage = async (
  conversacionId: number,
  contenido: string,
  tipo: 'texto' | 'imagen' | 'archivo' | 'cotizacion' | 'sistema' = 'texto'
) => {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase.rpc('send_message', {
    p_conversacion_id: conversacionId,
    p_remitente_id: user!.id,
    p_contenido: contenido,
    p_tipo: tipo
  });

  if (error) throw error;
  return data;
};
```

## 📊 Consultas Útiles

### Obtener Portfolio de un Prestador

```typescript
const getPortfolio = async (prestadorId: number) => {
  const { data, error } = await supabase
    .from('portfolio')
    .select(`
      *,
      servicio:servicios(*)
    `)
    .eq('prestador_id', prestadorId)
    .order('destacado', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};
```

### Obtener Calificaciones de un Usuario

```typescript
const getCalificaciones = async (userId: string) => {
  const { data, error } = await supabase
    .from('calificaciones')
    .select(`
      *,
      calificador:users!calificaciones_calificador_id_fkey(id, nombre, apellido, foto_perfil_url),
      trabajo:trabajos(id, estado)
    `)
    .eq('calificado_id', userId)
    .order('fecha_calificacion', { ascending: false });

  if (error) throw error;
  return data;
};
```

### Obtener Conversaciones del Usuario

```typescript
const getConversations = async (userId: string) => {
  const { data, error } = await supabase
    .from('conversaciones')
    .select(`
      *,
      participante_1:users!conversaciones_participante_1_id_fkey(id, nombre, apellido, foto_perfil_url),
      participante_2:users!conversaciones_participante_2_id_fkey(id, nombre, apellido, foto_perfil_url),
      ultimo_mensaje:mensajes(*)
    `)
    .or(`participante_1_id.eq.${userId},participante_2_id.eq.${userId}`)
    .order('ultimo_mensaje_fecha', { ascending: false, nullsLast: true });

  if (error) throw error;
  return data;
};
```

### Obtener Mensajes de una Conversación

```typescript
const getMessages = async (conversacionId: number, limit: number = 50) => {
  const { data, error } = await supabase
    .from('mensajes')
    .select(`
      *,
      remitente:users!mensajes_remitente_id_fkey(id, nombre, apellido, foto_perfil_url)
    `)
    .eq('conversacion_id', conversacionId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data.reverse(); // Invertir para mostrar del más antiguo al más nuevo
};
```

## 🔒 Seguridad

Todas las funciones RPC usan `SECURITY DEFINER` y verifican:
- ✅ Que el usuario esté autenticado (`auth.uid()`)
- ✅ Que solo pueda modificar sus propios datos
- ✅ Validaciones de datos de entrada
- ✅ Políticas RLS en las tablas

## 📝 Notas Importantes

1. **Fotos de Perfil**: Se almacenan en el bucket público `avatars` con estructura `{user_id}/avatar.{ext}`
2. **Portfolio**: Las fotos se almacenan en `portfolios` con estructura `{user_id}/{timestamp}_{filename}.{ext}`
3. **Certificados**: Se almacenan en el bucket privado `certificados` y requieren URLs firmadas para acceso
4. **Calificaciones**: Solo se pueden crear para trabajos completados
5. **Mensajes**: Se actualiza automáticamente el último mensaje de la conversación

## 🐛 Troubleshooting

### Error: "Unauthorized"
- Verifica que el usuario esté autenticado
- Verifica que el `user_id` coincida con `auth.uid()`

### Error: "Bucket not found"
- Asegúrate de haber creado los buckets en Supabase Storage
- Verifica los nombres de los buckets (deben ser exactos)

### Error: "Policy violation"
- Verifica que las políticas RLS estén configuradas correctamente
- Asegúrate de que el usuario tenga permisos para la operación

### Fotos no se muestran
- Verifica que el bucket sea público (para avatars y portfolios)
- Para certificados, usa URLs firmadas con `createSignedUrl()`

