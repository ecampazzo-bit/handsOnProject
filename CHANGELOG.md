# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.2.0] - 2025-01-XX

### Agregado
- **Carrusel de Categorías**: Implementado carrusel horizontal de categorías con iconos/imágenes en las pantallas de búsqueda y oferta de servicios.
  - Carrusel debajo del campo de búsqueda en `BuscarServicios` y `OfrezcoServicios`
  - Muestra imágenes de categorías cuando están disponibles en la base de datos
  - Filtrado de servicios por categoría seleccionada
  - Opción "Todas" para ver todos los servicios sin filtrar

- **Campo URL en Categorías**: Agregado campo `url` a la tabla `categorias` en Supabase para almacenar URLs de imágenes representativas de cada categoría.
  - Script SQL para agregar el campo (`agregar_url_categoria.sql`)
  - Scripts para subir imágenes de categorías a Supabase Storage
  - Documentación completa para gestión de imágenes de categorías

### Mejorado
- **Diseño de Logos**:
  - Logo a color (`logocolor.png`) en pantalla de login
  - Logo blanco (`logoblanco.png`) en barra superior de HomeScreen
  - Logo en login aumentado 100% de tamaño para mejor visibilidad

- **Interfaz de Búsqueda de Servicios**:
  - Simplificado header de "BuscarServicios" de "Estoy buscando / Encuentra el profesional que necesitas" a solo "Buscando..."
  - Reducido padding y tamaño de fuente para ocupar menos espacio vertical
  - Ocultado nombre de categoría en lista de servicios cuando hay una categoría seleccionada (mejor UX)

- **Interfaz de Ofrecer Servicios**:
  - Agregado carrusel de categorías en la sección "Agregar Servicios"
  - Filtrado por categoría y búsqueda por nombre
  - Ocultado nombre de categoría cuando hay una categoría seleccionada

### Documentación
- Agregada documentación para subir imágenes de categorías
- Scripts SQL para configuración de bucket de categorías
- Guías rápidas para gestión de imágenes de categorías

## [1.1.1] - 2025-01-XX

### Corregido
- **Gestión de Cuenta**: Corregido problema donde el email largo se cortaba en dos líneas. Ahora se muestra en una sola línea con ellipsis (`...`) cuando es demasiado largo.

## [1.1.0] - 2025-01-XX

### Agregado
- **Verificación de Teléfono por WhatsApp**: Implementado sistema completo de verificación de números de teléfono mediante WhatsApp usando Twilio y Supabase Edge Functions.
  - Pantalla de verificación de teléfono (`PhoneVerificationScreen`)
  - Servicio de verificación (`phoneVerificationService.ts`)
  - Funciones RPC en Supabase para generar y verificar códigos OTP
  - Edge Function para enviar códigos por WhatsApp
  - Normalización de números de teléfono para consistencia
  - Botón "Volver" en la pantalla de verificación
  - Funcionalidad para editar teléfono si aún no está verificado

- **Verificación de Email en Perfil**: Agregada funcionalidad para reenviar email de verificación desde la pantalla de gestión de cuenta si el email no está confirmado.

### Mejorado
- **Gestión de Cuenta**: 
  - Mejorado el manejo de teléfonos no verificados con opción de editar
  - Mejorada la visualización del estado de verificación de email y teléfono
  - Mejor UX para la gestión de datos personales

- **Subida de Imágenes**:
  - Mejorado el manejo de imágenes locales usando `expo-file-system/legacy`
  - Validación de tamaño de archivo antes de subir
  - Mejor manejo de errores y logging
  - Conversión automática a JPG para optimización

### Corregido
- **RPC desde App**: Corregido problema de permisos y `search_path` en funciones RPC para que funcionen correctamente desde la aplicación móvil.
- **Imágenes Corruptas**: Corregido problema donde algunas imágenes se subían como 0 bytes. Agregada validación y scripts de limpieza.

### Documentación
- Agregada documentación completa para configuración de verificación WhatsApp
- Guías para creación de Edge Functions en Supabase
- Scripts de diagnóstico y debugging para WhatsApp
- Documentación de funciones RPC

## [1.0.0] - 2024-XX-XX

### Agregado
- Versión inicial del proyecto
- Sistema de autenticación (login/registro)
- Gestión de usuarios (clientes y prestadores)
- Sistema de solicitudes y cotizaciones
- Sistema de mensajería
- Sistema de calificaciones
- Gestión de trabajos
- Portfolio de prestadores
- Sistema de notificaciones

---

## Tipos de Cambios

- **Agregado**: Nueva funcionalidad
- **Cambiado**: Cambios en funcionalidad existente
- **Deprecado**: Funcionalidad que será removida en futuras versiones
- **Removido**: Funcionalidad removida
- **Corregido**: Corrección de bugs
- **Seguridad**: Corrección de vulnerabilidades

