# Sistema de Promociones - Documentación

Este documento explica cómo configurar y usar el sistema de promociones, ofertas y cupones de descuento.

## 📋 Descripción

El sistema de promociones permite a los administradores crear y gestionar:
- Promociones y ofertas
- Cupones de descuento
- Publicidad de empresas
- Campañas dirigidas a diferentes públicos objetivos

## 🚀 Configuración Inicial

### 1. Ejecutar Scripts SQL

#### Paso 1: Crear la tabla de promociones
```sql
-- Ejecutar en Supabase SQL Editor
scripts/crear_tabla_promociones.sql
```

Este script crea:
- Tabla `promociones` con todos los campos necesarios
- Tabla `promociones_uso` para tracking
- ENUMs necesarios (`tipo_publico_promocion`, `estado_promocion`)
- Políticas RLS
- Funciones auxiliares
- Vista `promociones_activas`

#### Paso 2: Crear bucket de Storage
```sql
-- Ejecutar en Supabase SQL Editor
scripts/crear_bucket_promociones.sql
```

Este script crea el bucket si no existe. Si prefieres crearlo manualmente:

**Opción Manual**: Desde Supabase Dashboard:

1. Ve a **Supabase Dashboard > Storage**
2. Click en **"New bucket"**
3. Configuración:
   - **Name**: `promociones`
   - **Public bucket**: ✅ ON (marcado como público)
   - **File size limit**: 5242880 (5MB)
   - **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`

### 2. Verificar Configuración

Ejecuta estas consultas para verificar:

```sql
-- Verificar tabla
SELECT * FROM information_schema.tables 
WHERE table_name = 'promociones';

-- Verificar bucket
SELECT * FROM storage.buckets WHERE name = 'promociones';

-- Verificar políticas RLS
SELECT * FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'promociones';
```

## 📊 Estructura de Datos

### Tabla `promociones`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid | ID único |
| `titulo` | text | Título de la promoción |
| `descripcion` | text | Descripción detallada |
| `codigo_cupon` | text | Código único de cupón (opcional) |
| `imagen_url` | text | URL de imagen principal |
| `imagen_mobile_url` | text | URL de imagen mobile (opcional) |
| `fecha_inicio` | timestamptz | Fecha/hora de inicio |
| `fecha_fin` | timestamptz | Fecha/hora de fin |
| `publico_objetivo` | enum | general, clientes, prestadores, categoria_prestadores |
| `categoria_id` | integer | FK a categorias (si aplica) |
| `servicio_id` | integer | FK a servicios (opcional) |
| `estado` | enum | borrador, activa, pausada, finalizada, cancelada |
| `activa` | boolean | Si está activa |
| `orden_display` | integer | Orden de visualización |
| `empresa_nombre` | text | Nombre de la empresa |
| `empresa_contacto` | text | Contacto (email/teléfono) |
| `whatsapp` | text | Número de WhatsApp para envío automático (formato: +5491123456789) |
| `veces_mostrada` | integer | Contador de visualizaciones |
| `veces_clic` | integer | Contador de clics |
| `veces_usada` | integer | Contador de usos del cupón |
| `metadata` | jsonb | Información adicional (descuento %, condiciones, etc.) |

### Tabla `promociones_uso`

Tracking de uso de promociones:
- `promocion_id` - FK a promociones
- `usuario_id` - FK a users (opcional)
- `fecha_uso` - Fecha/hora de uso
- `ip_address` - IP del usuario
- `user_agent` - User agent
- `codigo_usado` - Código de cupón usado

## 🎯 Públicos Objetivo

### General
- Visible para todos los usuarios

### Clientes
- Solo visible para usuarios tipo "cliente" o "ambos"

### Prestadores
- Solo visible para usuarios tipo "prestador" o "ambos"

### Categoría Específica de Prestadores
- Solo visible para prestadores que ofrecen servicios de una categoría específica
- Requiere seleccionar una `categoria_id`
- Opcionalmente puede restringirse a un `servicio_id` específico

## 🖼️ Gestión de Imágenes

### Subida de Imágenes

1. **Imagen Principal** (requerida):
   - Formato: JPEG, PNG, WebP
   - Tamaño máximo: 5MB
   - Se guarda en: `promociones/{promocion_id}/imagen_principal.{ext}`

2. **Imagen Mobile** (opcional):
   - Imagen optimizada para dispositivos móviles
   - Mismo formato y tamaño máximo
   - Se guarda en: `promociones/{promocion_id}/imagen_mobile.{ext}`

### Políticas de Storage

- **Lectura**: Pública (cualquiera puede ver las imágenes)
- **Escritura**: Solo administradores pueden subir
- **Eliminación**: Solo administradores pueden eliminar

## 💻 Uso del Dashboard

### Acceder a la Gestión de Promociones

1. Inicia sesión en el dashboard admin: `/admin`
2. Click en **"Gestión de Promociones"** en el header
3. O navega directamente a: `/admin/promociones`

### Crear Nueva Promoción

1. Click en **"+ Nueva Promoción"**
2. Completa el formulario:
   - **Título** (requerido)
   - **Descripción** (opcional)
   - **Código de Cupón** (opcional, debe ser único)
   - **Imagen Principal** (requerida)
   - **Imagen Mobile** (opcional)
   - **Fechas** de inicio y fin
   - **Público Objetivo**
   - **Categoría/Servicio** (si aplica)
   - **Estado** (borrador/activa/pausada)
   - **Orden de Visualización**
   - **Información de Empresa**

3. Click en **"Crear"**

### Editar Promoción

1. En la lista de promociones, click en **"Editar"**
2. Modifica los campos necesarios
3. Click en **"Actualizar"**

### Gestionar Estado

- **Activar/Pausar**: Click en el botón "Activar" o "Pausar"
- **Eliminar**: Click en "Eliminar" (acción irreversible)

### Filtros

- **Buscar**: Por título o código de cupón
- **Filtrar por Estado**: Activas, Borradores, Pausadas, Finalizadas

## 📱 WhatsApp Automático

### Configurar WhatsApp en una Promoción

1. En el formulario de creación/edición de promoción
2. Completa el campo **"WhatsApp"** con el número en formato internacional
3. Ejemplo: `+5491123456789`

### Enviar Promoción por WhatsApp

Cuando un usuario solicita una promoción, se puede enviar automáticamente un mensaje de WhatsApp con el formato:
```
Quiero mi promoción: [Nombre de la Promoción]
Código: [Código del cupón si existe]
```

**Función SQL:**
```sql
SELECT * FROM enviar_promocion_whatsapp('promocion_id_uuid');
```

**Desde la app móvil o web:**
```typescript
const { data, error } = await supabase.rpc('enviar_promocion_whatsapp', {
  p_promocion_id: promocionId
})
```

### Configuración Requerida

1. **Edge Function de WhatsApp**: 
   - Crear la función `send-whatsapp-promocion` en Supabase
   - Ver `scripts/edge-functions/send-whatsapp-promocion/`

2. **Configurar credenciales en función SQL**:
   - Editar `scripts/enviar_promocion_whatsapp.sql`
   - Reemplazar `TU_SERVICE_ROLE_KEY_AQUI` con tu service_role_key
   - Ajustar la URL de Supabase si es necesario

3. **Ejecutar script SQL**:
   ```sql
   scripts/enviar_promocion_whatsapp.sql
   ```

## 📱 Integración en la App Móvil

### Obtener Promociones Activas

```typescript
// Obtener promociones según tipo de usuario
const { data: promociones } = await supabase
  .rpc('get_promociones_por_publico', {
    p_tipo_usuario: 'cliente', // o 'prestador', 'ambos'
    p_categoria_id: 1 // opcional, para categoría específica
  })

