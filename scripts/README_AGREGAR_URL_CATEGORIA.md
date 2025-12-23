# Agregar Campo URL a Tabla Categorias

## 📋 Descripción

Este script agrega un campo `url` a la tabla `categorias` en Supabase para almacenar la URL de la imagen representativa de cada categoría.

## 🚀 Uso

### Paso 1: Ejecutar el Script

1. Ve a tu proyecto en Supabase
2. Navega a: **SQL Editor**
3. Copia y pega el contenido de `agregar_url_categoria.sql`
4. Ejecuta el script

### Paso 2: Verificar

Ejecuta este query para verificar que la columna fue agregada:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'categorias'
ORDER BY ordinal_position;
```

Deberías ver la columna `url` con tipo `text` y `is_nullable = YES`.

## 📝 Estructura del Campo

- **Nombre**: `url`
- **Tipo**: `TEXT`
- **Nullable**: `YES` (opcional)
- **Descripción**: URL de la imagen representativa de la categoría

## 💡 Ejemplos de Uso

### Actualizar una categoría con su imagen

```sql
UPDATE public.categorias 
SET url = 'https://ejemplo.com/imagenes/categoria-construccion.jpg'
WHERE id = 1;
```

### Obtener categorías con sus imágenes

```sql
SELECT id, nombre, url, created_at
FROM public.categorias
ORDER BY nombre;
```

### Filtrar categorías que tienen imagen

```sql
SELECT id, nombre, url
FROM public.categorias
WHERE url IS NOT NULL
ORDER BY nombre;
```

## 📦 Almacenamiento de Imágenes

Puedes almacenar las imágenes de categorías de dos formas:

### Opción 1: URLs Externas
Almacenar URLs de imágenes hospedadas externamente:
```sql
UPDATE public.categorias 
SET url = 'https://cdn.ejemplo.com/categorias/construccion.png'
WHERE id = 1;
```

### Opción 2: Supabase Storage
Almacenar imágenes en Supabase Storage y usar URLs públicas:
```sql
UPDATE public.categorias 
SET url = 'https://tu-proyecto.supabase.co/storage/v1/object/public/categorias/construccion.png'
WHERE id = 1;
```

## ⚠️ Notas

- El campo `url` es opcional (nullable), por lo que las categorías existentes no se verán afectadas
- Asegúrate de que las URLs sean accesibles públicamente si planeas mostrarlas en la aplicación
- Considera usar Supabase Storage para un mejor control y rendimiento

## 🔄 Reversión

Si necesitas eliminar el campo (no recomendado si ya hay datos):

```sql
ALTER TABLE public.categorias
DROP COLUMN IF EXISTS url;
```

