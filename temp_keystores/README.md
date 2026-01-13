# Keystores Recuperados

Esta carpeta contiene los keystores de Android encontrados en el proyecto.

## 📁 Archivos Disponibles

1. **`@ecampazzo__handson-app.jks`** - Keystore actual de EAS
2. **`@ecampazzo__handson-app_OLD_1.jks`** - Keystore anterior/backup
3. **`debug.keystore`** - Keystore de debug (solo para desarrollo)

## 🔍 Cómo Identificar el Keystore Correcto (Anterior)

El keystore **CORRECTO** debe tener el SHA1: `AB:D6:A8:1B:CC:64:CF:2D:A1:0B:66:CD:BF:3C:F7:42:3C:53:89:E5`

### Paso 1: Verificar el SHA1 de cada keystore

Para los keystores de EAS, el alias generalmente es el nombre del archivo sin la extensión.

```bash
# Verificar el keystore actual
cd /Users/ecampazzo/Documents/Dev/handsOnProject
./scripts/verificar_sha1_keystore.sh temp_keystores/@ecampazzo__handson-app.jks @ecampazzo__handson-app

# Verificar el keystore anterior/backup
./scripts/verificar_sha1_keystore.sh temp_keystores/@ecampazzo__handson-app_OLD_1.jks @ecampazzo__handson-app_OLD_1
```

Si el alias es diferente, puedes probar también:
- `my-key-alias`
- `upload`
- El nombre del proyecto sin el prefijo

### Paso 2: Identificar cuál tiene el SHA1 correcto

El script te dirá cuál keystore tiene el SHA1 correcto. Ese es el keystore anterior que debes usar.

## 📝 Cómo Usar el Keystore Anterior

Una vez identificado el keystore correcto, tienes dos opciones:

### Opción A: Subirlo a EAS (Recomendado)

1. **Copia el keystore a una ubicación accesible:**
   ```bash
   cp temp_keystores/[NOMBRE_DEL_KEYSTORE_CORRECTO].jks ~/Desktop/
   ```

2. **Sube el keystore a EAS:**
   ```bash
   cd mobile
   eas credentials
   ```

3. **Sigue las instrucciones:**
   - Selecciona: **Android**
   - Selecciona: **Keystore: Upload existing keystore**
   - Proporciona la ruta al keystore
   - Proporciona el alias (el nombre sin extensión)
   - Proporciona la contraseña del keystore

### Opción B: Usarlo Localmente (No recomendado para EAS)

Si prefieres usarlo localmente, cópialo a `mobile/android/app/`:

```bash
cp temp_keystores/[NOMBRE_DEL_KEYSTORE_CORRECTO].jks mobile/android/app/my-release-key.keystore
```

Luego configura `mobile/android/gradle.properties`:

```properties
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=[alias-del-keystore]
MYAPP_RELEASE_STORE_PASSWORD=[contraseña]
MYAPP_RELEASE_KEY_PASSWORD=[contraseña]
```

## ⚠️ Importante

- **NUNCA** subas los keystores a Git
- **SIEMPRE** guarda una copia de seguridad en un lugar seguro
- Si no tienes la contraseña del keystore, no podrás usarlo

## 🔑 Contraseñas

Si no recuerdas la contraseña del keystore:
- Busca en tu gestor de contraseñas
- Revisa documentación del proyecto
- Si usaste EAS, la contraseña puede estar en las credenciales de EAS (pero EAS no permite descargarla)
