# Subir Imágenes de Categorías a Supabase Storage

## 📋 Descripción

Este script permite subir imágenes representativas de categorías desde tu máquina local a Supabase Storage y actualizar automáticamente la tabla `categorias` con las URLs de las imágenes.

## 🚀 Requisitos Previos

1. **Bucket "servicios" creado en Supabase**
   - Ve a: Supabase Dashboard > Storage
   - Crea el bucket "servicios" si no existe
   - Márcalo como **Público** (Settings > Public bucket: ON)

2. **Campo `url` agregado a la tabla `categorias`**
   - Ejecuta el script: `scripts/agregar_url_categoria.sql`

3. **Node.js instalado**
   - El script requiere Node.js y el paquete `@supabase/supabase-js`

## 📦 Instalación

```bash
# Instalar dependencias (si no están instaladas)
npm install @supabase/supabase-js
```

## 🔐 Autenticación

Para subir archivos, necesitas permisos de administrador. Tienes dos opciones:

### Opción 1: Service Role Key (Recomendado para scripts)

```bash
# Configurar variable de entorno (solo para esta sesión)
export SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# O en Windows PowerShell
$env:SUPABASE_SERVICE_ROLE_KEY="tu_service_role_key_aqui"
```

⚠️ **IMPORTANTE**: El `service_role_key` tiene acceso total a tu base de datos. NUNCA lo commitees al repositorio.

### Opción 2: Autenticación con usuario admin

El script intentará usar las credenciales anon key, pero para operaciones de escritura necesitarás permisos administrativos.

## 💻 Uso

### Subir una imagen individual

```bash
node scripts/upload-categoria-images.js <ruta_imagen> <nombre_categoria>
```

**Ejemplo:**
```bash
node scripts/upload-categoria-images.js ./imagenes/construccion.jpg "Construcción y Albañilería"
```

### Subir múltiples imágenes desde un directorio

```bash
node scripts/upload-categoria-images.js --dir <directorio>
```

**Ejemplo:**
```bash
node scripts/upload-categoria-images.js --dir ./imagenes/categorias
```

> **Nota**: En modo directorio, el script usa el nombre del archivo (sin extensión) para buscar la categoría por nombre. Asegúrate de que los nombres de archivo coincidan con los nombres de categoría en la base de datos.

## 📁 Estructura de Archivos

Las imágenes se suben al bucket `servicios` con la siguiente estructura:

```
servicios/
  └── categorias/
      ├── construccion-y-albanileria.jpg
      ├── electricidad.png
      ├── plomeria.webp
      └── ...
```

El nombre del archivo se normaliza automáticamente:
- Se convierte a minúsculas
- Se eliminan acentos
- Se reemplazan espacios y caracteres especiales con guiones

## ✅ Validaciones

El script valida:

- ✅ Existencia del archivo
- ✅ Tamaño máximo: 1MB
- ✅ Tipos permitidos: `.jpg`, `.jpeg`, `.png`, `.webp`, `.svg`
- ✅ Existencia de la categoría en la base de datos
- ✅ Permisos de acceso al bucket

## 📊 Ejemplo Completo

```bash
# 1. Configurar service role key
export SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 2. Subir imagen
node scripts/upload-categoria-images.js \
  ./assets/categorias/construccion.jpg \
  "Construcción y Albañilería"

# Salida esperada:
# 📤 Subiendo imagen para categoría: Construcción y Albañilería
#    📁 Archivo: construccion.jpg
#    📏 Tamaño: 245.32 KB
#    📝 Path en storage: categorias/construccion-y-albanileria.jpg
#    🏷️  Categoría encontrada: ID 1
#    ⬆️  Subiendo a Supabase Storage...
#    ✅ Imagen subida exitosamente
#    🔗 URL pública: https://kqxnjpyupcxbajuzsbtx.supabase.co/storage/v1/object/public/servicios/categorias/construccion-y-albanileria.jpg
#    💾 Actualizando base de datos...
#    ✅ Base de datos actualizada
# ✅✅✅ ¡Proceso completado exitosamente! ✅✅✅
```

## 🔍 Verificar Imágenes Subidas

### Desde SQL

```sql
SELECT id, nombre, url 
FROM public.categorias 
WHERE url IS NOT NULL;
```

### Desde Supabase Dashboard

1. Ve a: Storage > servicios > categorias
2. Verás todas las imágenes subidas

## 🐛 Solución de Problemas

### Error: "Bucket not found"

El bucket "servicios" no existe. Créalo en Supabase Dashboard > Storage.

### Error: "new row violates row-level security"

No tienes permisos. Configura `SUPABASE_SERVICE_ROLE_KEY` como variable de entorno.

### Error: "No se encontró la categoría"

El nombre de la categoría no coincide exactamente. Verifica el nombre en la base de datos:

```sql
SELECT id, nombre FROM public.categorias ORDER BY nombre;
```

### Error: "El archivo es muy grande"

El archivo excede 1MB. Optimiza la imagen antes de subirla.

## 📝 Notas Adicionales

- Las imágenes se suben con `upsert: true`, por lo que si ya existe una imagen con el mismo nombre, se reemplazará
- La URL se actualiza automáticamente en la tabla `categorias`
- Las URLs son públicas y accesibles sin autenticación (bucket público)

## 🔒 Seguridad

- ⚠️ **NUNCA** commitees el `service_role_key` al repositorio
- Usa variables de entorno o archivos `.env` (que estén en `.gitignore`)
- Considera usar un usuario con permisos limitados en lugar del service_role_key para operaciones regulares

