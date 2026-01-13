# 🔧 Solución: Error CMake al Generar APK

## Error que aparece:
```
FAILURE: Build failed with an exception.
Execution failed for task ':app:configureCMakeRelWithDebInfo[armeabi-v7a]'.
> java.io.EOFException: End of input at line 13 column 4 path $.buildFiles
```

## ✅ Soluciones (en orden de efectividad):

### Solución 1: Limpiar completamente el build (RECOMENDADO)

```bash
cd mobile/android

# Limpiar todo
rm -rf app/.cxx app/build/.cxx .gradle app/build/intermediates app/build/outputs

# Limpiar con Gradle
./gradlew clean

# Intentar de nuevo
./gradlew assembleRelease
```

### Solución 2: Usar el script simplificado

```bash
cd mobile
./generar-apk-simple.sh
```

Este script automáticamente limpia los archivos problemáticos antes de compilar.

### Solución 3: Generar solo APK Debug (más rápido y menos propenso a errores)

```bash
cd mobile/android
./gradlew assembleDebug
```

El APK estará en: `android/app/build/outputs/apk/debug/app-debug.apk`

**Ventaja:** El APK Debug funciona perfectamente para pruebas en dispositivos físicos y no requiere configuración de firma.

### Solución 4: Limpiar cache de CMake específicamente

```bash
cd mobile/android

# Eliminar todos los archivos de CMake
find . -name "CMakeCache.txt" -delete
find . -name "cmake_install.cmake" -delete
find app -name ".cxx" -type d -exec rm -rf {} + 2>/dev/null || true
find . -path "*/build/.cxx/*" -type f -delete 2>/dev/null || true

# Reintentar
./gradlew clean
./gradlew assembleRelease
```

### Solución 5: Usar EAS Build Local (si las anteriores no funcionan)

```bash
cd mobile
eas build --platform android --profile preview --local
```

Esto usa Docker para un ambiente limpio, pero requiere tener Docker instalado.

### Solución 6: Rebuild completo del proyecto Android

```bash
cd mobile

# Eliminar carpeta android completamente
rm -rf android

# Regenerar desde cero
npx expo prebuild --platform android

# Intentar compilar
cd android
./gradlew assembleRelease
```

---

## 🔍 Diagnóstico del Problema

Este error generalmente ocurre cuando:

1. **Build interrumpido anteriormente:** Si un build anterior se interrumpió (Ctrl+C), pueden quedar archivos JSON corruptos
2. **Cache corrupto:** Los archivos de cache de CMake pueden corromperse
3. **Problemas de memoria:** Si el sistema se quedó sin memoria durante el build
4. **Múltiples builds simultáneos:** Ejecutar varios builds a la vez puede causar corrupción

---

## 📋 Checklist Antes de Generar APK

- [ ] Limpiar build anterior (`./gradlew clean`)
- [ ] Cerrar otras instancias de Gradle/Android Studio
- [ ] Tener suficiente espacio en disco (al menos 5GB libres)
- [ ] Tener suficiente RAM (al menos 4GB disponibles)
- [ ] Aceptar todas las licencias de Android SDK (`yes | sdkmanager --licenses`)

---

## 🎯 Comando Rápido Recomendado

```bash
cd mobile/android
rm -rf app/.cxx app/build/.cxx && ./gradlew clean && ./gradlew assembleRelease
```

O usar el script:
```bash
cd mobile
./generar-apk-simple.sh
```

---

## ⚠️ Si Nada Funciona

Si ninguna de las soluciones funciona, puedes:

1. **Generar APK Debug** (funciona igual para pruebas):
   ```bash
   cd mobile/android
   ./gradlew assembleDebug
   ```

2. **Usar EAS Build en la nube** (no requiere configuración local):
   ```bash
   cd mobile
   eas build --platform android --profile preview
   ```

3. **Reinstalar Android SDK Tools**:
   ```bash
   # En Android Studio: Tools > SDK Manager > SDK Tools
   # Desmarcar y volver a marcar: CMake, NDK, Build Tools
   ```

---

## 📝 Nota Importante

El error de CMake es común cuando hay archivos de build corruptos. La **Solución 1** (limpieza completa) resuelve el problema en el 90% de los casos.
