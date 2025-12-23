# 🚀 Guía Rápida: Subir Imágenes de Categorías

## Paso 1: Configurar el Bucket (Solo una vez)

### Desde Supabase Dashboard:

1. Ve a: **Storage** > **Buckets**
2. Si no existe el bucket "servicios", haz clic en **"New bucket"**
3. Configura:
   - **Name**: `servicios`
   - **Public bucket**: ✅ **ON** (muy importante)
4. Haz clic en **"Create bucket"**

### Configurar Políticas RLS:

Ejecuta el script SQL en Supabase SQL Editor:
```sql
-- Copia y pega el contenido de: scripts/configurar_bucket_categorias.sql
```

## Paso 2: Agregar Campo URL a la Tabla (Solo una vez)

Ejecuta el script SQL:
```sql
-- Copia y pega el contenido de: scripts/agregar_url_categoria.sql
```

## Paso 3: Instalar Dependencias (Solo una vez)

```bash
cd /Users/ecampazzo/Documents/Dev/handsOnProject
npm install @supabase/supabase-js
```

## Paso 4: Configurar Service Role Key

Para poder subir archivos, necesitas el `service_role_key`:

```bash
# En terminal (macOS/Linux)
export SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# En Windows PowerShell
$env:SUPABASE_SERVICE_ROLE_KEY="tu_service_role_key_aqui"
```

⚠️ **Dónde encontrar el service_role_key:**
- Supabase Dashboard > Settings > API
- Busca "service_role" key (secreta)

## Paso 5: Subir Imágenes

### Subir una imagen individual:

```bash
node scripts/upload-categoria-images.js \
  ./ruta/a/imagen.jpg \
  "Construcción y Albañilería"
```

### Ejemplo práctico:

Si tienes una imagen en `./imagenes/categorias/construccion.jpg`:

```bash
node scripts/upload-categoria-images.js \
  ./imagenes/categorias/construccion.jpg \
  "Construcción y Albañilería"
```

### Subir múltiples imágenes:

```bash
node scripts/upload-categoria-images.js --dir ./imagenes/categorias
```

## ✅ Verificar Resultados

### Desde SQL:

```sql
SELECT id, nombre, url 
FROM public.categorias 
WHERE url IS NOT NULL
ORDER BY nombre;
```

### Desde Dashboard:

1. Ve a: **Storage** > **servicios** > **categorias**
2. Verás todas las imágenes subidas

## 🎯 Nombres de Categorías Correctos

Asegúrate de usar el nombre exacto de la categoría. Para ver todas las categorías:

```sql
SELECT id, nombre FROM public.categorias ORDER BY nombre;
```

Ejemplos de nombres comunes:
- "Construcción y Albañilería"
- "Electricidad"
- "Plomería"
- "Pintura"
- etc.

## 🐛 Problemas Comunes

### "Bucket not found"
→ El bucket "servicios" no existe. Créalo en el Dashboard.

### "new row violates row-level security"
→ No tienes permisos. Configura `SUPABASE_SERVICE_ROLE_KEY`.

### "No se encontró la categoría"
→ El nombre no coincide. Verifica el nombre exacto en la base de datos.

### "El archivo es muy grande"
→ El archivo excede 1MB. Optimiza la imagen antes de subirla.

## 📝 Estructura Final

Después de subir, las imágenes estarán en:
```
Supabase Storage:
  └── servicios/
      └── categorias/
          ├── construccion-y-albanileria.jpg
          ├── electricidad.png
          └── ...

Base de datos:
  categorias:
    - id: 1
    - nombre: "Construcción y Albañilería"
    - url: "https://...supabase.co/storage/v1/object/public/servicios/categorias/construccion-y-albanileria.jpg"
```

¡Listo! 🎉

