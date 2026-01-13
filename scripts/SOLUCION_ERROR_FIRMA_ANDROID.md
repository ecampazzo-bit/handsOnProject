# Solución: Error de Firma de Android App Bundle

## 🔴 Error

```
Tu Android App Bundle está firmado con la clave incorrecta. 
Asegúrate de que esté firmado con la clave de firma correcta e inténtalo de nuevo.

Tu app bundle debería estar firmado con un certificado que tiene la huella digital
SHA1: AB:D6:A8:1B:CC:64:CF:2D:A1:0B:66:CD:BF:3C:F7:42:3C:53:89:E5

Pero el certificado que se ha usado para firmar el app bundle que has subido tiene la huella digital
SHA1: 44:C5:11:9F:F1:A6:3E:A6:4F:A6:5C:F2:25:83:4E:0B:B0:0D:D9:58
```

## 📋 Información Clave

- **SHA1 Esperado (correcto)**: `AB:D6:A8:1B:CC:64:CF:2D:A1:0B:66:CD:BF:3C:F7:42:3C:53:89:E5`
- **SHA1 Actual (incorrecto)**: `44:C5:11:9F:F1:A6:3E:A6:4F:A6:5C:F2:25:83:4E:0B:B0:0D:D9:58`

⚠️ **Nota**: Este SHA1 incorrecto es diferente al anterior, lo que indica que EAS generó un nuevo keystore. Necesitas usar el keystore original con el SHA1 correcto.

## 🔍 Causa del Problema

Estás usando **EAS Build** (Expo Application Services) y el keystore que EAS está usando para firmar tu app es diferente al keystore que se usó para la primera versión publicada en Google Play Store.

**Posibles causas:**
1. Se generó un nuevo keystore en EAS en lugar de usar el original
2. Las credenciales de EAS se perdieron o se regeneraron
3. Se está usando un perfil de build diferente que usa otro keystore

## ✅ Soluciones

### Solución 1: Verificar y Usar el Keystore Correcto en EAS (Recomendado)

Si ya tienes un keystore guardado en EAS, necesitas asegurarte de que sea el correcto.

#### Paso 1: Verificar las Credenciales en EAS

```bash
cd mobile
eas credentials
```

Selecciona:
- **Platform**: Android
- **Project**: handson-app
- **Action**: View credentials

Esto te mostrará información sobre el keystore actual.

#### Paso 2: Verificar el SHA1 del Keystore en EAS

Si EAS te permite ver el keystore, verifica su SHA1:

```bash
# Si puedes descargar el keystore temporalmente (solo para verificar)
# EAS no permite descargar el keystore directamente por seguridad
# Pero puedes verificar el SHA1 en la información de credenciales
```

#### Paso 3: Si el SHA1 no coincide

Si el SHA1 del keystore en EAS no es `AB:D6:A8:1B:CC:64:CF:2D:A1:0B:66:CD:BF:3C:F7:42:3C:53:89:E5`, entonces:

**Opción A: Si tienes el keystore original guardado localmente**

1. **Sube el keystore original a EAS:**

```bash
cd mobile
eas credentials
```

Selecciona:
- **Platform**: Android
- **Project**: handson-app
- **Action**: Update credentials
- **Keystore**: Upload existing keystore

Necesitarás:
- El archivo `.keystore` o `.jks` original
- El alias de la clave
- La contraseña del keystore
- La contraseña de la clave

2. **Verifica que el SHA1 coincida:**

Después de subir, verifica que el SHA1 sea el correcto.

**Opción B: Si NO tienes el keystore original**

⚠️ **PROBLEMA CRÍTICO**: Si perdiste el keystore original, no podrás actualizar la app existente en Google Play Store.

**Opciones disponibles:**

1. **Usar Google Play App Signing (Recomendado)**
   - Google Play puede manejar la firma por ti
   - Necesitas contactar a Google Play Support para migrar a App Signing
   - Esto permite que Google Play firme automáticamente tus actualizaciones

2. **Publicar como nueva app**
   - ⚠️ Los usuarios tendrán que desinstalar la versión anterior
   - ⚠️ Perderás todas las reseñas y estadísticas
   - ⚠️ No es recomendado

---

### Solución 2: Verificar si Estás Usando Google Play App Signing

Si tu app ya está configurada con **Google Play App Signing**, Google Play puede estar usando una clave de firma diferente.

#### Verificar en Google Play Console:

1. Ve a **Google Play Console** → Tu app → **Configuración** → **Integridad de la app**
2. Busca la sección **"Firma de la app"** o **"App signing"**
3. Verifica si está habilitado **"Google Play App Signing"**

