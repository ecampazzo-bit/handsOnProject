# 🔧 Cómo Configurar EAS Credentials con un Keystore .jks Específico

Esta guía te muestra cómo hacer que EAS credentials use un archivo `.jks` específico para firmar tus builds de Android.

## 📋 Prerrequisitos

Antes de comenzar, asegúrate de tener:

- ✅ El archivo `.jks` que quieres usar
- ✅ El **alias** de la clave dentro del keystore
- ✅ La **contraseña del keystore**
- ✅ La **contraseña de la clave** (puede ser la misma que la del keystore)
- ✅ EAS CLI instalado: `npm install -g eas-cli`
- ✅ Estar autenticado en EAS: `eas login`

## 🔍 Paso 1: Verificar el SHA1 del Keystore (Opcional pero Recomendado)

Antes de subir el keystore, verifica que tenga el SHA1 correcto:

```bash
cd /Users/ecampazzo/Documents/Dev/handsOnProject

# Verificar el keystore que quieres usar
./scripts/verificar_sha1_keystore.sh temp_keystores/@ecampazzo__handson-app_OLD_1.jks [alias]
```

**SHA1 esperado (correcto)**: `AB:D6:A8:1B:CC:64:CF:2D:A1:0B:66:CD:BF:3C:F7:42:3C:53:89:E5`

Si el keystore tiene este SHA1, es el correcto y puedes proceder.

### Si no conoces el alias

Los keystores de EAS suelen usar estos aliases comunes:
- El nombre del archivo sin extensión (ej: `@ecampazzo__handson-app_OLD_1`)
- `upload`
- `key0`
- `my-key-alias`

Puedes intentar verificar con diferentes aliases hasta encontrar el correcto.

## 📤 Paso 2: Subir el Keystore a EAS

### Opción A: Usando el Comando Interactivo (Recomendado)

1. **Navega al directorio del proyecto mobile:**

```bash
cd /Users/ecampazzo/Documents/Dev/handsOnProject/mobile
```

2. **Inicia el comando de credenciales:**

```bash
eas credentials
```

3. **Sigue el flujo interactivo:**

```
? What platform are you configuring credentials for? › Android
```

Selecciona: **Android**

```
? What project are you configuring credentials for? › handson-app
```

Selecciona tu proyecto (probablemente `handson-app`)

```
? What would you like to do? › 
❯ Update credentials
  View credentials
  Remove credentials
```

Selecciona: **Update credentials**

```
? How would you like to set up your Android keystore? › 
❯ Upload existing keystore
  Generate new keystore
```

Selecciona: **Upload existing keystore**

4. **Proporciona la información del keystore:**

```
? Path to the keystore file: › 
```

Ingresa la ruta completa al archivo `.jks`:
```
/Users/ecampazzo/Documents/Dev/handsOnProject/temp_keystores/@ecampazzo__handson-app_OLD_1.jks
```

O si prefieres usar una ruta relativa desde el directorio `mobile`:
```
../temp_keystores/@ecampazzo__handson-app_OLD_1.jks
```

```
? Keystore alias: › 
```

Ingresa el alias de la clave. Prueba con:
- `@ecampazzo__handson-app_OLD_1`
- `527d7a6ec1a63abd37b1ad3cd6b8407e` (si ese es el alias que encontraste)
- `upload`
- `my-key-alias`

```
? Keystore password: › 
```

Ingresa la contraseña del keystore.

```
? Key password (leave blank if same as keystore password): › 
```

Si la contraseña de la clave es diferente, ingrésala. Si es la misma, deja en blanco y presiona Enter.

5. **Confirmación:**

EAS te mostrará un resumen y te pedirá confirmación. Revisa la información y confirma.

### Opción B: Usando Variables de Entorno (Avanzado)

Si prefieres no usar el flujo interactivo, puedes configurar las credenciales usando variables de entorno, pero **EAS no soporta esto directamente**. Debes usar el flujo interactivo o la API de EAS.

## ✅ Paso 3: Verificar que el Keystore se Configuró Correctamente

Después de subir el keystore, verifica que EAS lo esté usando:

```bash
cd mobile
eas credentials
```

Selecciona:
- **Android**
- **handson-app**
- **View credentials**

