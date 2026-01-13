# Guía Paso a Paso: Solucionar Error de Firma de Android

## 🎯 Objetivo

Configurar EAS para usar el keystore correcto con SHA1: `AB:D6:A8:1B:CC:64:CF:2D:A1:0B:66:CD:BF:3C:F7:42:3C:53:89:E5`

---

## 📋 Paso 1: Verificar Estado Actual de Credenciales

### 1.1. Abrir Terminal y Navegar al Proyecto

```bash
cd /Users/ecampazzo/Documents/Dev/handsOnProject/mobile
```

### 1.2. Verificar Credenciales Actuales

```bash
eas credentials
```

**Selecciona en orden:**
1. **Platform**: `android`
2. **Project**: `handson-app`
3. **Build profile**: `production` (o el que uses para builds de producción)
4. **Action**: `View credentials` o `Update credentials`

### 1.3. Anotar Información Actual

Anota:
- ¿Qué keystore está configurado actualmente?
- ¿Hay información sobre el SHA1?
- ¿Cuándo se creó este keystore?

---

## 📋 Paso 2: Buscar el Keystore Original

### 2.1. Buscar en tu Computadora

Busca archivos con estas extensiones:
- `.keystore`
- `.jks`
- `.p12` (menos común para Android)

**Lugares comunes donde buscar:**

```bash
# Buscar en el proyecto
find ~/Documents/Dev -name "*.keystore" -o -name "*.jks" 2>/dev/null

# Buscar en carpetas de backup
find ~/Desktop -name "*.keystore" -o -name "*.jks" 2>/dev/null
find ~/Downloads -name "*.keystore" -o -name "*.jks" 2>/dev/null

# Buscar en Dropbox/Google Drive (si los tienes sincronizados)
find ~/Dropbox -name "*.keystore" -o -name "*.jks" 2>/dev/null
find ~/Google\ Drive -name "*.keystore" -o -name "*.jks" 2>/dev/null
```

### 2.2. Buscar en Documentación del Proyecto

Revisa:
- Archivos README.md
- Documentación en carpetas `docs/` o `scripts/`
- Notas personales
- Archivos de configuración antiguos

### 2.3. Buscar en Servicios de Backup

- **Google Drive**: Busca archivos `.keystore` o `.jks`
- **Dropbox**: Revisa carpetas de backup
- **iCloud**: Si tienes backups de iOS/Mac
- **Email**: Busca correos donde puedas haber guardado el keystore

### 2.4. Verificar si EAS Tiene Múltiples Credenciales

Es posible que EAS tenga guardado el keystore original. Verifica:

```bash
eas credentials
```

Revisa si hay múltiples credenciales guardadas o si puedes ver el historial.

---

## 📋 Paso 3: Verificar SHA1 del Keystore Encontrado

### 3.1. Si Encontraste un Keystore

Usa el script de verificación:

```bash
cd /Users/ecampazzo/Documents/Dev/handsOnProject/scripts
./verificar_sha1_keystore.sh [ruta-al-keystore] [alias]
```

**Ejemplo:**
```bash
./verificar_sha1_keystore.sh ~/Desktop/my-release-key.keystore my-key-alias
```

### 3.2. Verificación Manual

Si prefieres verificar manualmente:

```bash
keytool -list -v -keystore [ruta-al-keystore] -alias [alias]
```

**Busca la línea:**
```
SHA1: AB:D6:A8:1B:CC:64:CF:2D:A1:0B:66:CD:BF:3C:F7:42:3C:53:89:E5
```

### 3.3. Si el SHA1 Coincide ✅

¡Perfecto! Este es el keystore correcto. Continúa al **Paso 4**.

### 3.4. Si el SHA1 NO Coincide ❌

Continúa buscando. Este no es el keystore correcto.

---

## 📋 Paso 4: Subir el Keystore Correcto a EAS

### 4.1. Preparar la Información

Necesitas tener:
- ✅ Archivo `.keystore` o `.jks`
- ✅ **Alias** de la clave (ej: `my-key-alias`, `upload`, `key0`)
- ✅ **Contraseña del keystore**
- ✅ **Contraseña de la clave** (puede ser la misma o diferente)

### 4.2. Actualizar Credenciales en EAS

```bash
cd /Users/ecampazzo/Documents/Dev/handsOnProject/mobile
eas credentials
```

**Selecciona en orden:**
1. **Platform**: `android`
2. **Project**: `handson-app`
3. **Build profile**: `production`
4. **Action**: `Update credentials` o `Set up credentials`
5. **Keystore**: `Upload existing keystore`

### 4.3. Proporcionar Información

EAS te pedirá:
1. **Ruta al archivo keystore**: Proporciona la ruta completa
   ```
   /Users/ecampazzo/Desktop/my-release-key.keystore
   ```
