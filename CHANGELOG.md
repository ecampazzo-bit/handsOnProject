# Changelog

## [Versión 1.3.0] - 2025-01-05

### ✨ Nuevas Funcionalidades

#### Sistema de Notificaciones Push
- Implementación completa de notificaciones push usando `expo-notifications`
- Integración con Supabase Realtime para recibir notificaciones en tiempo real
- Solicitud automática de permisos de notificaciones al iniciar la app
- Manejo inteligente de Expo Go vs development builds (las push remotas solo funcionan en builds)
- Notificaciones locales funcionan en Expo Go cuando se crean notificaciones en Supabase

#### Campo "Incluye Materiales" en Cotizaciones
- Agregado checkbox "Incluye materiales" en la pantalla de responder solicitud
- El prestador puede marcar si su cotización incluye materiales
- Los clientes ven esta información claramente en sus cotizaciones recibidas
- Información guardada en la base de datos y mostrada en la UI

### 🎨 Mejoras de UI/UX

#### Mis Trabajos en Curso
- Fecha programada ahora usa más ancho y se muestra en una sola fila
- Alineación mejorada: etiqueta a la izquierda, fecha a la derecha
- Botón "Cancelar" ligeramente más ancho para mejor usabilidad
- Reducción de tamaño de fuente en botones para mejor ajuste
- Tabs "En Curso", "Terminados", "Cancelados" con fuente más pequeña para caber en una fila
- Reducción de tamaño de fuente del número de teléfono para que quepa en una línea

#### Mis Presupuestos
- Reorganización de botones: "Ver Trabajo" arriba y más ancho
- Botones "Llamar" y "WhatsApp" en una fila horizontal debajo
- Reducción significativa de tamaños de fuente e iconos en todos los botones
- Mejor organización visual del espacio

#### Solicitudes Pendientes
- Reducción de tamaño de fuente en botones "Desestimar" y "Cotizar"
- Botón "Desestimar" ligeramente más ancho para mejor visibilidad

#### Gestión de Cuenta
- Reducción de tamaño de fuente en botón "Convertirme también en Cliente"

### 🐛 Correcciones de Bugs

#### Notificaciones
- **Eliminada duplicación de notificaciones**: Al aceptar una cotización, ahora solo se envía una notificación al prestador en lugar de dos
- Manejo correcto de errores cuando las notificaciones push no están disponibles (Expo Go)

#### Portfolio
- **Corrección crítica en uploadPortfolioPhotos**: 
  - Reemplazado uso de `Blob` (no disponible en React Native) por `ArrayBuffer`
  - Implementación usando `expo-file-system/legacy` para leer archivos
  - Conversión correcta de base64 a ArrayBuffer
  - Reintentos inteligentes para Android (necesita más tiempo para escribir archivos)
- **Mejora en createPortfolioItem**:
  - Fallback a inserción directa si la función RPC falla
  - Mejor manejo de errores y logging
  - Parseo correcto del resultado jsonb de la función RPC

#### Cotizaciones
- Corrección en mapeo de datos para incluir `materiales_incluidos` en la interfaz
- Visualización correcta de información de materiales en cotizaciones del cliente

### 🔧 Mejoras Técnicas

#### Configuración
- Actualización de `babel.config.js` para incluir plugin de `react-native-reanimated`
- Instalación de `react-native-worklets` y `react-native-worklets-core` para compatibilidad
- Configuración de `expo-notifications` en `app.json` con icono y colores personalizados
- Corrección de versiones de dependencias usando `expo install --fix`

#### Código
- Mejor manejo de errores en servicios
- Logging mejorado para debugging
- Código más robusto con fallbacks cuando las funciones RPC no están disponibles

### 📝 Archivos Modificados

#### Nuevos Archivos
- `mobile/src/services/notificationService.ts`: Servicio completo para manejo de notificaciones

#### Archivos Modificados
- `mobile/App.tsx`: Integración de sistema de notificaciones
- `mobile/app.json`: Configuración de expo-notifications
- `mobile/babel.config.js`: Plugin de react-native-reanimated
- `mobile/package.json`: Nuevas dependencias
- `mobile/src/components/GestionCuenta.tsx`: Ajuste de tamaño de fuente
- `mobile/src/screens/MisPresupuestosScreen.tsx`: Mejoras UI y campo materiales_incluidos
- `mobile/src/screens/MisTrabajosScreen.tsx`: Mejoras UI
- `mobile/src/screens/ResponderSolicitudScreen.tsx`: Campo "incluye materiales"
- `mobile/src/screens/SolicitudesPendientesScreen.tsx`: Ajustes de botones
- `mobile/src/services/portfolioService.ts`: Corrección de upload y create
- `mobile/src/services/solicitudService.ts`: Eliminación de notificaciones duplicadas

### 📦 Dependencias Agregadas
- `expo-notifications`: ^0.32.15
- `react-native-worklets`: 0.5.1
- `react-native-worklets-core`: ^1.6.2

### ⚠️ Notas Importantes

#### Notificaciones Push
- Las notificaciones push remotas **NO funcionan en Expo Go** (SDK 53+)
- Para usar notificaciones push remotas, es necesario crear un development build o build de producción
- Las notificaciones locales funcionan correctamente en Expo Go
- El código detecta automáticamente si está en Expo Go y ajusta el comportamiento

#### Portfolio
- La función `uploadPortfolioPhotos` ahora usa `ArrayBuffer` en lugar de `Blob` para compatibilidad con React Native
- Se implementaron reintentos para Android que puede necesitar más tiempo para escribir archivos

### 🔄 Migración

No se requieren pasos de migración especiales. Los cambios son compatibles con versiones anteriores.

### 📚 Documentación

Para más información sobre:
- **Notificaciones**: Ver `mobile/src/services/notificationService.ts`
- **Portfolio**: Ver `mobile/src/services/portfolioService.ts`
- **Configuración**: Ver `mobile/app.json` y `mobile/babel.config.js`
