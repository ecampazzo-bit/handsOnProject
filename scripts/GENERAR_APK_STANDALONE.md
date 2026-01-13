# 📱 Generar APK Standalone (Sin Expo Go)

## ✅ ¿Qué es un APK Standalone?

Un APK standalone es una aplicación Android **completamente independiente** que:

- ✅ **No necesita Expo Go** - Funciona como una app nativa normal
- ✅ **No necesita servidor de desarrollo** - Todo está embebido
- ✅ **Funciona sin conexión** - El JavaScript bundle está incluido
- ✅ **Incluye todos los assets** - Imágenes, fuentes, etc.
- ✅ **Listo para instalar** - Puedes compartirlo e instalar en cualquier dispositivo Android

## 🚀 Generar APK Standalone

### Método 1: Script Automático (RECOMENDADO)

```bash
cd mobile
./generar-apk-standalone.sh
```

Este script:
- ✅ Limpia builds anteriores
- ✅ Genera el JavaScript bundle
- ✅ Compila el APK con todo embebido
- ✅ Te muestra dónde está el APK
- ✅ Te da instrucciones para instalar

### Método 2: Usando npm

```bash
cd mobile
npm run apk:standalone
```

### Método 3: Comando Manual

```bash
cd mobile/android

# Limpiar
./gradlew clean

# Generar APK (el bundle se embede automáticamente)
./gradlew assembleRelease
```

El APK estará en: `mobile/android/app/build/outputs/apk/release/app-release.apk`

---

## 🔍 Cómo Funciona

Tu proyecto ya está configurado correctamente para generar APKs standalone:

### Configuración en `android/app/build.gradle`:

```gradle
react {
    // ...
    bundleCommand = "export:embed"  // ← Esto embede el bundle en el APK
    // ...
}
```

Esta configuración hace que:
1. **Expo genere el JavaScript bundle** durante la compilación
2. **El bundle se embeba dentro del APK** (no se carga desde un servidor)
3. **Todos los assets se incluyan** en el APK

---

## 📲 Instalar APK en Dispositivo Físico

### Opción 1: ADB (Recomendado - Más rápido)

```bash
# Conectar dispositivo por USB
adb devices  # Verifica que el dispositivo esté conectado

# Instalar APK
adb install mobile/android/app/build/outputs/apk/release/app-release.apk

# O reinstalar si ya existe
adb install -r mobile/android/app/build/outputs/apk/release/app-release.apk
```

### Opción 2: Transferencia Manual

1. **Habilitar instalación desde orígenes desconocidos:**
   - Android 8+: Configuración > Apps > Instalar apps desconocidos > Selecciona el navegador/gestor de archivos
   - Android antiguo: Configuración > Seguridad > Orígenes desconocidos

2. **Transferir APK:**
   - Por USB: Copia el APK al dispositivo
   - Por Email: Envía el APK por email y ábrelo desde tu dispositivo
   - Por Drive/Dropbox: Sube y descarga desde el dispositivo
   - Por ADB push:
     ```bash
     adb push mobile/android/app/build/outputs/apk/release/app-release.apk /sdcard/Download/
     ```

3. **Instalar:**
   - Abre el archivo APK en tu dispositivo
   - Toca "Instalar"
   - Listo ✅

---

## 🔍 Verificar que el APK es Standalone

Puedes verificar que el bundle está embebido:

```bash
# Ver contenido del APK
unzip -l mobile/android/app/build/outputs/apk/release/app-release.apk | grep bundle

# Deberías ver algo como:
# index.android.bundle
# o
# index.bundle
```

Si ves estos archivos, el APK es standalone ✅

---

## 📊 Tamaño del APK

Un APK standalone típico pesa:
- **30-60 MB** sin assets grandes
- **60-100 MB** con imágenes y assets
- Puede llegar a **100-150 MB** con muchas imágenes optimizadas

**Nota:** Para reducir el tamaño, puedes:
- Optimizar imágenes
- Usar formato WebP en lugar de PNG
- Habilitar minificación (`android.enableMinifyInReleaseBuilds=true`)

---

## 🆚 APK Debug vs Release

### APK Debug (`assembleDebug`)

