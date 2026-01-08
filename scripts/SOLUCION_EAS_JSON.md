# Solución: Error "eas.json could not be found"

## Problema

Error al ejecutar comandos de EAS:
```
eas.json could not be found at /Users/ecampazzo/Documents/Dev/handsOnProject/eas.json
Error: submit command failed.
```

## Causa

El archivo `eas.json` está en el directorio `mobile/`, pero estás ejecutando el comando desde la raíz del proyecto.

## Solución

**Siempre ejecuta los comandos de EAS desde el directorio `mobile/`:**

```bash
cd mobile
eas submit --platform android
```

O si estás en la raíz:

```bash
cd /Users/ecampazzo/Documents/Dev/handsOnProject/mobile
eas submit --platform android
```

## Comandos EAS Comunes

Todos estos comandos deben ejecutarse desde `mobile/`:

```bash
# Navegar al directorio correcto
cd mobile

# Build
eas build --platform android
eas build --platform ios

# Submit
eas submit --platform android
eas submit --platform ios

# Configurar
eas build:configure

# Ver builds
eas build:list

# Ver configuración
eas config
```

## Verificar la Ubicación Correcta

Antes de ejecutar comandos EAS, verifica que estás en el directorio correcto:

```bash
# Debe mostrar: /Users/ecampazzo/Documents/Dev/handsOnProject/mobile
pwd

# Debe existir el archivo
ls -la eas.json
```

## Estructura del Proyecto

```
handsOnProject/
├── mobile/              ← Ejecuta comandos EAS desde aquí
│   ├── eas.json        ← Archivo de configuración EAS
│   ├── app.json        ← Configuración de Expo
│   ├── package.json
│   └── ...
└── ...
```

## Nota sobre el Keystore

Si estás configurando el keystore para Android, asegúrate de que:

1. El keystore esté en `mobile/android/app/`
2. Las propiedades estén en `mobile/android/gradle.properties`
3. El `build.gradle` esté configurado correctamente

Para builds locales (sin EAS):
```bash
cd mobile/android
./gradlew assembleRelease
```

Para builds con EAS:
```bash
cd mobile
eas build --platform android
```

EAS manejará el keystore automáticamente si está configurado en `eas.json` o en las credenciales de EAS.
