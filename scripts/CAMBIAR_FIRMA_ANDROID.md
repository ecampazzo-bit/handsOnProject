# Guía para Cambiar la Firma de la App Android

## ⚠️ IMPORTANTE

**Cambiar la firma de una app Android tiene consecuencias importantes:**

1. **No podrás actualizar apps existentes** en Google Play Store que fueron firmadas con el keystore anterior
2. **Los usuarios tendrán que desinstalar** la app anterior e instalar la nueva versión
3. **Se perderán datos locales** de los usuarios (a menos que uses backup/restore)
4. **Las notificaciones push pueden dejar de funcionar** si están vinculadas al package name y firma

**Solo haz esto si:**
- Es una app nueva que aún no está publicada
- Perdiste el keystore anterior y no puedes recuperarlo
- Es absolutamente necesario por razones de seguridad

## Pasos para Cambiar el Keystore

### 1. Generar un Nuevo Keystore

Ejecuta el siguiente comando en la terminal (desde la carpeta `mobile/android/app`):

```bash
cd mobile/android/app
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key-new.keystore -alias my-key-alias-new -keyalg RSA -keysize 2048 -validity 10000
```

**Parámetros importantes:**
- `-keystore`: Nombre del archivo keystore (cámbialo si quieres otro nombre)
- `-alias`: Alias de la clave (cámbialo si quieres otro alias)
- `-validity`: Días de validez (10000 = ~27 años)
- `-keysize`: Tamaño de la clave RSA (2048 es el mínimo recomendado)

**Te pedirá:**
- Contraseña del keystore (guárdala en un lugar seguro)
- Información personal (nombre, organización, etc.)
- Contraseña del alias (puede ser la misma que el keystore)

### 2. Actualizar gradle.properties

Edita el archivo `mobile/android/gradle.properties` y actualiza las siguientes propiedades:

```properties
MYAPP_RELEASE_STORE_FILE=my-release-key-new.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias-new
MYAPP_RELEASE_STORE_PASSWORD=tu_contraseña_del_keystore
MYAPP_RELEASE_KEY_PASSWORD=tu_contraseña_del_alias
```

**⚠️ IMPORTANTE:** 
- Reemplaza `tu_contraseña_del_keystore` y `tu_contraseña_del_alias` con las contraseñas reales
- El archivo `gradle.properties` puede estar en `.gitignore`, pero si no, **NO lo subas a Git** con las contraseñas
- Considera usar variables de entorno o un archivo local separado para mayor seguridad

### 3. Verificar que el Keystore Está Configurado Correctamente

Verifica que el archivo `build.gradle` tenga la configuración correcta (ya está actualizado):

```gradle
signingConfigs {
    release {
        if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
            storeFile file(MYAPP_RELEASE_STORE_FILE)
            storePassword MYAPP_RELEASE_STORE_PASSWORD
            keyAlias MYAPP_RELEASE_KEY_ALIAS
            keyPassword MYAPP_RELEASE_KEY_PASSWORD
        }
    }
}
```

Y que el `buildType` release use el signing config:

```gradle
release {
    signingConfig signingConfigs.release
    // ... otras configuraciones
}
```

### 4. Probar la Nueva Firma

Genera un APK de prueba para verificar que la firma funciona:

```bash
cd mobile/android
./gradlew assembleRelease
```

El APK se generará en: `mobile/android/app/build/outputs/apk/release/app-release.apk`

### 5. Verificar la Firma del APK

Puedes verificar la firma del APK generado con:

```bash
# Ver información del APK
aapt dump badging app-release.apk

# Ver la firma (requiere jarsigner)
jarsigner -verify -verbose -certs app-release.apk
```

### 6. Backup del Keystore Anterior (Opcional pero Recomendado)

Si aún tienes el keystore anterior, haz un backup antes de eliminarlo:

```bash
# Backup del keystore anterior
cp mobile/android/app/my-release-key.keystore mobile/android/app/my-release-key.keystore.backup
```

### 7. Limpiar y Reconstruir

Después de cambiar el keystore, limpia el proyecto:

```bash
cd mobile/android
./gradlew clean
./gradlew assembleRelease
```

## Alternativa: Usar Variables de Entorno (Más Seguro)

En lugar de poner las contraseñas en `gradle.properties`, puedes usar variables de entorno:

### 1. Actualizar build.gradle

```gradle
signingConfigs {
    release {
        def keystoreFile = System.getenv("MYAPP_RELEASE_STORE_FILE") ?: MYAPP_RELEASE_STORE_FILE
        def keystorePassword = System.getenv("MYAPP_RELEASE_STORE_PASSWORD") ?: MYAPP_RELEASE_STORE_PASSWORD
        def keyAlias = System.getenv("MYAPP_RELEASE_KEY_ALIAS") ?: MYAPP_RELEASE_KEY_ALIAS
        def keyPassword = System.getenv("MYAPP_RELEASE_KEY_PASSWORD") ?: MYAPP_RELEASE_KEY_PASSWORD
        
        if (keystoreFile) {
            storeFile file(keystoreFile)
            storePassword keystorePassword
            keyAlias keyAlias
            keyPassword keyPassword
        }
    }
}
```

### 2. Configurar Variables de Entorno

En tu shell (`.zshrc`, `.bashrc`, etc.):

```bash
export MYAPP_RELEASE_STORE_FILE="my-release-key-new.keystore"
export MYAPP_RELEASE_KEY_ALIAS="my-key-alias-new"
export MYAPP_RELEASE_STORE_PASSWORD="tu_contraseña"
export MYAPP_RELEASE_KEY_PASSWORD="tu_contraseña"
```

## Comandos Útiles

### Ver información del keystore

```bash
keytool -list -v -keystore my-release-key.keystore
```

### Cambiar la contraseña del keystore

```bash
keytool -storepasswd -keystore my-release-key.keystore
```

### Cambiar la contraseña del alias

```bash
keytool -keypasswd -keystore my-release-key.keystore -alias my-key-alias
```

### Exportar el certificado

```bash
keytool -export -rfc -keystore my-release-key.keystore -alias my-key-alias -file certificado.pem
```

## Notas Adicionales

1. **Backup del Keystore:** Guarda el keystore en un lugar seguro (nube encriptada, USB, etc.). Si lo pierdes, no podrás actualizar tu app en Google Play.

2. **Google Play App Signing:** Si usas Google Play App Signing, Google puede ayudarte a recuperar la firma en algunos casos, pero no siempre.

3. **CI/CD:** Si usas CI/CD, asegúrate de configurar las variables de entorno o usar secretos del sistema de CI.

4. **Versionado:** Después de cambiar el keystore, considera incrementar el `versionCode` en `build.gradle`.

## Troubleshooting

### Error: "Keystore file not found"
- Verifica que el archivo existe en `mobile/android/app/`
- Verifica que la ruta en `gradle.properties` es correcta

### Error: "Password was incorrect"
- Verifica las contraseñas en `gradle.properties`
- Asegúrate de que no hay espacios extra al inicio/final

### Error: "Alias does not exist"
- Verifica que el alias en `gradle.properties` coincide con el alias usado al crear el keystore
- Lista los aliases: `keytool -list -keystore my-release-key.keystore`
