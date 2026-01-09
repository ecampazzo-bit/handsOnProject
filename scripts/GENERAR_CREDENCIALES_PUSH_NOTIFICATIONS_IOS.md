# 🔔 Generar Credenciales de Push Notifications para iOS

## 📋 Información de la App

- **Bundle Identifier**: `com.ofisi.mobile`
- **Nombre**: ofiSí
- **Plugin**: `expo-notifications` (ya configurado en `app.json`)

---

## ✅ Requisitos Previos

Antes de generar las credenciales de Push Notifications, asegúrate de:

1. ✅ Tener una cuenta de Apple Developer activa (pagada)
2. ✅ El App ID `com.ofisi.mobile` está creado en Apple Developer Portal
3. ✅ **Push Notifications** está habilitado en el App ID (ver `CONFIGURACION_APP_ID_IOS.md`)
4. ✅ Tienes acceso a EAS CLI (`eas credentials`)

---

## 🎯 Opción 1: EAS Genera Automáticamente (Recomendado)

EAS puede generar automáticamente la APNs Key cuando configuras las credenciales de iOS.

### Paso 1: Configurar Credenciales en EAS

```bash
cd mobile
eas credentials
```

### Paso 2: Seleccionar iOS

Cuando EAS te pregunte:
- **Platform**: `iOS`
- **Project**: `handson-app`
- **Action**: `Set up credentials` (o `Update credentials`)

### Paso 3: Configurar Push Notifications

EAS te preguntará sobre Push Notifications:

```
Do you want to set up Push Notifications?
```

**Selecciona: Sí (Yes)**

EAS te preguntará:

```
Generate a new Apple Push Notification Key?
```

**Selecciona: Sí (Yes)**

EAS:
1. Se conectará a tu cuenta de Apple Developer
2. Generará automáticamente una APNs Key
3. La guardará en EAS para futuros builds
4. La asociará con tu App ID `com.ofisi.mobile`

### Paso 4: Verificar

Después de configurar, puedes verificar:

```bash
eas credentials
```

Selecciona:
- **Platform**: iOS
- **Project**: handson-app
- **Action**: View credentials

Esto te mostrará:
- ✅ Certificado de distribución
- ✅ Provisioning profile
- ✅ **Push Notification Key** (si está configurado)

---

## 🔧 Opción 2: Generar Manualmente en Apple Developer

Si prefieres generar la APNs Key manualmente:

### Paso 1: Acceder a Apple Developer Portal