Si está habilitado:
- Google Play usa su propia clave para firmar las actualizaciones
- El SHA1 que ves en el error puede ser de la clave de carga (upload key), no de la clave de firma final
- Necesitas verificar la **"Upload key certificate"** en lugar de la clave de firma final

#### Verificar el SHA1 de la Upload Key:

1. En Google Play Console → **Configuración** → **Integridad de la app**
2. Busca **"Upload key certificate"**
3. Verifica que el SHA1 coincida con el que estás usando en EAS

---

### Solución 3: Configurar el Keystore Correcto en EAS

Si tienes el keystore original, sigue estos pasos:

#### Paso 1: Preparar el Keystore

Asegúrate de tener:
- El archivo `.keystore` o `.jks`
- El alias de la clave
- La contraseña del keystore
- La contraseña de la clave

#### Paso 2: Subir el Keystore a EAS

```bash
cd mobile
eas credentials
```

Flujo:
1. Selecciona **Android**
2. Selecciona **handson-app**
3. Selecciona **Update credentials** o **Set up credentials**
4. Selecciona **Keystore: Upload existing keystore**
5. Proporciona:
   - Ruta al archivo keystore
   - Alias de la clave
   - Contraseña del keystore
   - Contraseña de la clave

#### Paso 3: Verificar el SHA1

Después de subir, puedes verificar el SHA1 del keystore:

```bash
# Si tienes el keystore localmente, verifica su SHA1:
keytool -list -v -keystore tu-keystore.keystore -alias tu-alias
```

Busca la línea que dice:
```
SHA1: AB:D6:A8:1B:CC:64:CF:2D:A1:0B:66:CD:BF:3C:F7:42:3C:53:89:E5
```

#### Paso 4: Generar Nuevo Build

```bash
cd mobile
eas build --platform android --profile production
```

---

### Solución 4: Si Perdiste el Keystore Original

Si perdiste el keystore original y no puedes recuperarlo:

#### Opción A: Contactar a Google Play Support

1. Ve a **Google Play Console** → **Ayuda** → **Contactar con el equipo de Play Console**
2. Explica que perdiste el keystore original
3. Pregunta si pueden:
   - Migrar tu app a Google Play App Signing
   - O ayudarte a recuperar/restaurar el keystore

#### Opción B: Verificar si Tienes Backup

Busca en:
- Tu computadora (carpetas de backup)
- Servicios de backup (Dropbox, Google Drive, iCloud, etc.)
- Documentación del proyecto
- Notas o archivos de configuración

#### Opción C: Verificar si EAS Tiene el Keystore Original

Es posible que EAS tenga guardado el keystore original si lo generaste con EAS la primera vez:

```bash
cd mobile
eas credentials
```

Revisa si hay múltiples credenciales guardadas y verifica cuál tiene el SHA1 correcto.

**⚠️ IMPORTANTE**: EAS **NO mantiene un historial** de credenciales anteriores. Si las credenciales se regeneraron, **NO puedes recuperar las anteriores desde EAS** por razones de seguridad.

---

### Solución 5: ¿Se Pueden Recuperar Credenciales Regeneradas en EAS?

**Respuesta corta: NO, EAS no permite recuperar credenciales anteriores una vez que se regeneran.**

#### ¿Por qué EAS no guarda credenciales anteriores?

Por razones de seguridad, EAS:
- **NO mantiene un historial** de credenciales anteriores
- **NO permite descargar** el keystore una vez subido (solo puedes actualizarlo)
- **NO puede recuperar** credenciales que fueron regeneradas o eliminadas

#### ¿Qué puedes hacer si se regeneraron las credenciales?

**Opción 1: Si tienes el keystore original guardado localmente** ✅ (RECOMENDADO)

1. Verifica que el keystore tenga el SHA1 correcto:
   ```bash
   ./scripts/verificar_sha1_keystore.sh [ruta-al-keystore] [alias]
   ```

2. Sube el keystore original a EAS:
   ```bash
   cd mobile
   eas credentials
   ```
   - Selecciona: **Android** → **handson-app** → **Update credentials**
   - Selecciona: **Upload existing keystore**
   - Proporciona el keystore original con el SHA1 correcto

3. Verifica que EAS ahora use el keystore correcto

**Opción 2: Buscar el keystore original en backups** 🔍

Ejecuta el script de búsqueda:
```bash
./scripts/buscar_keystores.sh
```

Busca en:
- Tu computadora (carpetas de backup)
- Servicios de backup (Google Drive, Dropbox, iCloud, etc.)
- Correos electrónicos antiguos (si te lo enviaste a ti mismo)
- Documentación del proyecto
- Otras computadoras donde hayas trabajado