Esto te mostrará información sobre el keystore actualmente configurado. Verifica que el SHA1 coincida con el esperado.

## 🧪 Paso 4: Probar con un Build

Genera un build de prueba para verificar que todo funciona:

```bash
cd mobile
eas build --platform android --profile production --local
```

O si prefieres un build en la nube:

```bash
cd mobile
eas build --platform android --profile production
```

**Nota**: El flag `--local` construye en tu máquina (más rápido para pruebas), sin `--local` construye en los servidores de EAS.

## 🔍 Verificar el SHA1 del Build Generado

Después de generar el build, verifica que el SHA1 del AAB sea el correcto:

```bash
# Si construiste localmente, el AAB estará en:
# mobile/build-*.aab

# Verificar el SHA1 del AAB
keytool -printcert -jarfile mobile/build-*.aab | grep SHA1
```

O usando `apksigner`:

```bash
apksigner verify --print-certs mobile/build-*.aab | grep SHA1
```

El SHA1 debe ser: `AB:D6:A8:1B:CC:64:CF:2D:A1:0B:66:CD:BF:3C:F7:42:3C:53:89:E5`

## 🚨 Solución de Problemas

### Error: "Keystore file not found"

**Causa**: La ruta al archivo `.jks` es incorrecta.

**Solución**: 
- Usa la ruta absoluta completa: `/Users/ecampazzo/Documents/Dev/handsOnProject/temp_keystores/@ecampazzo__handson-app_OLD_1.jks`
- O asegúrate de que la ruta relativa sea correcta desde el directorio `mobile`

### Error: "Invalid keystore password"

**Causa**: La contraseña del keystore es incorrecta.

**Solución**:
- Verifica la contraseña en tu gestor de contraseñas
- Si no la recuerdas, no podrás usar ese keystore
- Si el keystore fue generado por EAS anteriormente, la contraseña puede estar en las credenciales de EAS (pero EAS no permite descargarla)

### Error: "Alias not found"

**Causa**: El alias proporcionado no existe en el keystore.

**Solución**:
- Lista los aliases del keystore:
  ```bash
  keytool -list -v -keystore temp_keystores/@ecampazzo__handson-app_OLD_1.jks
  ```
- Usa el alias correcto que aparezca en la lista

### Error: "SHA1 does not match"

**Causa**: El keystore subido no tiene el SHA1 correcto.

**Solución**:
- Verifica el SHA1 del keystore antes de subirlo
- Asegúrate de estar usando el keystore correcto (el anterior, no uno nuevo)

## 📝 Notas Importantes

1. **EAS no permite descargar el keystore** una vez subido por razones de seguridad
2. **Guarda una copia de seguridad** del keystore en un lugar seguro antes de subirlo
3. **Nunca subas el keystore a Git** - ya está en `.gitignore`
4. **Si pierdes el keystore**, no podrás actualizar tu app en Google Play Store
5. **El keystore debe tener el SHA1 correcto** para poder actualizar la app existente

## 🎯 Resumen de Comandos

```bash
# 1. Verificar SHA1 del keystore
cd /Users/ecampazzo/Documents/Dev/handsOnProject
./scripts/verificar_sha1_keystore.sh temp_keystores/@ecampazzo__handson-app_OLD_1.jks [alias]

# 2. Subir keystore a EAS
cd mobile
eas credentials
# Sigue el flujo interactivo

# 3. Verificar credenciales configuradas
eas credentials
# Selecciona: View credentials

# 4. Generar build de prueba
eas build --platform android --profile production --local

# 5. Verificar SHA1 del build
keytool -printcert -jarfile mobile/build-*.aab | grep SHA1
```

## 📚 Recursos Adicionales

- [Documentación de EAS sobre Credenciales](https://docs.expo.dev/build/signing/)
- [Documentación de Android sobre Firma de Apps](https://developer.android.com/studio/publish/app-signing)
- [Google Play App Signing](https://support.google.com/googleplay/android-developer/answer/9842756)

---

**¿Necesitas ayuda?** Si tienes problemas, verifica:
- ✅ Que el archivo `.jks` existe y es válido
- ✅ Que conoces el alias correcto
- ✅ Que conoces la contraseña del keystore
- ✅ Que el SHA1 del keystore es el correcto
