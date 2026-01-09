# 🍎 Cómo Generar un Nuevo Apple Provisioning Profile

## 📋 Información General

EAS Build puede generar automáticamente los provisioning profiles para iOS, pero a veces necesitas generarlos o actualizarlos manualmente.

## ✅ Opción 1: EAS Genera Automáticamente (Recomendado)

EAS puede generar automáticamente el provisioning profile cuando generas un build. Esto es lo más fácil:

### Paso 1: Configurar Credenciales en EAS

```bash
cd mobile
eas credentials
```

### Paso 2: Seleccionar iOS

Cuando EAS te pregunte:
- **Platform**: iOS
- **Project**: handson-app
- **Action**: Set up credentials (o Update credentials)

### Paso 3: Dejar que EAS Genere el Profile

EAS te preguntará:
```
Generate a new Apple Provisioning Profile?
```

**Selecciona: Sí (Yes)**

EAS:
1. Se conectará a tu cuenta de Apple Developer
2. Creará el certificado de distribución si no existe
3. Generará el provisioning profile automáticamente
4. Lo guardará en EAS para futuros builds

### Paso 4: Verificar

Después de configurar, puedes verificar:

```bash
eas credentials
```

Selecciona:
- **Platform**: iOS
- **Project**: handson-app
- **Action**: View credentials

Esto te mostrará el provisioning profile configurado.

---

## 🔧 Opción 2: Generar Manualmente en Apple Developer

Si prefieres generar el provisioning profile manualmente:

### Paso 1: Acceder a Apple Developer

1. Ve a [Apple Developer Portal](https://developer.apple.com/account/)
2. Inicia sesión con tu cuenta de desarrollador
3. Ve a **Certificates, Identifiers & Profiles**

### Paso 2: Verificar App ID

1. Ve a **Identifiers**
2. Busca o crea el App ID: `com.ofisi.mobile`
3. Verifica que esté configurado correctamente

### Paso 3: Crear/Verificar Certificado

1. Ve a **Certificates**
2. Si no tienes un certificado de distribución, crea uno:
   - Tipo: **Apple Distribution**
   - Sigue el asistente para generar el CSR (Certificate Signing Request)

### Paso 4: Crear Provisioning Profile

1. Ve a **Profiles**
2. Haz clic en **"+"** para crear un nuevo perfil
3. Selecciona **"App Store"** (para distribución en App Store)
4. Selecciona tu **App ID**: `com.ofisi.mobile`
5. Selecciona tu **Certificado de distribución**
6. Asigna un nombre al perfil (ej: "ofiSí App Store")
7. Haz clic en **"Generate"**

### Paso 5: Descargar y Subir a EAS

1. Descarga el provisioning profile (archivo `.mobileprovision`)
2. Sube el perfil a EAS:

```bash
cd mobile
eas credentials
```

- **Platform**: iOS
- **Project**: handson-app
- **Action**: Update credentials
- **Provisioning Profile**: Upload existing profile
- Proporciona la ruta al archivo `.mobileprovision`

---

## 🔄 Opción 3: Regenerar con EAS (Si hay Problemas)

Si el provisioning profile actual tiene problemas, puedes regenerarlo:

### Paso 1: Eliminar Credenciales Actuales (Opcional)

```bash
cd mobile
eas credentials
```

- **Platform**: iOS
- **Project**: handson-app
- **Action**: Remove credentials
- Confirma la eliminación

### Paso 2: Configurar Nuevamente

```bash
eas credentials
```

- **Platform**: iOS
- **Project**: handson-app
- **Action**: Set up credentials
- Cuando pregunte sobre el provisioning profile, selecciona **"Generate new"**

---

## 📝 Información Necesaria

Para generar el provisioning profile, necesitas:

1. ✅ **Cuenta de Apple Developer activa**
   - Debe estar pagada (no cuenta gratuita)
   - Debe tener acceso a App Store Connect

2. ✅ **App ID configurado**
   - Bundle Identifier: `com.ofisi.mobile`
   - Debe estar registrado en Apple Developer Portal

3. ✅ **Certificado de distribución**
   - EAS puede generarlo automáticamente
   - O puedes usar uno existente

4. ✅ **Team ID de Apple Developer**
   - Lo encontrarás en Apple Developer Portal
   - EAS lo detectará automáticamente si estás autenticado

---

## 🚨 Solución de Problemas

### Error: "No Apple Developer account found"

**Solución:**
1. Asegúrate de estar autenticado en EAS con la cuenta correcta
2. Verifica que tu cuenta de Apple Developer esté activa
3. Intenta autenticarte nuevamente:

```bash
eas login
```

### Error: "App ID not found"

**Solución:**
1. Ve a [Apple Developer Portal](https://developer.apple.com/account/)
2. Crea el App ID `com.ofisi.mobile` si no existe
3. Vuelve a intentar con EAS

### Error: "Certificate expired"

**Solución:**
1. EAS puede regenerar el certificado automáticamente
2. O genera uno nuevo manualmente en Apple Developer Portal
3. Actualiza las credenciales en EAS

### Error: "Provisioning profile invalid"

**Solución:**
1. Regenera el provisioning profile usando EAS:

```bash
eas credentials
```

- Selecciona: **Update credentials** → **Generate new provisioning profile**

---

## 📋 Checklist

Antes de generar un build de iOS, verifica:

- [ ] Tienes una cuenta de Apple Developer activa
- [ ] El App ID `com.ofisi.mobile` está registrado
- [ ] Las credenciales están configuradas en EAS
- [ ] El provisioning profile está vigente (no expirado)
- [ ] El certificado de distribución es válido

---

## 🎯 Comando Rápido

Para configurar todo automáticamente con EAS:

```bash
cd mobile
eas credentials
```

Luego selecciona:
1. **iOS**
2. **handson-app**
3. **Set up credentials** (o **Update credentials**)
4. **Generate new** cuando pregunte sobre provisioning profile

EAS manejará todo automáticamente.

---

## 📚 Recursos Adicionales

- [Documentación de EAS sobre Credenciales iOS](https://docs.expo.dev/build/signing/)
- [Apple Developer Portal](https://developer.apple.com/account/)
- [App Store Connect](https://appstoreconnect.apple.com/)

---

**Recomendación**: Deja que EAS genere el provisioning profile automáticamente. Es más fácil y menos propenso a errores. 🚀