**Opción 3: Verificar keystores en temp_keystores** 📁

Si tienes keystores en `temp_keystores/`, verifica cada uno:

```bash
# Verificar cada keystore encontrado
./scripts/verificar_sha1_keystore.sh temp_keystores/app-release-key.keystore [alias]
./scripts/verificar_sha1_keystore.sh temp_keystores/my-release-key.keystore [alias]
./scripts/verificar_sha1_keystore.sh temp_keystores/release.keystore [alias]
```

**Opción 4: Si NO tienes el keystore original** ❌

Si perdiste completamente el keystore original:

1. **Contacta a Google Play Support** (ÚNICA OPCIÓN REAL):
   - Ve a **Google Play Console** → **Ayuda** → **Contactar con el equipo de Play Console**
   - Explica que perdiste el keystore original
   - Pregunta si pueden migrar tu app a **Google Play App Signing**
   - Con Google Play App Signing, Google maneja la firma y puedes usar una nueva upload key

2. **Publicar como nueva app** (NO RECOMENDADO):
   - ⚠️ Los usuarios tendrán que desinstalar la versión anterior
   - ⚠️ Perderás todas las reseñas, estadísticas y usuarios
   - ⚠️ No es una solución viable para apps en producción

#### Prevención para el futuro

Para evitar este problema en el futuro:

1. **Guarda el keystore original en un lugar seguro**:
   - Servicio de backup seguro (1Password, Bitwarden, etc.)
   - Almacenamiento encriptado
   - Múltiples copias en diferentes ubicaciones

2. **Usa Google Play App Signing**:
   - Permite que Google maneje la firma principal
   - Solo necesitas guardar la "upload key"
   - Si pierdes la upload key, Google puede ayudarte a generar una nueva

3. **Documenta la información del keystore**:
   - Alias de la clave
   - SHA1 del certificado
   - Fecha de creación
   - Ubicación del backup

---

## 🔧 Comandos Útiles

### Verificar SHA1 de un Keystore Local

```bash
keytool -list -v -keystore ruta/al/keystore.keystore -alias nombre-del-alias
```

Busca la línea:
```
SHA1: AB:D6:A8:1B:CC:64:CF:2D:A1:0B:66:CD:BF:3C:F7:42:3C:53:89:E5
```

### Verificar SHA1 de un AAB Firmado

```bash
# Instalar jarsigner si no lo tienes (viene con Java JDK)
jarsigner -verify -verbose -certs app-release.aab
```

O usar `apksigner`:

```bash
apksigner verify --print-certs app-release.aab
```

### Verificar Credenciales en EAS

```bash
cd mobile
eas credentials
```

### Listar Todos los Builds en EAS

```bash
cd mobile
eas build:list
```

---

## 📝 Checklist de Verificación

Antes de generar un nuevo build, verifica:

- [ ] ¿Tienes el keystore original guardado?
- [ ] ¿El SHA1 del keystore coincide con `AB:D6:A8:1B:CC:64:CF:2D:A1:0B:66:CD:BF:3C:F7:42:3C:53:89:E5`?
- [ ] ¿El keystore está correctamente configurado en EAS?
- [ ] ¿Estás usando el perfil de build correcto (`production`)?
- [ ] ¿Verificaste si tu app usa Google Play App Signing?

---

## 🚨 Importante

**NUNCA compartas o subas tu keystore a repositorios públicos.** El keystore debe mantenerse privado y seguro.

**Si perdiste el keystore original:**
- No podrás actualizar la app existente en Google Play Store
- Los usuarios tendrán que desinstalar e instalar de nuevo
- Considera usar Google Play App Signing para evitar este problema en el futuro

---

## 📚 Recursos Adicionales

- [Documentación de EAS sobre Credenciales](https://docs.expo.dev/build/signing/)
- [Google Play App Signing](https://support.google.com/googleplay/android-developer/answer/9842756)
- [Documentación de Android sobre Firma de Apps](https://developer.android.com/studio/publish/app-signing)

---

## 🎯 Próximos Pasos

1. **Verifica tus credenciales en EAS**: `eas credentials`
2. **Si tienes el keystore original**: Súbelo a EAS
3. **Si no lo tienes**: Contacta a Google Play Support
4. **Genera un nuevo build**: `eas build --platform android --profile production`
5. **Verifica el SHA1 del nuevo AAB** antes de subirlo

---

**¿Necesitas ayuda específica?** Comparte:
- Si tienes el keystore original guardado
- Si usas Google Play App Signing
- El resultado de `eas credentials`
