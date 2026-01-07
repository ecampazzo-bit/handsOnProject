# 🚀 Guía Completa: Publicación en Tiendas y Preparación para Producción

Este documento resume todos los pasos necesarios para publicar la aplicación **ofiSi** en Apple App Store y Google Play Store, así como preparar los servicios backend (Twilio, Supabase) y el código para producción.

---

## 📋 Índice

1. [Preparación del Código](#1-preparación-del-código)
2. [Limpieza de Console.log](#2-limpieza-de-consolelog)
3. [Limpieza de Base de Datos de Prueba](#3-limpieza-de-base-de-datos-de-prueba)
4. [Migración de Twilio a Producción](#4-migración-de-twilio-a-producción)
5. [Preparación de Supabase para Producción](#5-preparación-de-supabase-para-producción)
6. [Publicación en Google Play Store](#6-publicación-en-google-play-store)
7. [Publicación en Apple App Store](#7-publicación-en-apple-app-store)
8. [Checklist Final](#8-checklist-final)

---

## 1. Preparación del Código

### 1.1. Actualizar Versión de la App

**Archivo: `mobile/app.json`**

```json
{
  "expo": {
    "version": "1.3.0",  // Actualizar según corresponda
    "ios": {
      "buildNumber": "1"  // Incrementar para cada build
    },
    "android": {
      "versionCode": 3  // Incrementar para cada build
    }
  }
}
```

**Archivo: `mobile/package.json`**

```json
{
  "version": "1.3.0"  // Debe coincidir con app.json
}
```

### 1.2. Verificar Configuración de Producción

- [ ] Variables de entorno configuradas correctamente
- [ ] URLs de API apuntan a producción
- [ ] No hay referencias a ambientes de desarrollo
- [ ] Iconos y splash screens actualizados
- [ ] Permisos configurados correctamente

---

## 2. Limpieza de Console.log

### 2.1. Identificar Console.log en el Código

La aplicación tiene **563 instancias** de `console.log`, `console.warn`, `console.error`, `console.debug` distribuidas en 28 archivos.

### 2.2. Estrategia de Limpieza

**Opción A: Eliminar todos los console.log (Recomendado para producción)**

```bash
cd mobile/src

# Buscar todos los console.log
grep -r "console\." --include="*.ts" --include="*.tsx" .

# Eliminar manualmente o usar herramienta de búsqueda y reemplazo
```

**Opción B: Reemplazar con un sistema de logging condicional**

Crear un archivo `mobile/src/utils/logger.ts`:

```typescript
const isDevelopment = __DEV__;

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    // Los errores siempre se muestran
    console.error(...args);
  },
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  }
};
```

Luego reemplazar todos los `console.log` por `logger.log`, etc.

### 2.3. Archivos Principales a Limpiar

Los archivos con más console.log son:

1. `mobile/src/services/notificationService.ts` (19)
2. `mobile/src/screens/RegisterScreen.tsx` (49)
3. `mobile/src/services/profileService.ts` (30)
4. `mobile/src/screens/MisCotizacionesScreen.tsx` (1)
5. `mobile/src/screens/MisPresupuestosScreen.tsx` (6)
6. `mobile/src/screens/MisTrabajosScreen.tsx` (9)
7. `mobile/src/utils/phoneUtils.ts` (10)
8. `mobile/src/utils/whatsappUtils.ts` (12)
9. `mobile/src/services/solicitudService.ts` (95)
10. `mobile/src/services/authService.ts` (103)

### 2.4. Script de Limpieza Automática (Opcional)

Crear `mobile/scripts/remove-console-logs.js`:

```javascript
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const files = glob.sync('src/**/*.{ts,tsx}', { cwd: __dirname + '/..' });

files.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Eliminar console.log, console.warn, console.debug (mantener console.error)
  content = content.replace(/console\.(log|warn|debug)\([^)]*\);?\n?/g, '');
  
  fs.writeFileSync(filePath, content);
  console.log(`Limpiado: ${file}`);
});
```

**⚠️ IMPORTANTE**: Hacer backup antes de ejecutar scripts automáticos.

### 2.5. Checklist de Limpieza

- [ ] Revisar y eliminar `console.log` innecesarios
- [ ] Mantener `console.error` para errores críticos (opcional)
- [ ] Probar la app después de la limpieza
- [ ] Verificar que no haya errores en runtime

---

## 3. Limpieza de Base de Datos de Prueba

### 3.1. Backup de la Base de Datos

**ANTES DE CUALQUIER LIMPIEZA, HACER BACKUP:**

1. Ve a Supabase Dashboard → Database → Backups
2. Crea un backup manual o verifica que los backups automáticos estén activos

### 3.2. Script de Limpieza

**Archivo: `limpiar_datos_prueba.sql`** (ya existe en la raíz del proyecto)

Este script elimina:
- Todos los trabajos
- Todas las cotizaciones
- Todas las solicitudes de servicio
- Notificaciones relacionadas

### 3.3. Ejecutar Limpieza

**Opción A: Desde Supabase Dashboard**

1. Ve a: Supabase Dashboard → SQL Editor
2. Abre el archivo `limpiar_datos_prueba.sql`
3. Copia y pega el contenido
4. Ejecuta el script
5. Verifica los resultados

**Opción B: Desde CLI de Supabase**

```bash
# Si tienes Supabase CLI instalado
supabase db execute --file limpiar_datos_prueba.sql
```

### 3.4. Limpieza de Storage (Imágenes)

**IMPORTANTE**: El script SQL no elimina las imágenes del Storage. Debes hacerlo manualmente:

1. Ve a: Supabase Dashboard → Storage
2. Revisa los buckets:
   - `solicitudes` - Fotos de solicitudes
   - `avatars` - Fotos de perfil
   - `categorias` - Imágenes de categorías
   - `promociones` - Imágenes de promociones
3. Elimina archivos de prueba manualmente o usa el script:

**Script para limpiar Storage (crear si es necesario):**

```javascript
// scripts/limpiar_storage.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function limpiarStorage() {
  // Listar todos los archivos en el bucket
  const { data, error } = await supabase.storage
    .from('solicitudes')
    .list();
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  // Eliminar archivos (ajustar según necesidad)
  for (const file of data) {
    await supabase.storage
      .from('solicitudes')
      .remove([file.name]);
  }
}

limpiarStorage();
```

### 3.5. Limpieza de Usuarios de Prueba

**⚠️ CUIDADO**: Solo eliminar usuarios de prueba, NO usuarios reales.

```sql
-- Eliminar usuarios de prueba (ajustar criterios según necesidad)
DELETE FROM auth.users 
WHERE email LIKE '%test%' 
   OR email LIKE '%prueba%'
   OR email LIKE '%@example.com'
   OR created_at < '2024-01-01';  -- Ajustar fecha según necesidad

-- Eliminar perfiles asociados
DELETE FROM public.users 
WHERE id NOT IN (SELECT id FROM auth.users);
```

### 3.6. Verificación Post-Limpieza

```sql
-- Verificar conteos
SELECT 
  (SELECT COUNT(*) FROM public.trabajos) as trabajos,
  (SELECT COUNT(*) FROM public.cotizaciones) as cotizaciones,
  (SELECT COUNT(*) FROM public.solicitudes_servicio) as solicitudes,
  (SELECT COUNT(*) FROM public.notificaciones) as notificaciones,
  (SELECT COUNT(*) FROM auth.users) as usuarios;
```

### 3.7. Checklist de Limpieza de BD

- [ ] Backup de base de datos creado
- [ ] Script de limpieza ejecutado
- [ ] Storage limpiado (imágenes de prueba)
- [ ] Usuarios de prueba eliminados (si aplica)
- [ ] Verificación de conteos realizada
- [ ] App probada con base de datos limpia

---

## 4. Migración de Twilio a Producción

### 4.1. Resumen Rápido

Para migrar Twilio WhatsApp de Sandbox a Producción:

1. **Verificar negocio en Facebook Business Manager** (1-2 días)
2. **Obtener número de WhatsApp verificado** (1-5 días)
3. **Actualizar variable de entorno en Supabase**
4. **Probar en producción**

### 4.2. Pasos Detallados

#### Paso 1: Verificar Negocio en Facebook Business Manager

1. Ve a: https://business.facebook.com/
2. Crea o accede a tu cuenta de Business Manager
3. Completa la verificación de tu negocio
4. Obtén tu **Business Manager ID**
5. Tiempo estimado: 1-2 días

#### Paso 2: Solicitar Número de WhatsApp en Twilio

1. Ve a: https://console.twilio.com/
2. Navega a: **Messaging** → **Try it out** → **Send a WhatsApp message**
   - O directamente: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
3. Busca **"Request Production Access"** o **"Get Started"**
4. Completa el formulario:
   - Business Name: ofiSi
   - Use Case: Verificación de códigos de 6 dígitos para registro de usuarios
   - Expected Volume: [Tu volumen mensual estimado]
   - Country: Argentina
   - Facebook Business Manager ID: [Tu ID]
5. Envía la solicitud
6. Espera aprobación: 1-5 días hábiles

#### Paso 3: Actualizar Configuración en Supabase

1. Ve a: Supabase Dashboard → Edge Functions → `send-whatsapp-code` → Settings/Secrets
2. Actualiza la variable:
   - `TWILIO_WHATSAPP_NUMBER` = `whatsapp:+549XXXXXXXXX` (tu número de producción)
3. Mantén las otras variables:
   - `TWILIO_ACCOUNT_SID` (sin cambios)
   - `TWILIO_AUTH_TOKEN` (sin cambios)

#### Paso 4: Probar en Producción

1. Ve a: Supabase Dashboard → Edge Functions → `send-whatsapp-code`
2. Haz clic en **"Invoke function"**
3. Ingresa:
   ```json
   {
     "telefono": "+549XXXXXXXXX",
     "codigo": "123456"
   }
   ```
4. Verifica que el mensaje llegue
5. Revisa logs en: https://console.twilio.com/us1/monitor/logs/messaging

### 4.3. Costos de Producción

- **Mensajes entrantes**: $0.005 USD por mensaje
- **Mensajes salientes**: $0.005 USD por mensaje
- **Ejemplo**: 1,000 mensajes/mes = $5 USD/mes

### 4.4. Checklist de Twilio

- [ ] Negocio verificado en Facebook Business Manager
- [ ] Número de WhatsApp solicitado en Twilio
- [ ] Caso de uso aprobado
- [ ] Variable `TWILIO_WHATSAPP_NUMBER` actualizada en Supabase
- [ ] Prueba manual exitosa
- [ ] Monitoreo configurado en Twilio

**📄 Documentación completa**: Ver `scripts/MIGRAR_TWILIO_PRODUCCION.md`

---

## 5. Preparación de Supabase para Producción

### 5.1. Verificar Configuración de Seguridad

- [ ] **Row Level Security (RLS)** habilitado en todas las tablas
- [ ] Políticas de seguridad revisadas y probadas
- [ ] Variables de entorno de producción configuradas
- [ ] Edge Functions actualizadas y probadas

### 5.2. Verificar Límites y Plan

- [ ] Plan de Supabase adecuado para producción
- [ ] Límites de API revisados
- [ ] Límites de Storage revisados
- [ ] Alertas configuradas para límites

### 5.3. Configurar Monitoreo

1. Ve a: Supabase Dashboard → Settings → Monitoring
2. Configura alertas para:
   - Uso de API
   - Uso de Storage
   - Errores de Edge Functions
   - Límites de base de datos

### 5.4. Verificar Backups

- [ ] Backups automáticos habilitados
- [ ] Frecuencia de backups configurada
- [ ] Proceso de restauración documentado

### 5.5. Checklist de Supabase

- [ ] RLS habilitado y probado
- [ ] Variables de entorno de producción configuradas
- [ ] Edge Functions probadas
- [ ] Monitoreo configurado
- [ ] Backups verificados
- [ ] Plan adecuado para producción

---

## 6. Publicación en Google Play Store

### 6.1. Requisitos Previos

- [ ] Cuenta de desarrollador de Google Play ($25 USD, pago único)
- [ ] App completamente probada
- [ ] Iconos y assets listos
- [ ] Política de privacidad publicada (URL)
- [ ] Términos y condiciones (opcional pero recomendado)

### 6.2. Preparar Assets

**Iconos y Screenshots:**

- [ ] Icono de la app (512x512 px, PNG)
- [ ] Feature Graphic (1024x500 px)
- [ ] Screenshots (mínimo 2, máximo 8):
  - Teléfono: 16:9 o 9:16
  - Tablet: 16:9 o 9:16
- [ ] Video promocional (opcional, YouTube)

**Textos:**

- [ ] Título de la app (máx. 50 caracteres)
- [ ] Descripción corta (máx. 80 caracteres)
- [ ] Descripción completa (máx. 4,000 caracteres)
- [ ] Qué hay de nuevo (para actualizaciones)

### 6.3. Generar Build de Producción

#### Opción A: EAS Build (Recomendado)

```bash
cd mobile

# 1. Iniciar sesión en Expo
eas login

# 2. Configurar el proyecto (si no está configurado)
eas build:configure

# 3. Generar build de producción para Android
eas build --platform android --profile production
```

**Tiempo estimado**: 15-30 minutos

#### Opción B: Build Local

```bash
cd mobile/android
./gradlew bundleRelease  # Para AAB (recomendado)
# o
./gradlew assembleRelease  # Para APK
```

El archivo estará en:
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- APK: `android/app/build/outputs/apk/release/app-release.apk`

### 6.4. Configurar Firma de la App (Keystore)

**Si es la primera vez:**

```bash
cd mobile/android/app
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

**Configurar en `android/gradle.properties`:**

```properties
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=*****
MYAPP_RELEASE_KEY_PASSWORD=*****
```

**⚠️ IMPORTANTE**: Guardar el keystore en un lugar seguro. Si lo pierdes, no podrás actualizar la app.

### 6.5. Crear App en Google Play Console

1. Ve a: https://play.google.com/console/
2. Haz clic en **"Crear aplicación"**
3. Completa:
   - Nombre de la app: **ofiSi**
   - Idioma predeterminado: Español (Argentina)
   - Tipo de app: App
   - Gratis o de pago: Gratis
4. Acepta la Declaración de distribución

### 6.6. Configurar Store Listing

1. **Información de la app:**
   - Título: ofiSi
   - Descripción corta: Conecta con prestadores de servicios cerca de ti
   - Descripción completa: [Descripción detallada]
   - Icono: Subir icono 512x512
   - Feature Graphic: Subir 1024x500

2. **Categorización:**
   - Categoría: Servicios
   - Etiquetas: [Relevantes]

3. **Contacto:**
   - Email de contacto
   - URL del sitio web
   - Política de privacidad (URL obligatoria)

4. **Contenido de la app:**
   - Screenshots
   - Video (opcional)

### 6.7. Configurar Clasificación de Contenido

1. Completa el cuestionario de clasificación de contenido
2. Responde preguntas sobre:
   - Contenido de la app
   - Permisos solicitados
   - Datos recopilados

### 6.8. Configurar Precios y Distribución

1. **Países/regiones**: Seleccionar donde estará disponible
2. **Precio**: Gratis
3. **Dispositivos**: Teléfonos y tablets

### 6.9. Configurar Política de Privacidad

**Obligatorio**: Debes tener una URL pública con tu política de privacidad.

1. Publica tu política en: `web/src/app/politica-privacidad` o similar
2. O usa un servicio como: https://www.privacypolicygenerator.info/
3. Agrega la URL en Google Play Console

### 6.10. Subir Build

1. Ve a: **Producción** → **Crear nueva versión**
2. Sube el archivo `.aab` (recomendado) o `.apk`
3. Completa las notas de la versión
4. Guarda

### 6.11. Revisar y Publicar

1. Revisa todos los requisitos:
   - [ ] Store listing completo
   - [ ] Clasificación de contenido completa
   - [ ] Política de privacidad configurada
   - [ ] Build subido
   - [ ] Contenido de la app verificado

2. Haz clic en **"Enviar para revisión"**

3. Tiempo de revisión: 1-7 días (generalmente 1-3 días)

### 6.12. Checklist de Google Play

- [ ] Cuenta de desarrollador creada ($25 USD)
- [ ] Build de producción generado
- [ ] Keystore configurado y guardado
- [ ] App creada en Google Play Console
- [ ] Store listing completo
- [ ] Screenshots y assets subidos
- [ ] Política de privacidad publicada
- [ ] Clasificación de contenido completa
- [ ] Build subido
- [ ] App enviada para revisión

**📄 Documentación adicional**: Ver `mobile/BUILD_APK.md`

---

## 7. Publicación en Apple App Store

### 7.1. Requisitos Previos

- [ ] Cuenta de desarrollador de Apple ($99 USD/año)
- [ ] macOS con Xcode instalado
- [ ] App completamente probada
- [ ] Iconos y assets listos
- [ ] Política de privacidad publicada (URL)

### 7.2. Preparar Assets

**Iconos:**

- [ ] App Icon (1024x1024 px, PNG, sin transparencia)
- [ ] Screenshots requeridos:
  - iPhone 6.7" (1290x2796 px) - Mínimo 1
  - iPhone 6.5" (1284x2778 px) - Opcional
  - iPhone 5.5" (1242x2208 px) - Opcional
  - iPad Pro 12.9" (2048x2732 px) - Si soporta iPad

**Textos:**

- [ ] Nombre de la app (máx. 30 caracteres)
- [ ] Subtítulo (máx. 30 caracteres)
- [ ] Descripción (máx. 4,000 caracteres)
- [ ] Palabras clave (máx. 100 caracteres, separadas por comas)
- [ ] Qué hay de nuevo (para actualizaciones)

### 7.3. Configurar Certificados y Perfiles

1. **Abrir Xcode:**
   ```bash
   cd mobile/ios
   open ofiSi.xcworkspace
   ```

2. **Configurar Signing & Capabilities:**
   - Selecciona el proyecto en el navegador
   - Ve a **Signing & Capabilities**
   - Selecciona tu **Team** (cuenta de desarrollador)
   - Xcode generará automáticamente los certificados

3. **Verificar Bundle Identifier:**
   - Debe ser: `com.handson.app` (según `app.json`)
   - Debe coincidir con el configurado en App Store Connect

### 7.4. Generar Build de Producción

#### Opción A: EAS Build (Recomendado)

```bash
cd mobile

# 1. Iniciar sesión en Expo
eas login

# 2. Generar build de producción para iOS
eas build --platform ios --profile production
```

**Tiempo estimado**: 20-40 minutos

#### Opción B: Build Local con Xcode

1. Abre el proyecto en Xcode:
   ```bash
   cd mobile/ios
   open ofiSi.xcworkspace
   ```

2. Selecciona **"Any iOS Device"** como destino

3. Ve a: **Product** → **Archive**

4. Una vez completado, se abrirá **Organizer**

5. Selecciona el archive y haz clic en **"Distribute App"**

6. Selecciona **"App Store Connect"**

7. Sigue el asistente para subir el build

### 7.5. Crear App en App Store Connect

1. Ve a: https://appstoreconnect.apple.com/
2. Haz clic en **"Mis Apps"** → **"+"** → **"Nueva App"**
3. Completa:
   - Plataforma: iOS
   - Nombre: ofiSi
   - Idioma principal: Español
   - Bundle ID: `com.handson.app`
   - SKU: [Identificador único, ej: ofisi-001]
4. Haz clic en **"Crear"**

### 7.6. Configurar Información de la App

1. **Información de la app:**
   - Nombre: ofiSi
   - Subtítulo: [Opcional, máx. 30 caracteres]
   - Categoría primaria: Utilidades o Servicios
   - Categoría secundaria: [Opcional]

2. **Precio y disponibilidad:**
   - Precio: Gratis
   - Países/regiones: Seleccionar donde estará disponible

3. **Información de versión:**
   - Versión: 1.3.0 (debe coincidir con `app.json`)
   - Copyright: [Tu nombre/empresa]
   - Contacto de soporte: [Email]
   - URL de marketing: [Opcional]
   - Política de privacidad: [URL obligatoria]

### 7.7. Configurar Store Listing

1. **Descripción:**
   - Descripción corta (máx. 170 caracteres)
   - Descripción completa (máx. 4,000 caracteres)
   - Palabras clave (máx. 100 caracteres)

2. **Imágenes:**
   - App Icon: 1024x1024 px
   - Screenshots: Subir para cada tamaño requerido

3. **Información de soporte:**
   - URL de soporte: [URL de tu sitio web]
   - URL de marketing: [Opcional]

### 7.8. Configurar Clasificación de Contenido

1. Completa el cuestionario de clasificación
2. Responde sobre:
   - Contenido de la app
   - Permisos solicitados
   - Datos recopilados

### 7.9. Subir Build

**Si usaste EAS Build:**

1. El build se sube automáticamente a App Store Connect
2. Ve a App Store Connect → **TestFlight** para verificar

**Si usaste Xcode:**

1. El build ya debería estar en App Store Connect
2. Ve a: **TestFlight** → **iOS Builds** para verificar

### 7.10. Configurar TestFlight (Opcional pero Recomendado)

1. Ve a: **TestFlight** en App Store Connect
2. Agrega testers internos o externos
3. Prueba la app antes de publicar

### 7.11. Enviar para Revisión

1. Ve a: **App Store** → **Versión de la app**
2. Completa todos los requisitos:
   - [ ] Información de la app completa
   - [ ] Store listing completo
   - [ ] Screenshots subidos
   - [ ] Política de privacidad configurada
   - [ ] Build subido y procesado
   - [ ] Clasificación de contenido completa

3. Haz clic en **"Enviar para revisión"**

4. Tiempo de revisión: 1-7 días (generalmente 1-3 días)

### 7.12. Checklist de Apple App Store

- [ ] Cuenta de desarrollador creada ($99 USD/año)
- [ ] Certificados y perfiles configurados
- [ ] Build de producción generado
- [ ] App creada en App Store Connect
- [ ] Bundle ID configurado correctamente
- [ ] Store listing completo
- [ ] Screenshots y assets subidos
- [ ] Política de privacidad publicada
- [ ] Clasificación de contenido completa
- [ ] Build subido y procesado
- [ ] App enviada para revisión

---

## 8. Checklist Final

### Antes de Publicar

- [ ] **Código:**
  - [ ] Versión actualizada en `app.json` y `package.json`
  - [ ] Console.log eliminados o deshabilitados
  - [ ] Variables de entorno de producción configuradas
  - [ ] App probada completamente

- [ ] **Base de Datos:**
  - [ ] Backup creado
  - [ ] Datos de prueba eliminados
  - [ ] Storage limpiado
  - [ ] Usuarios de prueba eliminados (si aplica)

- [ ] **Twilio:**
  - [ ] Migrado a producción
  - [ ] Número de WhatsApp verificado
  - [ ] Variables de entorno actualizadas
  - [ ] Probado en producción

- [ ] **Supabase:**
  - [ ] RLS habilitado y probado
  - [ ] Edge Functions probadas
  - [ ] Monitoreo configurado
  - [ ] Backups verificados

- [ ] **Assets:**
  - [ ] Iconos listos (iOS y Android)
  - [ ] Screenshots preparados
  - [ ] Descripciones escritas
  - [ ] Política de privacidad publicada

### Durante la Publicación

- [ ] **Google Play:**
  - [ ] Build generado y subido
  - [ ] Store listing completo
  - [ ] App enviada para revisión

- [ ] **Apple App Store:**
  - [ ] Build generado y subido
  - [ ] Store listing completo
  - [ ] App enviada para revisión

### Después de Publicar

- [ ] Monitorear reviews y ratings
- [ ] Responder a comentarios de usuarios
- [ ] Monitorear errores y crashes
- [ ] Verificar métricas de uso
- [ ] Planificar actualizaciones

---

## 📚 Recursos Adicionales

### Documentación del Proyecto

- **Migración Twilio**: `scripts/MIGRAR_TWILIO_PRODUCCION.md`
- **Resumen Migración**: `scripts/RESUMEN_MIGRACION_PRODUCCION.md`
- **Build Android**: `mobile/BUILD_APK.md`

### Enlaces Útiles

- **Google Play Console**: https://play.google.com/console/
- **App Store Connect**: https://appstoreconnect.apple.com/
- **Twilio Console**: https://console.twilio.com/
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Expo EAS**: https://expo.dev/

### Soporte

- **Google Play**: https://support.google.com/googleplay/android-developer
- **Apple Developer**: https://developer.apple.com/support/
- **Expo**: https://docs.expo.dev/

---

## ⚠️ Notas Importantes

1. **Tiempos de Revisión:**
   - Google Play: 1-7 días (generalmente 1-3)
   - Apple App Store: 1-7 días (generalmente 1-3)

2. **Costos:**
   - Google Play: $25 USD (pago único)
   - Apple App Store: $99 USD/año
   - Twilio: $0.005 USD por mensaje WhatsApp
   - Supabase: Depende del plan

3. **Backups:**
   - Siempre hacer backup antes de limpiar datos
   - Guardar keystore de Android en lugar seguro
   - Documentar todas las configuraciones

4. **Monitoreo:**
   - Configurar alertas en todos los servicios
   - Monitorear métricas de uso
   - Revisar logs regularmente

---

¡Éxito con la publicación! 🚀

