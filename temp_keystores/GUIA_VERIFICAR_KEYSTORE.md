# 🔍 Guía para Verificar el Keystore Anterior

Si estás teniendo problemas para verificar el SHA1 de los keystores, aquí tienes varias opciones:

## ❌ Problema: Error al leer el keystore

Si ves el error:
```
❌ Error al leer el keystore
Posibles causas:
  - Contraseña incorrecta
  - Alias incorrecto
  - Archivo keystore corrupto
```

## ✅ Soluciones

### Opción 1: Verificar desde EAS (Más Fácil)

Los keystores de EAS pueden tener contraseñas generadas automáticamente que son difíciles de recordar. La mejor opción es verificar directamente desde EAS:

```bash
cd mobile
eas credentials
```

Sigue estos pasos:
1. Selecciona **Android**
2. Selecciona **View credentials** (Ver credenciales)
3. Ahí verás información sobre el keystore actual
4. También puedes ver si hay múltiples keystores guardados

### Opción 2: Ver SHA1 desde Google Play Console

Puedes ver el SHA1 esperado directamente desde Google Play:

1. Ve a [Google Play Console](https://play.google.com/console)
2. Selecciona tu app
3. Ve a **Configuración de la app** > **Integridad de la app**
4. Ahí verás el SHA1 del certificado que se espera

El SHA1 correcto que necesitas es: `AB:D6:A8:1B:CC:64:CF:2D:A1:0B:66:CD:BF:3C:F7:42:3C:53:89:E5`

### Opción 3: Probar Diferentes Aliases

El alias que encontramos es `527d7a6ec1a63abd37b1ad3cd6b8407e`, pero prueba también:

```bash
# Script de diagnóstico
./scripts/diagnosticar_keystore.sh temp_keystores/@ecampazzo__handson-app.jks

# Probar diferentes aliases manualmente
./scripts/verificar_sha1_keystore.sh temp_keystores/@ecampazzo__handson-app.jks upload
./scripts/verificar_sha1_keystore.sh temp_keystores/@ecampazzo__handson-app.jks key0
./scripts/verificar_sha1_keystore.sh temp_keystores/@ecampazzo__handson-app.jks 527d7a6ec1a63abd37b1ad3cd6b8407e
```

### Opción 4: Verificar desde el APK/Bundle Publicado

Si ya tienes un APK o AAB publicado, puedes extraer el SHA1 de ahí:

```bash
# Para un APK
keytool -printcert -jarfile ruta/al/app.apk | grep SHA1

# Para un AAB (requiere bundletool)
# Descarga bundletool de: https://github.com/google/bundletool/releases
bundletool dump manifest --bundle=app.aab
```

### Opción 5: Contactar a EAS Support

Si no puedes acceder al keystore y no recuerdas la contraseña:

1. Ve a [Expo Support](https://expo.dev/support)
2. Explica que necesitas recuperar información sobre tu keystore
3. Proporciona tu cuenta de EAS y el nombre del proyecto

**Nota**: EAS no permite descargar el keystore por seguridad, pero pueden ayudarte a verificar qué keystore está configurado actualmente.

## 🎯 Recomendación

**La opción más sencilla es verificar desde EAS directamente:**

```bash
cd mobile
eas credentials
```

Luego selecciona **View credentials** > **Android** para ver información sobre el keystore actualmente configurado.

## 📝 Una vez Identificado el Keystore Correcto

Una vez que sepas cuál keystore tiene el SHA1 correcto (`AB:D6:A8:1B:CC:64:CF:2D:A1:0B:66:CD:BF:3C:F7:42:3C:53:89:E5`):

1. **Si está en EAS y es el incorrecto**: Necesitas subir el keystore correcto
2. **Si está en `temp_keystores/`**: Súbelo a EAS usando `eas credentials`

Lee `temp_keystores/README.md` para más información sobre cómo subir el keystore a EAS.
