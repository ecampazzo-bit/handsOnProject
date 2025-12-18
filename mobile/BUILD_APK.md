# Guía para Generar APK de Android

## Opción 1: EAS Build (Recomendado - Genera APK en la nube)

### Paso 1: Iniciar sesión en Expo
```bash
cd mobile
eas login
```
Si no tienes cuenta, créala en: https://expo.dev/signup

### Paso 2: Configurar el proyecto
```bash
eas build:configure
```

### Paso 3: Generar el APK
```bash
# Para generar un APK de prueba (preview)
eas build --platform android --profile preview

# O para producción
eas build --platform android --profile production
```

### Paso 4: Descargar el APK
Una vez completado el build, recibirás un enlace para descargar el APK. También puedes verlo en:
https://expo.dev/accounts/[tu-usuario]/projects/handson-app/builds

---

## Opción 2: Build Local (Requiere Android Studio)

### Requisitos previos:
1. Instalar Android Studio
2. Configurar las variables de entorno ANDROID_HOME
3. Aceptar las licencias de Android SDK

### Generar APK localmente:
```bash
cd mobile
npx expo run:android --variant release
```

El APK se generará en: `android/app/build/outputs/apk/release/app-release.apk`

---

## Opción 3: Build Local con Gradle directamente

Si ya tienes el proyecto Android configurado:

```bash
cd mobile/android
./gradlew assembleRelease
```

El APK estará en: `app/build/outputs/apk/release/app-release.apk`

---

## Notas Importantes:

1. **Primera vez con EAS Build**: Necesitarás crear una cuenta de Expo (gratis)
2. **Tiempo de build**: EAS Build toma aproximadamente 10-20 minutos
3. **Límites gratuitos**: Expo ofrece builds gratuitos limitados
4. **Firma del APK**: Para producción, necesitarás configurar una keystore

---

## Instalación del APK en dispositivo Android:

1. Habilita "Orígenes desconocidos" en tu dispositivo Android:
   - Configuración > Seguridad > Orígenes desconocidos
2. Transfiere el APK a tu dispositivo (por USB, email, etc.)
3. Abre el archivo APK en tu dispositivo
4. Sigue las instrucciones de instalación

