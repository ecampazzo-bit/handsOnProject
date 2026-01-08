# Solución: Error de Compilación con react-native-maps

## Problema

Error al compilar Android:
```
> Task :react-native-worklets:buildCMakeRelWithDebInfo[arm64-v8a][worklets] FAILED
error: cannot find symbol
  symbol:   method setUpdated(boolean)
  location: variable view of type MapMarker
```

## Causa

`react-native-maps` versión 1.20.1 no es completamente compatible con la nueva arquitectura de React Native (Fabric) que está habilitada en `gradle.properties` (`newArchEnabled=true`).

## Soluciones

### Solución 1: Actualizar react-native-maps (Recomendado)

Actualiza `react-native-maps` a una versión más reciente que tenga mejor soporte para la nueva arquitectura:

```bash
cd mobile
npm install react-native-maps@latest
# O una versión específica más reciente
npm install react-native-maps@1.21.0
```

Luego limpia y reconstruye:

```bash
cd android
./gradlew clean
cd ..
npm install
cd android
./gradlew assembleRelease
```

### Solución 2: Deshabilitar Temporalmente la Nueva Arquitectura

Si necesitas compilar ahora y no puedes actualizar, deshabilita temporalmente la nueva arquitectura:

1. Edita `mobile/android/gradle.properties`:
   ```properties
   # Cambiar de:
   newArchEnabled=true
   # A:
   newArchEnabled=false
   ```

2. Limpia y reconstruye:
   ```bash
   cd mobile/android
   ./gradlew clean
   ./gradlew assembleRelease
   ```

**⚠️ Nota:** Esto deshabilitará las características de la nueva arquitectura. Es una solución temporal.

### Solución 3: Usar Versión Específica Compatible

Si las versiones más recientes causan otros problemas, prueba una versión intermedia:

```bash
cd mobile
npm install react-native-maps@1.20.2
# O
npm install react-native-maps@1.19.0
```

## Verificar la Versión Instalada

```bash
cd mobile
npm list react-native-maps
```

## Limpiar Caché Completo

Si después de actualizar sigues teniendo problemas:

```bash
cd mobile

# Limpiar node_modules
rm -rf node_modules
npm install

# Limpiar Android
cd android
./gradlew clean
rm -rf .gradle
rm -rf app/build
rm -rf build

# Limpiar iOS (si aplica)
cd ../ios
rm -rf Pods
rm -rf build
pod install

# Reconstruir
cd ../android
./gradlew assembleRelease
```

## Verificar Compatibilidad

Para verificar qué versión de react-native-maps es compatible con tu versión de React Native:

- React Native 0.81.5 → react-native-maps 1.21.0+ (mejor soporte para nueva arquitectura)
- React Native 0.81.5 → react-native-maps 1.20.x (soporte limitado para nueva arquitectura)

## Alternativa: Usar Expo Maps

Si sigues teniendo problemas, considera usar `expo-maps` que está mejor integrado con Expo:

```bash
cd mobile
npx expo install expo-maps
```

Luego actualiza tu código para usar `expo-maps` en lugar de `react-native-maps`.

## Troubleshooting Adicional

### Error: "CMake not found"
```bash
# Instalar CMake (macOS)
brew install cmake

# O descargar desde: https://cmake.org/download/
```

### Error: "NDK not found"
Verifica que el NDK esté instalado en Android Studio:
- Android Studio → Preferences → Appearance & Behavior → System Settings → Android SDK
- SDK Tools → NDK (Side by side)

### Error persistente después de actualizar
1. Verifica que `node_modules/react-native-maps` tenga la versión correcta
2. Verifica que no haya conflictos en `package-lock.json`
3. Elimina `node_modules` y reinstala
4. Verifica que no haya múltiples versiones instaladas
