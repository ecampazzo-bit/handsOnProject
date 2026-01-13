# 🔧 Configuración del App ID en Apple Developer

## 📋 Información de la App

- **Bundle Identifier**: `com.ofisi.mobile`
- **Nombre**: ofiSí

## ✅ Capacidades que DEBES Marcar en el App ID

Basándote en las funcionalidades que usa tu app, debes marcar las siguientes capacidades en Apple Developer Portal:

### 1. ✅ Push Notifications (OBLIGATORIO)

**¿Por qué?** Tu app usa `expo-notifications` para enviar notificaciones push.

**Cómo configurar:**
1. En Apple Developer Portal → **Certificates, Identifiers & Profiles**
2. Ve a **Identifiers** → Busca `com.ofisi.mobile`
3. En la sección **Capabilities**, marca:
   - ✅ **Push Notifications**

**Importante:** Después de marcar Push Notifications, necesitarás:
- Generar un certificado APNs (Apple Push Notification service)
- EAS puede generarlo automáticamente, o puedes hacerlo manualmente

### 2. ⚠️ Associated Domains (OPCIONAL - Solo si usas deep linking con dominios)

**¿Por qué?** Tu app tiene un custom URL scheme (`ofisi://`), pero esto NO requiere Associated Domains.

**Marca solo si:**
- Usas Universal Links (links que abren tu app desde el navegador)
- Usas App Links con dominios verificados

**Cómo configurar:**
1. En **Capabilities**, marca:
   - ✅ **Associated Domains**
2. Si lo marcas, agrega los dominios en formato: `applinks:tudominio.com`

**Para tu app actual:** ❌ **NO es necesario** marcarlo, ya que solo usas URL schemes.

### 3. ❌ Sign in with Apple (NO marcar)

**¿Por qué?** Tu app tiene `"usesAppleSignIn": false`, así que NO lo necesitas.

**No marques esta opción** a menos que planees agregarlo en el futuro.

---

## 📱 Permisos (NO son capacidades del App ID)

Estos NO se marcan en el App ID, sino que se declaran en `Info.plist` (ya están configurados en tu `app.json`):

- ✅ **Camera** - Ya configurado con `NSCameraUsageDescription`
- ✅ **Photo Library** - Ya configurado con `NSPhotoLibraryUsageDescription`
- ✅ **Location** - Ya configurado con `NSLocationWhenInUseUsageDescription`

Estos permisos se manejan automáticamente por Expo cuando generas el build.

---

## 🎯 Pasos para Configurar el App ID

### Paso 1: Acceder al App ID

1. Ve a [Apple Developer Portal](https://developer.apple.com/account/)
2. Inicia sesión con tu cuenta de desarrollador
3. Ve a **Certificates, Identifiers & Profiles**
4. Haz clic en **Identifiers**
5. Busca o crea el App ID: `com.ofisi.mobile`

### Paso 2: Editar el App ID

1. Haz clic en el App ID `com.ofisi.mobile`
2. Haz clic en **Edit** (lápiz en la esquina superior derecha)
3. Scroll hasta la sección **Capabilities**

### Paso 3: Marcar las Capacidades

Marca únicamente:

```
✅ Push Notifications
```

**NO marques:**
```
❌ Associated Domains (a menos que uses Universal Links)
❌ Sign in with Apple
❌ In-App Purchase
❌ Apple Pay
❌ Background Modes
❌ Data Protection
❌ Game Center
❌ HealthKit
❌ HomeKit
❌ Inter-App Audio
❌ Personal VPN
❌ Siri
❌ Wallet
❌ Wireless Accessory Configuration
```

### Paso 4: Guardar

1. Haz clic en **Continue**
2. Revisa la configuración
3. Haz clic en **Register** o **Save**

---

## 🔔 Configuración Adicional para Push Notifications

Después de marcar Push Notifications, necesitas configurar el certificado APNs:

### Opción A: Dejar que EAS lo maneje (Recomendado)

EAS puede generar automáticamente el certificado APNs cuando configures las credenciales:

```bash
cd mobile
eas credentials
```

Selecciona:
- **Platform**: iOS
- **Action**: Set up credentials (o Update credentials)
- EAS generará automáticamente el certificado APNs si está disponible

### Opción B: Generar Manualmente

1. En Apple Developer Portal → **Certificates**
2. Haz clic en **+** para crear nuevo certificado
3. Selecciona **Apple Push Notification service SSL (Sandbox & Production)**
4. Selecciona tu App ID: `com.ofisi.mobile`
5. Genera un CSR (Certificate Signing Request) desde Keychain Access
6. Sube el CSR y descarga el certificado
7. Configúralo en EAS:

```bash
cd mobile
eas credentials
```

Selecciona:
- **Platform**: iOS
- **Action**: Update credentials
- **Push Notification Key**: Upload existing

---

## ✅ Checklist de Configuración

Antes de generar un build de producción, verifica:

- [ ] El App ID `com.ofisi.mobile` existe en Apple Developer Portal
- [ ] **Push Notifications** está marcado en el App ID
- [ ] El certificado APNs está configurado (o EAS lo generará automáticamente)
- [ ] Las credenciales están configuradas en EAS (`eas credentials`)
- [ ] El provisioning profile incluye Push Notifications

---

## 🚨 Errores Comunes

### Error: "Push Notifications capability not enabled"

**Solución:**
1. Ve a Apple Developer Portal
2. Edita el App ID `com.ofisi.mobile`
3. Marca **Push Notifications** en Capabilities
4. Guarda los cambios
5. Regenera el provisioning profile

### Error: "Missing APNs certificate"

**Solución:**
```bash
cd mobile
eas credentials
```

EAS puede generar el certificado APNs automáticamente, o puedes generarlo manualmente en Apple Developer Portal.

---

## 📚 Referencias

- [Documentación de Expo sobre Push Notifications](https://docs.expo.dev/push-notifications/overview/)
- [Apple Developer Portal](https://developer.apple.com/account/)
- [Documentación de EAS sobre Credenciales iOS](https://docs.expo.dev/build/signing/)

---

## 🎯 Resumen Rápido

**Para tu app `com.ofisi.mobile`, marca SOLO:**

1. ✅ **Push Notifications** - Porque usas expo-notifications

**NO marques:**
- ❌ Associated Domains (solo si no usas Universal Links)
- ❌ Sign in with Apple (tienes `usesAppleSignIn: false`)
- ❌ Cualquier otra capacidad que no uses

**Nota:** Los permisos de cámara, galería y ubicación NO se configuran en el App ID, sino en `Info.plist` (que Expo maneja automáticamente desde tu `app.json`).
