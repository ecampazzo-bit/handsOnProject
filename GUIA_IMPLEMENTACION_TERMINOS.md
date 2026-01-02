# GUÍA DE IMPLEMENTACIÓN - TÉRMINOS Y CONDICIONES

Esta guía te ayudará a completar e implementar los documentos de Términos y Condiciones y Política de Privacidad para la aprobación en Google Play Store y Apple App Store.

---

## 📋 DOCUMENTOS CREADOS

1. **TERMINOS_Y_CONDICIONES.md** - Documento completo de términos y condiciones
2. **POLITICA_DE_PRIVACIDAD.md** - Documento completo de política de privacidad

---

## ✅ CHECKLIST PRE-IMPLEMENTACIÓN

### Información que Necesitas Completar

Antes de publicar los documentos, debes completar los siguientes campos marcados con `[CORCHETES]`:

#### Información de la Empresa
- `[NOMBRE DE LA EMPRESA]` - Nombre legal de tu empresa
- `[EMAIL DE CONTACTO]` - Email para contacto general
- `[DIRECCIÓN POSTAL]` - Dirección física de la empresa
- `[TELÉFONO DE CONTACTO]` - Teléfono de contacto
- `[URL DEL SITIO WEB]` - URL de tu sitio web (si tienes)
- `[EMAIL DE PRIVACIDAD]` - Email específico para asuntos de privacidad
- `[EMAIL DEL DPO]` - Email del Delegado de Protección de Datos (si aplica, principalmente para GDPR)

#### Información Legal
- `[FECHA]` - Fecha de última actualización (formato: DD/MM/YYYY)
- `[JURISDICCIÓN]` - País/jurisdicción donde está registrada tu empresa
- `[ORGANIZACIÓN DE ARBITRAJE]` - Organización de arbitraje para resolver disputas (ej: AAA, JAMS)
- `[IDIOMA PRINCIPAL]` - Idioma principal del documento (ej: Español)

#### Información Específica
- `[EDAD MÍNIMA]` - Edad mínima para usar la app (generalmente 18 años)
- `[PAÍSES DONDE SE PROCESAN DATOS]` - Lista de países donde se procesan los datos

---

## 🔍 REVISIÓN LEGAL RECOMENDADA

**IMPORTANTE:** Estos documentos son plantillas completas pero deben ser revisados por un abogado especializado en:

1. **Derecho Digital y Tecnología**
2. **Protección de Datos Personales**
3. **Leyes de Consumo**
4. **Regulaciones específicas de tu país/jurisdicción**

Un abogado puede:
- Adaptar los términos a las leyes específicas de tu país
- Asegurar cumplimiento con regulaciones locales
- Agregar cláusulas específicas necesarias
- Verificar que los términos sean ejecutables legalmente

---

## 📱 REQUISITOS DE GOOGLE PLAY STORE

### 1. Política de Privacidad
- ✅ Debe estar accesible públicamente (URL pública)
- ✅ Debe explicar qué datos recopilas y cómo los usas
- ✅ Debe explicar el uso de permisos (cámara, ubicación, etc.)
- ✅ Debe incluir información de contacto
- ✅ Debe estar actualizada

### 2. Términos y Condiciones
- ✅ Recomendado pero no siempre obligatorio
- ✅ Debe estar accesible desde la app o sitio web
- ✅ Debe explicar las reglas de uso del servicio

### 3. Información de Permisos
En la consola de Google Play, debes declarar:
- ✅ **Cámara**: Explicar por qué la necesitas (fotos de perfil, portfolios)
- ✅ **Ubicación**: Explicar por qué la necesitas (conectar clientes con prestadores cercanos)
- ✅ **Almacenamiento**: Explicar por qué lo necesitas (guardar imágenes)

### 4. Formulario de Datos de Seguridad
Google Play requiere que completes un formulario sobre:
- Qué datos recopilas
- Cómo los usas
- Con quién los compartes
- Cómo los proteges

**Los documentos creados cubren todos estos requisitos.**

---

## 🍎 REQUISITOS DE APPLE APP STORE

### 1. Política de Privacidad
- ✅ **OBLIGATORIO** - Debe estar accesible públicamente (URL pública)
- ✅ Debe explicar qué datos recopilas
- ✅ Debe explicar el uso de permisos
- ✅ Debe incluir información de contacto
- ✅ Debe estar actualizada

