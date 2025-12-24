# Versión 1.3.0 - Sistema de Promociones Especiales

## Fecha de Lanzamiento
Enero 2025

## Resumen
Esta versión introduce un sistema completo de promociones especiales tanto en la aplicación móvil como en el dashboard web de administración. Los usuarios pueden ver promociones activas en un carrusel automático, solicitar promociones por WhatsApp, y compartirlas. Los administradores pueden gestionar promociones desde el dashboard web con seguimiento completo de estadísticas.

## Nuevas Funcionalidades

### 📱 App Móvil

#### Pantalla de Promociones Especiales
- **Carrusel Automático**: Las promociones cambian automáticamente cada 7 segundos
- **Navegación Manual**: Swipe horizontal para cambiar entre promociones
- **Botones Flotantes**:
  - **"Quiero mi promo"**: Abre WhatsApp con mensaje personalizado incluyendo código de cupón
  - **"Compartir"**: Comparte la promoción con imagen y mensaje completo
- **Filtrado Inteligente**: Solo muestra promociones relevantes según el tipo de usuario
- **Diseño Optimizado**: Imagen a pantalla completa sin distracciones

#### Integración en Home Screen
- Nuevo botón "🎁 Promociones Especiales" en la barra de navegación
- Posicionado debajo de los otros botones para máxima visibilidad
- Ocupa todo el ancho de la pantalla
- Tab inicial por defecto al abrir la app

### 🌐 Dashboard Web

#### Gestión Completa de Promociones
- **CRUD Completo**: Crear, editar, eliminar promociones
- **Subida de Imágenes**: Imágenes principales y para mobile
- **Configuración Avanzada**:
  - Fechas de inicio y fin
  - Público objetivo (general, clientes, prestadores, categoría específica)
  - Códigos de cupón
  - Información de empresa y contacto
  - Número de WhatsApp para automatización

#### Estadísticas en Tiempo Real
- **Vistas**: Cuántas veces se ha mostrado la promoción
- **Clics**: Interacciones con los botones
- **Usos**: Aplicación real del cupón
- Actualización automática cada 30 segundos
- Botón de refrescar manual

### 🗄️ Base de Datos

#### Tablas y Funciones
- Tabla `promociones` con todos los campos necesarios
- Tabla `promociones_uso` para tracking detallado
- Funciones RPC para incrementar estadísticas:
  - `incrementar_vista_promocion()`
  - `incrementar_click_promocion()`
  - `incrementar_uso_promocion()`

#### Storage
- Bucket `promociones` configurado para imágenes
- Políticas RLS para acceso público de imágenes y admin para gestión

## Mejoras de UI/UX

### Home Screen
- Botones de navegación principales reducidos 25% en altura
- Mejor organización visual
- Botón de promociones destacado y accesible

### Pantalla de Promociones
- Altura de imagen optimizada (76% en general, 73.72% en Android)
- Botones rectangulares flotantes con texto claro
- Diseño limpio sin overlays de texto
- Mejor visibilidad de botones de acción

### Dashboard Web
- Interfaz intuitiva para gestión de promociones
- Filtros y búsqueda eficientes
- Actualización automática de datos
- Feedback visual claro

## Cambios Técnicos

### Nuevos Archivos
- `mobile/src/screens/PromocionesScreen.tsx`: Pantalla principal de promociones
- `mobile/src/services/promocionService.ts`: Servicio para gestión de promociones
- `web/src/app/admin/promociones/page.tsx`: Dashboard de administración
- `web/src/components/admin/PromocionForm.tsx`: Formulario de promociones
- `scripts/crear_tabla_promociones.sql`: Script de creación de tablas
- `scripts/funciones_rpc_promociones_final.sql`: Funciones RPC para estadísticas
- `scripts/configurar_bucket_promociones.sql`: Configuración de Storage

### Archivos Modificados
- `mobile/src/screens/HomeScreen.tsx`: Agregado botón y tab de promociones
- `mobile/src/navigation/AuthNavigator.tsx`: Agregada ruta de promociones
- `mobile/src/types/navigation.ts`: Tipos actualizados
- Varios archivos de servicios y componentes

## Configuración Requerida

### Base de Datos
1. Ejecutar `scripts/crear_tabla_promociones.sql`
2. Ejecutar `scripts/funciones_rpc_promociones_final.sql`
3. Ejecutar `scripts/configurar_bucket_promociones.sql`
4. Crear bucket `promociones` en Supabase Storage (o ejecutar `scripts/crear_bucket_promociones.sql`)

### Variables de Entorno
- Asegurar que las variables de Supabase estén configuradas correctamente
- Para web: `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` para operaciones admin

## Notas de Migración

- Los usuarios existentes verán automáticamente el nuevo botón de promociones
- No se requieren cambios en la estructura de datos existente
- Las funciones RPC deben crearse antes de usar las estadísticas

## Próximas Mejoras
- Filtros adicionales en pantalla de promociones
- Notificaciones push para nuevas promociones
- Promociones personalizadas por ubicación
- Integración con sistema de cupones

## Notas de Desarrollo
- Las estadísticas se actualizan automáticamente en el dashboard cada 30 segundos
- El carrusel se reinicia al volver a la pantalla de promociones
- Las promociones se filtran automáticamente por tipo de usuario y fechas