```bash
cd mobile/android
./gradlew assembleDebug
```

- ✅ Más rápido de compilar
- ✅ También es standalone (funciona sin Expo Go)
- ⚠️ No está optimizado
- ⚠️ Más grande
- ✅ Perfecto para pruebas

**Ubicación:** `android/app/build/outputs/apk/debug/app-debug.apk`

### APK Release (`assembleRelease`)

```bash
cd mobile/android
./gradlew assembleRelease
```

- ✅ Optimizado
- ✅ Más pequeño
- ✅ Listo para distribución
- ⚠️ Tarda más en compilar

**Ubicación:** `android/app/build/outputs/apk/release/app-release.apk`

**Recomendación:** Para pruebas, usa Debug. Para distribución, usa Release.

---

## 🔧 Solución de Problemas

### Error: "Build failed"

Ver `scripts/SOLUCION_ERROR_APK_CMAKE.md` para solución detallada.

**Solución rápida:**
```bash
cd mobile/android
rm -rf app/.cxx app/build/.cxx .gradle
./gradlew clean
./gradlew assembleRelease
```

### Error: "Bundle not found"

El bundle debería generarse automáticamente. Si no, verifica:

1. Que `bundleCommand = "export:embed"` esté en `android/app/build.gradle`
2. Que Node.js esté instalado y en PATH
3. Que no haya errores en la compilación

### APK muy grande

1. **Optimizar imágenes:**
   - Convertir PNG a WebP
   - Reducir resolución si es necesario

2. **Habilitar minificación:**
   En `android/gradle.properties`:
   ```properties
   android.enableMinifyInReleaseBuilds=true
   android.enableShrinkResourcesInReleaseBuilds=true
   ```

3. **Limpiar assets no usados**

---

## 📋 Checklist Antes de Generar

- [ ] Android SDK instalado y configurado
- [ ] `ANDROID_HOME` configurado
- [ ] Licencias de Android SDK aceptadas
- [ ] Carpeta `android/` existe (si no: `npx expo prebuild --platform android`)
- [ ] Variables de entorno configuradas (si las usas)
- [ ] Espacio en disco suficiente (al menos 5GB libres)

---

## 🎯 Comandos Rápidos

```bash
# Generar APK Standalone (método fácil)
cd mobile && ./generar-apk-standalone.sh

# Generar APK Standalone (npm)
cd mobile && npm run apk:standalone

# Generar APK Standalone (manual)
cd mobile/android && ./gradlew assembleRelease

# Instalar directamente
adb install mobile/android/app/build/outputs/apk/release/app-release.apk

# Generar APK Debug (más rápido para pruebas)
cd mobile/android && ./gradlew assembleDebug
```

---

## ✅ Verificación Final

Después de generar el APK, verifica que:

1. ✅ El APK se generó correctamente
2. ✅ El tamaño es razonable (30-150 MB)
3. ✅ Puedes instalarlo en un dispositivo
4. ✅ La app funciona sin Expo Go
5. ✅ La app funciona sin conexión a servidor de desarrollo
6. ✅ Todos los assets (imágenes, etc.) se ven correctamente

Si todos los puntos están ✅, ¡tu APK standalone está listo! 🎉

---

## 📝 Notas Importantes

1. **Primera compilación:** Puede tardar 10-20 minutos. Las siguientes son más rápidas (2-5 minutos).

2. **Firma del APK:** El APK generado localmente está firmado con una clave de debug. Para distribución en Play Store, necesitarás configurar una firma de release.

3. **Actualizaciones:** Si cambias el código, debes regenerar el APK. No hay hot-reload como en desarrollo.

4. **Variables de entorno:** Si usas variables de entorno, asegúrate de que estén en `app.json` bajo `extra` o configúralas antes de generar el APK.

---

## 🚀 Siguiente Paso

Una vez que tengas tu APK standalone funcionando, puedes:

- **Distribuirlo** a usuarios para pruebas
- **Publicarlo** en Play Store (después de configurar firma de release)
- **Compartirlo** por cualquier medio (email, Drive, etc.)

¡Tu aplicación ya es completamente standalone! 🎊
