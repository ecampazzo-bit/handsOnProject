# 📦 Cómo Actualizar la Versión del Build

Para generar un nuevo build con EAS, necesitas actualizar los números de versión en los archivos de configuración.

## 📋 Archivos a Modificar

### 1. `mobile/app.json` (Principal)

Este es el archivo más importante. Contiene:

```json
{
  "expo": {
    "version": "1.3.2",           // Versión visible para el usuario (X.Y.Z)
    "android": {
      "versionCode": 6            // Número de build interno (debe incrementarse)
    },
    "ios": {
      "buildNumber": "6"          // Número de build para iOS
    }
  }
}
```

### 2. `mobile/package.json` (Opcional pero recomendado)

```json
{
  "version": "1.3.2"              // Debe coincidir con app.json
}
```

## 🔢 Versiones Actuales

Según tu configuración actual:
- **Versión**: `1.3.2`
- **Android versionCode**: `6`
- **iOS buildNumber**: `6`

## ✅ Pasos para Actualizar

### Opción 1: Actualización Manual

1. **Edita `mobile/app.json`:**
   - Incrementa `versionCode` en Android (de 6 a 7)
   - Opcionalmente incrementa `version` (de 1.3.2 a 1.3.3)
   - Opcionalmente incrementa `buildNumber` en iOS (de "6" a "7")

2. **Edita `mobile/package.json`:**
   - Actualiza `version` para que coincida con `app.json`

3. **Genera el build:**
   ```bash
   cd mobile
   eas build --platform android --profile production
   ```

### Opción 2: Usar el Script Automático

```bash
cd /Users/ecampazzo/Documents/Dev/handsOnProject
./scripts/actualizar_version.sh
```

Este script:
- Incrementa automáticamente el `versionCode` de Android
- Incrementa automáticamente el `buildNumber` de iOS
- Opcionalmente incrementa la versión (1.3.2 → 1.3.3)
- Actualiza `package.json` para que coincida

## 📝 Convenciones de Versión

### Version (X.Y.Z)
- **X** (Major): Cambios incompatibles
- **Y** (Minor): Nuevas características compatibles
- **Z** (Patch): Correcciones de bugs

Ejemplos:
- `1.3.2` → `1.3.3` (patch - corrección de bug)
- `1.3.2` → `1.4.0` (minor - nueva característica)
- `1.3.2` → `2.0.0` (major - cambio incompatible)

### versionCode / buildNumber
- **Siempre debe incrementarse** para cada nuevo build
- Debe ser un número entero mayor que el anterior
- Google Play Store y App Store lo usan para identificar builds

## 🚀 Ejemplo de Actualización

### Antes:
```json
{
  "version": "1.3.2",
  "android": { "versionCode": 6 },
  "ios": { "buildNumber": "6" }
}
```

### Después (para un nuevo build):
```json
{
  "version": "1.3.3",           // Incrementado (patch)
  "android": { "versionCode": 7 },  // Incrementado (obligatorio)
  "ios": { "buildNumber": "7" }     // Incrementado (obligatorio)
}
```

## ⚠️ Importante

1. **El `versionCode` de Android DEBE incrementarse** para cada build que subas a Google Play Store
2. **El `buildNumber` de iOS DEBE incrementarse** para cada build que subas a App Store
3. Si no incrementas estos números, Google Play/App Store rechazarán el build
4. El `versionCode`/`buildNumber` debe ser siempre mayor que el anterior

## 🔍 Verificar Versiones Actuales

```bash
# Ver versión en app.json
grep -A 1 '"version"' mobile/app.json
grep -A 1 '"versionCode"' mobile/app.json
grep -A 1 '"buildNumber"' mobile/app.json

# Ver versión en package.json
grep '"version"' mobile/package.json
```

## 📚 Referencias

- [Expo - App Versioning](https://docs.expo.dev/workflow/configuration/#version)
- [Android - Version Your App](https://developer.android.com/studio/publish/versioning)
- [iOS - Versioning](https://developer.apple.com/documentation/xcode/versioning-your-app)
