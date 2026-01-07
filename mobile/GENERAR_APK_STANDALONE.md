# 📱 Generar APK Standalone para Pruebas

Esta guía te ayudará a generar una APK standalone para instalar directamente en dispositivos Android sin necesidad de Expo Go.

## ✅ Cambios Realizados

- ✅ `versionCode` actualizado de 2 a 3 en `app.json`
- ✅ Slug corregido para coincidir con el projectId de EAS
- ✅ Script `generar-apk.sh` creado

## 🚀 Pasos para Generar la APK

### Opción 1: Usando el Script (Recomendado)

```bash
cd mobile
./generar-apk.sh
```

### Opción 2: Comando Manual

```bash
cd mobile
eas build --platform android --profile preview
```

## 📋 Proceso Interactivo

Cuando ejecutes el comando, EAS te preguntará:

1. **"Generate a new Android Keystore?"**
   - Si es la primera vez: Responde **`yes`** o **`y`**
   - Si ya tienes uno: Responde **`no`** o **`n`**

2. El build comenzará automáticamente y tomará aproximadamente **15-30 minutos**

## 📊 Seguimiento del Build

Puedes ver el progreso del build en:

**URL**: https://expo.dev/accounts/ecampazzo/projects/handson-app/builds

O desde la terminal, verás el progreso en tiempo real.

## 📥 Descargar la APK

Una vez completado el build:

1. Recibirás un enlace en la terminal
2. O ve a: https://expo.dev/accounts/ecampazzo/projects/handson-app/builds
3. Haz clic en el build completado
4. Descarga el archivo `.apk`

## 📲 Instalar en Dispositivo Android

1. **Habilitar "Orígenes desconocidos"** en tu dispositivo:
   - Configuración → Seguridad → Orígenes desconocidos (activar)

2. **Transferir el APK** al dispositivo:
   - Por USB
   - Por email
   - Por Google Drive/Dropbox
   - Por WhatsApp/Telegram

3. **Instalar**:
   - Abre el archivo APK en tu dispositivo
   - Sigue las instrucciones de instalación

## ⚙️ Configuración Actual

- **Versión**: 1.3.0
- **Version Code**: 3
- **Package**: com.ofisi.app
- **Perfil**: preview (genera APK)
- **Plataforma**: Android

## 🔧 Solución de Problemas

### Error: "No estás logueado"
```bash
eas login
```

### Error: "EAS CLI no está instalado"
```bash
npm install -g eas-cli
```

### Error: "Keystore no encontrado"
- Responde `yes` cuando pregunte si quieres generar uno nuevo
- EAS lo generará automáticamente y lo guardará de forma segura

### El build falla
- Revisa los logs en: https://expo.dev/accounts/ecampazzo/projects/handson-app/builds
- Verifica que todas las dependencias estén instaladas: `npm install`
- Verifica que el código compile: `npm start`

## 📝 Notas Importantes

1. **Tiempo de build**: 15-30 minutos (depende del tráfico de EAS)
2. **Límites gratuitos**: Expo ofrece builds gratuitos limitados por mes
3. **Keystore**: EAS guarda el keystore de forma segura. No necesitas descargarlo manualmente
4. **Version Code**: Se incrementa automáticamente en cada build

## 🎯 Próximos Pasos

Una vez que tengas la APK:

1. Instálala en varios dispositivos Android para probar
2. Verifica que todas las funcionalidades funcionen correctamente
3. Prueba en diferentes versiones de Android si es posible
4. Reporta cualquier problema encontrado

---

**¿Listo para generar la APK?** Ejecuta:

```bash
cd mobile
eas build --platform android --profile preview
```

¡Éxito! 🚀

