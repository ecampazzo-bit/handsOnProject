# Solución: Error de Contraseña del Keystore

## Problema

Error al acceder al keystore:
```
error de herramienta de claves: java.io.IOException: keystore password was incorrect
```

## Soluciones

### Opción 1: Crear un Nuevo Keystore (Recomendado si olvidaste la contraseña)

Si olvidaste la contraseña del keystore actual, la única solución es crear uno nuevo.

#### Método A: Usar el Script Automatizado

```bash
cd /Users/ecampazzo/Documents/Dev/handsOnProject
./scripts/generar_nuevo_keystore.sh
```

#### Método B: Comando Manual

```bash
cd mobile/android/app
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key-new.keystore -alias my-key-alias-new -keyalg RSA -keysize 2048 -validity 10000
```

**Durante la ejecución te pedirá:**
1. Contraseña del keystore (guárdala bien)
2. Confirmar contraseña
3. Información personal (nombre, organización, etc.)
4. Contraseña del alias (puede ser la misma que el keystore)

### Opción 2: Verificar la Contraseña Actual

Si crees que conoces la contraseña pero no funciona, intenta:

```bash
cd mobile/android/app
keytool -list -v -keystore my-release-key.keystore -alias my-key-alias
```

Si funciona, la contraseña es correcta. Si no, necesitas crear un nuevo keystore.

### Opción 3: Cambiar la Contraseña (Si conoces la actual)

Si conoces la contraseña actual pero quieres cambiarla:

```bash
cd mobile/android/app
# Cambiar contraseña del keystore
keytool -storepasswd -keystore my-release-key.keystore

# Cambiar contraseña del alias
keytool -keypasswd -keystore my-release-key.keystore -alias my-key-alias
```

## Después de Crear el Nuevo Keystore

### 1. Actualizar gradle.properties

Edita `mobile/android/gradle.properties` y actualiza:

```properties
MYAPP_RELEASE_STORE_FILE=my-release-key-new.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias-new
MYAPP_RELEASE_STORE_PASSWORD=tu_contraseña_real_aquí
MYAPP_RELEASE_KEY_PASSWORD=tu_contraseña_real_aquí
```

### 2. (Opcional) Renombrar el Keystore

Si quieres usar el mismo nombre que antes:

```bash
cd mobile/android/app
# Backup del anterior
mv my-release-key.keystore my-release-key.keystore.backup
# Renombrar el nuevo
mv my-release-key-new.keystore my-release-key.keystore
```

Y actualiza `gradle.properties`:
```properties
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias-new
```

### 3. Probar la Nueva Firma

```bash
cd mobile/android
./gradlew clean
./gradlew assembleRelease
```

### 4. Verificar la Firma

```bash
cd mobile/android/app/build/outputs/apk/release
jarsigner -verify -verbose -certs app-release.apk
```

## Comandos Útiles

### Ver información del keystore (sin contraseña)
```bash
keytool -list -keystore my-release-key.keystore
# Te pedirá la contraseña, pero puedes cancelar con Ctrl+C
```

### Ver información detallada
```bash
keytool -list -v -keystore my-release-key.keystore -alias my-key-alias
```

### Exportar certificado
```bash
keytool -export -rfc -keystore my-release-key.keystore -alias my-key-alias -file certificado.pem
```

## ⚠️ Advertencias Importantes

1. **Si la app ya está publicada en Google Play:**
   - NO cambies el keystore a menos que sea absolutamente necesario
   - Los usuarios tendrán que desinstalar e instalar de nuevo
   - Se perderán datos locales

2. **Backup del Keystore:**
   - Guarda el nuevo keystore en un lugar seguro
   - Si lo pierdes, no podrás actualizar tu app en Google Play
   - Considera usar Google Play App Signing para mayor seguridad

3. **Seguridad:**
   - No subas `gradle.properties` con contraseñas a Git
   - Usa variables de entorno en CI/CD
   - Guarda las contraseñas en un gestor de contraseñas

## Troubleshooting

### "Keystore file not found"
- Verifica que el archivo existe en `mobile/android/app/`
- Verifica la ruta en `gradle.properties`

### "Alias does not exist"
- Lista los aliases: `keytool -list -keystore my-release-key.keystore`
- Verifica que el alias en `gradle.properties` coincide

### "Password was incorrect"
- Verifica que no hay espacios extra en `gradle.properties`
- Asegúrate de usar la contraseña correcta
- Si no la recuerdas, crea un nuevo keystore
