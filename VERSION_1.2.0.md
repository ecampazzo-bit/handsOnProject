# Versión 1.2.0 - Carrusel de Categorías y Mejoras de UI

**Fecha**: 2025-01-XX  
**Tipo**: Feature Release (Minor)

## 📋 Resumen

Esta versión introduce un sistema de carrusel de categorías con iconos/imágenes, mejoras significativas en la interfaz de usuario, y herramientas para gestionar imágenes de categorías desde la base de datos.

## 🎨 Cambios Principales

### Carrusel de Categorías

**Pantallas afectadas:**
- `BuscarServicios.tsx`
- `OfrezcoServicios.tsx`

**Funcionalidades:**
- Carrusel horizontal con iconos/imágenes de categorías
- Posicionado debajo del campo de búsqueda
- Filtrado automático de servicios al seleccionar una categoría
- Opción "Todas" para ver todos los servicios sin filtrar
- Muestra imágenes cuando están disponibles en la base de datos
- Fallback a emoji cuando no hay imagen

### Mejoras de UI

**Logos:**
- Logo a color (`logocolor.png`) en pantalla de login
- Logo blanco (`logoblanco.png`) en barra superior de HomeScreen
- Logo en login aumentado 100% de tamaño (de 200x120 a 400x240)

**Interfaz de Búsqueda:**
- Header simplificado: "Estoy buscando / Encuentra el profesional..." → "Buscando..."
- Padding reducido para ocupar menos espacio vertical
- Ocultado nombre de categoría en lista cuando hay una seleccionada

### Base de Datos

**Nuevo campo:**
- `categorias.url` (TEXT, nullable) - URL de imagen representativa

**Scripts creados:**
- `agregar_url_categoria.sql` - Agregar campo URL
- `configurar_bucket_categorias.sql` - Configurar políticas RLS
- `upload-categoria-images.js` - Script para subir imágenes
- `listar_categorias.sql` - Listar todas las categorías

## 📦 Archivos Modificados

### Componentes
- `mobile/src/components/BuscarServicios.tsx`
- `mobile/src/components/OfrezcoServicios.tsx`
- `mobile/src/components/GestionCuenta.tsx`

### Pantallas
- `mobile/src/screens/LoginScreen.tsx`
- `mobile/src/screens/HomeScreen.tsx`

### Base de Datos
- `database_schema.sql`
- `DOCUMENTACION_BASE_DATOS.md`

### Scripts
- `scripts/agregar_url_categoria.sql`
- `scripts/upload-categoria-images.js`
- `scripts/configurar_bucket_categorias.sql`
- `scripts/listar_categorias.sql`

### Documentación
- `CHANGELOG.md`
- `scripts/README_AGREGAR_URL_CATEGORIA.md`
- `scripts/README_UPLOAD_CATEGORIA_IMAGES.md`
- `scripts/GUIA_RAPIDA_UPLOAD_CATEGORIAS.md`

## 🔗 Referencias

- Commit: `d792e07`
- Ver `CHANGELOG.md` para el historial completo de cambios

## 📝 Notas de Implementación

### Para usar el carrusel de categorías:

1. **Agregar campo URL a categorías:**
   ```sql
   -- Ejecutar scripts/agregar_url_categoria.sql
   ```

2. **Subir imágenes de categorías:**
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=tu_key node scripts/upload-categoria-images.js
   ```

3. **Configurar bucket (si no existe):**
   - Crear bucket "servicios" en Supabase Dashboard
   - Marcar como público
   - Ejecutar `scripts/configurar_bucket_categorias.sql`

### Estructura de archivos en Storage:
```
servicios/
  └── categorias/
      ├── construccion-y-albanileria.png
      ├── electricidad.png
      └── ...
```