2. **Alias de la clave**: El alias que usaste al crear el keystore
3. **Contraseña del keystore**: La contraseña del archivo keystore
4. **Contraseña de la clave**: La contraseña de la clave específica

### 4.4. Verificar que se Subió Correctamente

Después de subir, EAS debería confirmar. Verifica nuevamente:

```bash
eas credentials
```

Selecciona: `View credentials` y verifica que el keystore esté configurado.

---

## 📋 Paso 5: Generar Nuevo Build con el Keystore Correcto

### 5.1. Limpiar Builds Anteriores (Opcional)

```bash
cd /Users/ecampazzo/Documents/Dev/handsOnProject/mobile
eas build:cancel  # Si hay un build en progreso
```

### 5.2. Generar Nuevo Build

```bash
eas build --platform android --profile production
```

### 5.3. Verificar el Build

El build tomará aproximadamente 15-30 minutos. Puedes ver el progreso en:
- Terminal
- https://expo.dev/accounts/ecampazzo/projects/handson-app/builds

### 5.4. Verificar SHA1 del AAB Generado (Opcional)

Una vez descargado el AAB, puedes verificar su SHA1:

```bash
# Opción 1: Usar jarsigner
jarsigner -verify -verbose -certs app-release.aab | grep -i SHA1

# Opción 2: Usar apksigner (si tienes Android SDK)
apksigner verify --print-certs app-release.aab | grep -i SHA1
```

El SHA1 debería ser: `AB:D6:A8:1B:CC:64:CF:2D:A1:0B:66:CD:BF:3C:F7:42:3C:53:89:E5`

---

## 📋 Paso 6: Subir a Google Play Store

### 6.1. Descargar el AAB

Desde: https://expo.dev/accounts/ecampazzo/projects/handson-app/builds

### 6.2. Subir a Google Play Console

1. Ve a **Google Play Console** → Tu app → **Versiones** → **Producción**
2. Haz clic en **Crear nueva versión**
3. Sube el nuevo AAB
4. Completa las notas de versión
5. Revisa que no haya errores de firma

### 6.3. Verificar que el Error se Resolvió

Si el SHA1 es correcto, Google Play debería aceptar el AAB sin errores de firma.

---

## 🚨 Si NO Encontraste el Keystore Original

### Opción A: Contactar a Google Play Support

1. Ve a **Google Play Console** → **Ayuda** → **Contactar con el equipo de Play Console**
2. Explica la situación:
   - Perdiste el keystore original
   - El SHA1 esperado es: `AB:D6:A8:1B:CC:64:CF:2D:A1:0B:66:CD:BF:3C:F7:42:3C:53:89:E5`
   - Necesitas ayuda para migrar a Google Play App Signing o recuperar el keystore

3. Pregunta si pueden:
   - Migrar tu app a **Google Play App Signing** (recomendado)
   - O ayudarte a recuperar/restaurar el keystore

### Opción B: Verificar si Usas Google Play App Signing

1. Ve a **Google Play Console** → Tu app → **Configuración** → **Integridad de la app**
2. Busca **"App signing"** o **"Firma de la app"**
3. Si está habilitado, verifica la **"Upload key certificate"**
4. El SHA1 que necesitas puede ser de la upload key, no de la clave de firma final

### Opción C: Buscar en Historial de EAS

Es posible que EAS tenga un historial de credenciales. Contacta a Expo Support:
- Email: support@expo.dev
- O desde: https://expo.dev/support

Pregunta si pueden ayudarte a recuperar el keystore original que se usó para la primera versión.

---

## ✅ Checklist Final

Antes de subir a Google Play, verifica:

- [ ] Encontré el keystore con SHA1: `AB:D6:A8:1B:CC:64:CF:2D:A1:0B:66:CD:BF:3C:F7:42:3C:53:89:E5`
- [ ] Subí el keystore correcto a EAS
- [ ] Verifiqué que EAS está usando el keystore correcto
- [ ] Generé un nuevo build con `eas build --platform android --profile production`
- [ ] Verifiqué el SHA1 del AAB generado (opcional)
- [ ] El AAB está listo para subir a Google Play

---

## 📞 Recursos de Ayuda

- **EAS Documentation**: https://docs.expo.dev/build/signing/
- **Google Play App Signing**: https://support.google.com/googleplay/android-developer/answer/9842756
- **Expo Support**: https://expo.dev/support
- **Google Play Support**: Desde Google Play Console → Ayuda

---

## 🎯 Resumen Rápido

1. **Buscar** el keystore original
2. **Verificar** su SHA1 con el script
3. **Subir** a EAS con `eas credentials`
4. **Generar** nuevo build
5. **Subir** a Google Play

¡Éxito! 🚀