### 2. Términos y Condiciones
- ✅ Recomendado pero no siempre obligatorio
- ✅ Debe estar accesible desde la app o sitio web

### 3. Declaración de Privacidad en App Store Connect
Apple requiere que declares:
- ✅ Qué datos recopilas
- ✅ Cómo los usas
- ✅ Con quién los compartes
- ✅ Si los datos se usan para rastreo
- ✅ Si los datos se vinculan a la identidad del usuario
- ✅ Si los datos se usan para publicidad

### 4. Permisos de Privacidad
En App Store Connect, debes explicar:
- ✅ **Cámara (NSCameraUsageDescription)**: Descripción clara de por qué necesitas la cámara
- ✅ **Ubicación (NSLocationWhenInUseUsageDescription)**: Descripción clara de por qué necesitas la ubicación
- ✅ **Fotos (NSPhotoLibraryUsageDescription)**: Si accedes a la galería de fotos

**Los documentos creados cubren todos estos requisitos.**

---

## 🌐 IMPLEMENTACIÓN EN LA APLICACIÓN

### Opción 1: Enlace a Sitio Web (Recomendado)

1. **Publica los documentos en tu sitio web:**
   - Crea páginas HTML con los términos y política de privacidad
   - Asegúrate de que sean accesibles públicamente
   - Usa URLs como: `https://tudominio.com/terminos` y `https://tudominio.com/privacidad`

2. **Agrega enlaces en la app:**
   - En la pantalla de registro, agrega checkboxes con enlaces
   - En la configuración, agrega enlaces a ambos documentos
   - En el footer, agrega enlaces a ambos documentos

### Opción 2: Dentro de la Aplicación

1. **Crea pantallas en la app:**
   - Pantalla de Términos y Condiciones
   - Pantalla de Política de Privacidad
   - Agrega estas pantallas a la navegación

2. **Muestra en el registro:**
   - Muestra los términos antes del registro
   - Requiere aceptación explícita
   - Guarda el timestamp de aceptación

### Opción 3: Híbrida (Recomendada)

- Mantén los documentos en tu sitio web (para cumplir con requisitos de las tiendas)
- Agrega enlaces dentro de la app que abran el navegador
- También incluye versiones resumidas dentro de la app

---

## 📝 PASOS DE IMPLEMENTACIÓN

### Paso 1: Completar Información
1. Abre `TERMINOS_Y_CONDICIONES.md` y `POLITICA_DE_PRIVACIDAD.md`
2. Busca todos los campos con `[CORCHETES]`
3. Completa cada campo con la información de tu empresa
4. Guarda los archivos

### Paso 2: Revisión Legal
1. Comparte los documentos con un abogado especializado
2. Haz las modificaciones recomendadas
3. Asegúrate de cumplir con las leyes de tu país

### Paso 3: Convertir a HTML
1. Convierte los documentos Markdown a HTML
2. Publica en tu sitio web
3. Asegúrate de que las URLs sean públicas y accesibles

### Paso 4: Agregar a la App
1. Agrega enlaces a los documentos en:
   - Pantalla de registro/login
   - Pantalla de configuración
   - Footer de la app
2. Implementa la aceptación de términos en el registro

### Paso 5: Configurar en las Tiendas

#### Google Play Store:
1. Ve a Google Play Console
2. En "Política y programas" → "Política de privacidad"
3. Ingresa la URL de tu política de privacidad
4. Completa el "Formulario de datos de seguridad"
5. Declara los permisos y explica su uso

#### Apple App Store:
1. Ve a App Store Connect
2. En "App Privacy" → "Política de privacidad"
3. Ingresa la URL de tu política de privacidad
4. Completa la "Declaración de privacidad de la app"
5. Declara qué datos recopilas y cómo los usas

---

## 🔐 PERMISOS ESPECÍFICOS - DECLARACIONES

### Para Google Play Store

**Cámara:**
```
La aplicación utiliza la cámara para permitir a los usuarios tomar fotografías de perfil y documentar trabajos realizados. Las imágenes se almacenan de forma segura y solo se comparten según las preferencias del usuario.
```

