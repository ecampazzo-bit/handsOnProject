# 📱 Generar APK Local para Pruebas en Dispositivo Físico

## 🚀 Método Rápido (Recomendado)

### Opción 1: Script Automático

```bash
cd mobile
./generar-apk-local.sh
```

Este script:
- ✅ Limpia builds anteriores
- ✅ Compila el APK Release
- ✅ Te muestra la ubicación del APK generado
- ✅ Te da instrucciones para instalar

### Opción 2: Usando npm scripts

```bash
cd mobile
npm run apk
```

O directamente:

```bash
cd mobile
npm run build:apk
```

### Opción 3: Usando Gradle directamente (Más rápido)

```bash
cd mobile/android
./gradlew assembleRelease
cd ../..
```

El APK estará en: `mobile/android/app/build/outputs/apk/release/app-release.apk`

---

## 📋 Requisitos Previos

### 1. Android SDK configurado

Verifica que tienes configurado `ANDROID_HOME`:

```bash
# Verificar configuración
echo $ANDROID_HOME
```

Si no está configurado, agrega a `~/.zshrc` (macOS) o `~/.bashrc` (Linux):

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

Luego ejecuta:
```bash
source ~/.zshrc  # o source ~/.bashrc
```

### 2. Aceptar licencias de Android SDK

```bash
yes | sdkmanager --licenses
```

O manualmente en Android Studio:
- Tools > SDK Manager > SDK Tools > Show Package Details
- Acepta todas las licencias

### 3. Carpeta Android generada

Si no existe la carpeta `android/`, generarla:

```bash
cd mobile
npx expo prebuild --platform android
```

---

## 🔨 Generación Paso a Paso

### Paso 1: Limpiar builds anteriores (opcional pero recomendado)

```bash
cd mobile/android
./gradlew clean
cd ../..
```

### Paso 2: Generar APK Release

**Con Expo:**
```bash
cd mobile
npx expo run:android --variant release
```

**Con Gradle (más rápido):**
```bash
cd mobile/android
./gradlew assembleRelease
```

### Paso 3: Ubicación del APK

El APK se genera en:
```
mobile/android/app/build/outputs/apk/release/app-release.apk
```

---

## 📲 Instalar APK en Dispositivo Físico

### Método 1: ADB (Recomendado - Más rápido)

```bash
# Conectar dispositivo por USB
adb devices  # Verifica que el dispositivo esté conectado

# Instalar APK
adb install mobile/android/app/build/outputs/apk/release/app-release.apk

# O reinstalar si ya existe
adb install -r mobile/android/app/build/outputs/apk/release/app-release.apk
```

### Método 2: Transferencia Manual

1. **En tu dispositivo Android:**
   - Configuración > Seguridad > Activar "Orígenes desconocidos"
   - O Configuración > Apps > Instalar apps desconocidos > Selecciona el navegador/gestor de archivos

2. **Transferir el APK:**
   - Email: Envía el APK por email y ábrelo desde tu dispositivo
   - USB: Copia el APK al dispositivo
   - Google Drive/Dropbox: Sube y descarga desde el dispositivo
   - ADB push:
     ```bash
     adb push mobile/android/app/build/outputs/apk/release/app-release.apk /sdcard/Download/
     ```

3. **Instalar:**
   - Abre el archivo APK en tu dispositivo
   - Toca "Instalar"
   - Listo ✅

---

## 🔍 Verificar APK Generado

### Ver información del APK:

```bash
# Ver tamaño
ls -lh mobile/android/app/build/outputs/apk/release/app-release.apk

# Ver información detallada (requiere aapt2)
$ANDROID_HOME/build-tools/*/aapt2 dump badging mobile/android/app/build/outputs/apk/release/app-release.apk
```

### Verificar que es Release (no Debug):

```bash
# El nombre debería ser "app-release.apk", no "app-debug.apk"
ls mobile/android/app/build/outputs/apk/release/
```

---

## 🚨 Solución de Problemas

### Error: "ANDROID_HOME not set"

**Solución:**
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools
```

### Error: "SDK licenses not accepted"

**Solución:**
```bash
yes | sdkmanager --licenses
```

### Error: "No such file or directory: ./gradlew"

**Solución:**
```bash
cd mobile
npx expo prebuild --platform android
```

### Error: "Execution failed for task ':app:signReleaseBundle'"

**Solución:**
Esto significa que necesitas configurar la firma. Para pruebas, puedes usar un keystore de debug:

```bash
cd mobile/android
./gradlew assembleRelease -Pandroid.injected.signing.store.file=$HOME/.android/debug.keystore -Pandroid.injected.signing.store.password=android -Pandroid.injected.signing.key.alias=androiddebugkey -Pandroid.injected.signing.key.password=android
```

O mejor, generar un keystore para release (ver sección siguiente).

### APK muy grande (>100MB)

**Solución:**
Genera un AAB (Android App Bundle) en lugar de APK para reducir tamaño. Para pruebas locales, el APK está bien.

---

## 🔐 Configurar Firma para APK Release (Opcional)

Si quieres firmar el APK para distribución (no necesario para pruebas):

### 1. Generar keystore

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Configurar en `android/app/build.gradle`

Agregar antes de `android {`:

```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Y dentro de `android {` agregar:

```gradle
signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile file(keystoreProperties['storeFile'])
        storePassword keystoreProperties['storePassword']
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
    }
}
```

### 3. Crear `android/keystore.properties`

```
storePassword=tu_password
keyPassword=tu_password
keyAlias=my-key-alias
storeFile=../my-release-key.keystore
```

---

## 📊 Comandos Rápidos

```bash
# Generar APK (método rápido con script)
cd mobile && ./generar-apk-local.sh

# Generar APK (con npm)
cd mobile && npm run apk

# Generar APK (con Gradle directamente - más rápido)
cd mobile/android && ./gradlew assembleRelease

# Instalar directamente en dispositivo conectado
adb install mobile/android/app/build/outputs/apk/release/app-release.apk

# Ver ubicación del APK
ls -lh mobile/android/app/build/outputs/apk/release/app-release.apk
```

---

## ✅ Checklist

Antes de generar el APK, verifica:

- [ ] Android SDK instalado y configurado
- [ ] `ANDROID_HOME` configurado en variables de entorno
- [ ] Licencias de Android SDK aceptadas
- [ ] Carpeta `android/` existe (si no, ejecutar `npx expo prebuild`)
- [ ] Dispositivo conectado (si vas a instalar con ADB)

---

## 📝 Notas Importantes

1. **Primera compilación:** Puede tardar 10-20 minutos. Compilaciones siguientes son mucho más rápidas (2-5 minutos).

2. **Tamaño del APK:** Un APK Release típico pesa entre 30-80MB dependiendo de las dependencias.

3. **APK vs AAB:** 
   - APK: Para pruebas locales y distribución directa
   - AAB: Para Play Store (más pequeño, mejor optimizado)

4. **Firma:** El APK generado localmente puede estar firmado con una clave de debug. Para distribución en Play Store necesitarás configurar una firma de release.

---

## 🎯 Resumen Rápido

```bash
# 1. Ir a la carpeta mobile
cd mobile

# 2. Generar APK
./generar-apk-local.sh

# 3. Instalar en dispositivo
adb install android/app/build/outputs/apk/release/app-release.apk
```

¡Listo! Tu APK estará listo para probar en tu dispositivo físico. 🚀