1. Ve a [Apple Developer Portal](https://developer.apple.com/account/)
2. Inicia sesión con tu cuenta de desarrollador
3. Ve a **Certificates, Identifiers & Profiles**

### Paso 2: Verificar que Push Notifications esté Habilitado

1. Ve a **Identifiers**
2. Busca el App ID: `com.ofisi.mobile`
3. Verifica que **Push Notifications** esté marcado en Capabilities
4. Si no está marcado, edita el App ID y márcalo

### Paso 3: Crear APNs Key (Recomendado)

**Nota:** Apple recomienda usar **APNs Key** (archivo `.p8`) en lugar de certificados, ya que:
- No expira (a diferencia de los certificados que expiran anualmente)
- Funciona para desarrollo y producción
- Es más fácil de manejar

#### 3.1. Crear la Key

1. En Apple Developer Portal, ve a **Keys**
2. Haz clic en **"+"** para crear una nueva key
3. Completa:
   - **Key Name**: `ofiSí Push Notifications Key` (o el nombre que prefieras)
   - **Enable Apple Push Notifications service (APNs)**: ✅ **Marca esta opción**
4. Haz clic en **Continue**
5. Revisa la configuración
6. Haz clic en **Register**

#### 3.2. Descargar la Key

**⚠️ IMPORTANTE:** Solo puedes descargar la key **UNA VEZ**. Guárdala en un lugar seguro.

1. Después de crear la key, verás una pantalla con:
   - **Key ID**: (ej: `ABC123XYZ`)
   - **Download** button
2. Haz clic en **Download** para descargar el archivo `.p8`
3. **Guarda este archivo en un lugar seguro** (no se puede volver a descargar)
4. Anota el **Key ID** (lo necesitarás para configurar en EAS)

### Paso 4: Subir la Key a EAS

```bash
cd mobile
eas credentials
```

Selecciona:
- **Platform**: iOS
- **Project**: handson-app
- **Action**: Update credentials
- **Push Notification Key**: Upload existing key
- Proporciona la ruta al archivo `.p8` descargado
- Ingresa el **Key ID** cuando se te solicite

---

## 🔄 Opción 3: Usar Certificado APNs (Alternativa)

Si prefieres usar un certificado en lugar de una key:

### Paso 1: Generar CSR (Certificate Signing Request)

1. Abre **Keychain Access** en macOS
2. Ve a **Keychain Access** → **Certificate Assistant** → **Request a Certificate From a Certificate Authority**
3. Completa:
   - **User Email Address**: Tu email de Apple Developer
   - **Common Name**: `ofiSí APNs Certificate`
   - **CA Email Address**: (déjalo vacío)
   - **Request is**: Selecciona **Saved to disk**
4. Haz clic en **Continue**
5. Guarda el archivo `.certSigningRequest`

### Paso 2: Crear Certificado en Apple Developer

1. En Apple Developer Portal, ve a **Certificates**
2. Haz clic en **"+"** para crear un nuevo certificado
3. Selecciona **Apple Push Notification service SSL (Sandbox & Production)**
4. Haz clic en **Continue**
5. Selecciona tu App ID: `com.ofisi.mobile`
6. Haz clic en **Continue**
7. Sube el archivo `.certSigningRequest` que generaste
8. Haz clic en **Continue**
9. Descarga el certificado (archivo `.cer`)

### Paso 3: Convertir y Exportar el Certificado

1. Abre el archivo `.cer` descargado (se abrirá en Keychain Access)
2. En Keychain Access, busca el certificado (debería estar en **My Certificates**)
3. Expande el certificado para ver la key privada
4. Selecciona tanto el certificado como la key privada
5. Haz clic derecho → **Export 2 items...**
6. Guarda como archivo `.p12`
7. Ingresa una contraseña cuando se te solicite (guárdala, la necesitarás)

### Paso 4: Subir el Certificado a EAS

```bash
cd mobile
eas credentials
```

Selecciona:
- **Platform**: iOS
- **Project**: handson-app
- **Action**: Update credentials
- **Push Notification Certificate**: Upload existing certificate
- Proporciona la ruta al archivo `.p12`
- Ingresa la contraseña del `.p12` cuando se te solicite

---

## ✅ Verificar Configuración

### Verificar en EAS

```bash
cd mobile
eas credentials
```

Selecciona:
- **Platform**: iOS
- **Project**: handson-app
- **Action**: View credentials

Deberías ver:
- ✅ Distribution Certificate
- ✅ Provisioning Profile
- ✅ **Push Notification Key** (o Certificate)

### Verificar en Apple Developer Portal

1. Ve a [Apple Developer Portal](https://developer.apple.com/account/)
2. Ve a **Certificates, Identifiers & Profiles**
3. Ve a **Identifiers** → `com.ofisi.mobile`
4. Verifica que **Push Notifications** esté marcado
5. Si usaste una Key, ve a **Keys** y verifica que la key esté creada
6. Si usaste un Certificado, ve a **Certificates** y verifica que el certificado esté creado

---

## 🧪 Probar Push Notifications

### Paso 1: Generar un Build de Prueba

```bash
cd mobile
eas build --platform ios --profile production
```

### Paso 2: Instalar en Dispositivo

1. Descarga el build desde EAS
2. Instálalo en un dispositivo iOS físico (las notificaciones push no funcionan en simulador)

### Paso 3: Probar con Expo Notifications

Tu app ya tiene `expo-notifications` configurado. Puedes probar las notificaciones:

```typescript
import * as Notifications from 'expo-notifications';

// Obtener el token de notificaciones
const token = await Notifications.getExpoPushTokenAsync({
  projectId: '6654f1d9-c2cb-4de2-973a-85f786d03a5f', // Tu projectId de EAS
});

console.log('Push Token:', token.data);
```

---

## 🚨 Solución de Problemas

### Error: "Push Notifications capability not enabled"

**Solución:**
1. Ve a [Apple Developer Portal](https://developer.apple.com/account/)
2. Ve a **Identifiers** → `com.ofisi.mobile`
3. Edita el App ID
4. Marca **Push Notifications** en Capabilities
5. Guarda los cambios
6. Regenera el provisioning profile en EAS

### Error: "Missing APNs key/certificate"

**Solución:**
```bash
cd mobile
eas credentials
```

Selecciona:
- **Platform**: iOS
- **Action**: Update credentials
- **Push Notification Key**: Generate new (o Upload existing)

### Error: "APNs key expired" (solo para certificados)

**Solución:**
Los certificados APNs expiran anualmente. Debes:
1. Generar un nuevo certificado APNs
2. Actualizarlo en EAS usando `eas credentials`

**Recomendación:** Usa una **APNs Key** (`.p8`) en lugar de un certificado, ya que no expira.

### Error: "Invalid Key ID"

**Solución:**
1. Verifica que el Key ID sea correcto
2. Asegúrate de que la key esté asociada con el App ID correcto
3. Verifica que la key tenga permisos de APNs habilitados

---

## 📝 Checklist Final

Antes de generar un build de producción con Push Notifications:

- [ ] El App ID `com.ofisi.mobile` tiene **Push Notifications** habilitado
- [ ] La APNs Key o Certificate está configurada en EAS
- [ ] Las credenciales de iOS están actualizadas en EAS
- [ ] El provisioning profile incluye Push Notifications
- [ ] Has probado las notificaciones en un dispositivo físico

---

## 🎯 Resumen Rápido

**Método Recomendado:**

```bash
cd mobile
eas credentials
```

1. Selecciona: **iOS** → **handson-app** → **Set up credentials**
2. Cuando pregunte sobre Push Notifications: **Yes**
3. Cuando pregunte sobre generar APNs Key: **Yes**
4. EAS manejará todo automáticamente

**Método Manual:**

1. Ve a [Apple Developer Portal](https://developer.apple.com/account/)
2. Crea una **APNs Key** en **Keys**
3. Descarga el archivo `.p8` (solo una vez)
4. Sube la key a EAS usando `eas credentials`

---

## 📚 Referencias

- [Documentación de Expo sobre Push Notifications](https://docs.expo.dev/push-notifications/overview/)
- [Documentación de EAS sobre Credenciales iOS](https://docs.expo.dev/build/signing/)
- [Apple Developer Portal](https://developer.apple.com/account/)
- [Guía de Apple sobre APNs](https://developer.apple.com/documentation/usernotifications)

---

## 💡 Recomendación

**Usa una APNs Key (`.p8`) en lugar de un certificado** porque:
- ✅ No expira (los certificados expiran anualmente)
- ✅ Funciona para desarrollo y producción
- ✅ Más fácil de manejar
- ✅ Apple lo recomienda

EAS puede generar la key automáticamente, así que es la opción más simple. 🚀