// O usar la vista directa
const { data: promociones } = await supabase
  .from('promociones_activas')
  .select('*')
  .order('orden_display')
```

### Registrar Uso de Promoción

```typescript
const { error } = await supabase
  .from('promociones_uso')
  .insert({
    promocion_id: promocionId,
    usuario_id: userId,
    codigo_usado: codigoCupon // si aplica
  })
```

### Incrementar Contadores

```typescript
// Incrementar veces_mostrada (al mostrar la promoción)
await supabase.rpc('incrementar_contador_promocion', {
  p_promocion_id: promocionId,
  p_tipo: 'mostrada' // 'mostrada', 'clic', 'usada'
})
```

## 🔍 Funciones Útiles

### `get_promociones_por_publico()`

Obtiene promociones activas según el tipo de usuario y categoría.

```sql
SELECT * FROM get_promociones_por_publico(
  'cliente'::tipo_usuario,  -- tipo de usuario
  1  -- categoria_id (opcional, puede ser NULL)
);
```

### Vista `promociones_activas`

Vista optimizada con promociones que cumplen:
- `estado = 'activa'`
- `activa = true`
- `fecha_inicio <= now()`
- `fecha_fin >= now()`

Incluye nombres de categorías y servicios relacionados.

## 📈 Estadísticas y Tracking

### Ver Estadísticas de una Promoción

```sql
SELECT 
  id,
  titulo,
  veces_mostrada,
  veces_clic,
  veces_usada,
  fecha_inicio,
  fecha_fin
FROM promociones
WHERE id = 'promocion_id';
```

### Ver Detalles de Uso

```sql
SELECT 
  pu.*,
  u.email,
  u.nombre,
  u.apellido
FROM promociones_uso pu
LEFT JOIN users u ON pu.usuario_id = u.id
WHERE pu.promocion_id = 'promocion_id'
ORDER BY pu.fecha_uso DESC;
```

## ⚠️ Notas Importantes

1. **Códigos de Cupón Únicos**: Cada código debe ser único. Si se intenta crear uno duplicado, fallará.

2. **Fechas**: La fecha fin debe ser mayor que la fecha inicio (validado por constraint).

3. **RLS**: Solo los administradores pueden crear/editar/eliminar promociones. Los usuarios solo pueden ver promociones activas.

4. **Estado vs Activa**: 
   - `estado` controla el estado lógico (borrador/activa/pausada)
   - `activa` es un flag adicional para control rápido
   - Ambos deben coincidir para que una promoción sea visible

5. **Metadata JSON**: Puedes almacenar información adicional como:
   ```json
   {
     "descuento_porcentaje": 20,
     "descuento_monto": null,
     "link_externo": "https://...",
     "condiciones": "Válido hasta fin de mes"
   }
   ```

## 🐛 Troubleshooting

### Las promociones no aparecen

1. Verifica que `estado = 'activa'` y `activa = true`
2. Verifica que las fechas estén dentro del rango actual
3. Verifica las políticas RLS

### No se pueden subir imágenes

1. Verifica que el bucket "promociones" existe y es público
2. Verifica que las políticas de Storage están configuradas
3. Verifica que eres administrador

### Error al crear promoción

1. Verifica que todos los campos requeridos estén completos
2. Verifica que el código de cupón no esté duplicado
3. Verifica que las fechas sean válidas

## 📚 Archivos Relacionados

- `scripts/crear_tabla_promociones.sql` - Script de creación de tablas
- `scripts/configurar_bucket_promociones.sql` - Configuración de Storage
- `web/src/app/admin/promociones/page.tsx` - Página de gestión
- `web/src/components/admin/PromocionForm.tsx` - Formulario de creación/edición