**Ubicación:**
```
La aplicación utiliza la ubicación para conectar clientes con prestadores de servicios cercanos. La ubicación se utiliza solo cuando la aplicación está en uso activo y se comparte de forma aproximada con otros usuarios cuando es necesario para el funcionamiento del servicio.
```

### Para Apple App Store

**NSCameraUsageDescription (Info.plist):**
```
ofiSi necesita acceso a la cámara para que puedas tomar fotografías de perfil y documentar trabajos realizados. Las imágenes se almacenan de forma segura en nuestros servidores.
```

**NSLocationWhenInUseUsageDescription (Info.plist):**
```
ofiSi necesita tu ubicación para conectarte con prestadores de servicios cercanos. Tu ubicación se utiliza solo cuando la aplicación está en uso y se comparte de forma aproximada con otros usuarios cuando es necesario.
```

**NSPhotoLibraryUsageDescription (Info.plist):**
```
ofiSi necesita acceso a tus fotos para que puedas seleccionar imágenes para tu perfil o portfolio. Solo accedemos a las fotos que seleccionas explícitamente.
```

---

## ✅ CHECKLIST FINAL ANTES DE ENVIAR

### Documentos
- [ ] Términos y Condiciones completados y revisados
- [ ] Política de Privacidad completada y revisada
- [ ] Todos los campos `[CORCHETES]` completados
- [ ] Revisión legal realizada
- [ ] Documentos publicados en sitio web (URLs públicas)
- [ ] Documentos accesibles desde la app

### Google Play Store
- [ ] URL de Política de Privacidad agregada en Play Console
- [ ] Formulario de Datos de Seguridad completado
- [ ] Permisos declarados y explicados
- [ ] Términos y Condiciones accesibles (si aplica)

### Apple App Store
- [ ] URL de Política de Privacidad agregada en App Store Connect
- [ ] Declaración de Privacidad de la App completada
- [ ] Descripciones de permisos agregadas en Info.plist
- [ ] Términos y Condiciones accesibles (si aplica)

### Aplicación
- [ ] Enlaces a documentos agregados en la app
- [ ] Aceptación de términos implementada en registro
- [ ] Permisos solicitados con descripciones claras
- [ ] Usuario puede revocar permisos fácilmente

---

## 📞 RECURSOS ADICIONALES

### Documentación Oficial
- **Google Play**: https://support.google.com/googleplay/android-developer
- **Apple App Store**: https://developer.apple.com/app-store/review/guidelines/

### Guías de Privacidad
- **GDPR**: https://gdpr.eu/
- **CCPA**: https://oag.ca.gov/privacy/ccpa
- **Apple Privacy Guidelines**: https://developer.apple.com/app-store/review/guidelines/#privacy

### Herramientas Útiles
- **Generador de Políticas de Privacidad**: https://www.privacypolicies.com/
- **GDPR Compliance Checker**: https://gdpr.eu/checklist/

---

## ⚠️ NOTAS IMPORTANTES

1. **No uses estos documentos sin revisión legal** - Son plantillas que deben ser adaptadas a tu situación específica
2. **Actualiza regularmente** - Las leyes cambian, revisa y actualiza los documentos periódicamente
3. **Mantén registros** - Guarda registros de cuándo los usuarios aceptan los términos
4. **Notifica cambios** - Notifica a los usuarios sobre cambios importantes en los términos
5. **Cumple con las leyes locales** - Asegúrate de cumplir con todas las leyes aplicables en tu jurisdicción

---

## 🆘 PROBLEMAS COMUNES Y SOLUCIONES

### Problema: Google Play rechaza la app por falta de política de privacidad
**Solución**: Asegúrate de que la URL de la política de privacidad sea pública y accesible sin autenticación.

### Problema: Apple rechaza la app por descripción de permisos insuficiente
**Solución**: Agrega descripciones claras y específicas en Info.plist para cada permiso solicitado.

### Problema: Los usuarios no pueden acceder a los términos desde la app
**Solución**: Agrega enlaces claros y visibles en la pantalla de registro y configuración.

### Problema: No sé qué datos declarar en el formulario de Google Play
**Solución**: Revisa la sección "Información que Recopilamos" en la Política de Privacidad y declara todos los datos mencionados.

---

**¡Buena suerte con el lanzamiento de tu aplicación! 🚀**

