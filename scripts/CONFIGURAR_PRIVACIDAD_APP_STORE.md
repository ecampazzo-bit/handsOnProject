# Guía Completa: Configurar Privacidad de la App en App Store Connect

Este documento te guía paso a paso para completar la sección **"Privacidad de la app"** requerida por Apple antes de enviar tu app a revisión.

---

## 📋 Información General

- **Nombre de la App**: ofiSí
- **Bundle ID**: com.ofisi.mobile
- **Versión**: 1.3.4

---

## 🔍 Paso a Paso: App Store Connect

### 1. Acceder a la Sección de Privacidad

1. Ve a: https://appstoreconnect.apple.com/
2. Inicia sesión con tu cuenta de desarrollador
3. Selecciona tu app **ofiSi**
4. En el menú lateral, haz clic en **"Privacidad de la app"** (App Privacy)
5. Haz clic en **"Comencemos"** o **"Configurar"**

---

## 📊 Tipos de Datos que Debes Declarar

Basándote en la funcionalidad de ofiSi, necesitas declarar los siguientes tipos de datos. Apple te pregunta para cada tipo de dato:

1. **¿Se recopilan estos datos?** (Sí/No)
2. **¿Se vinculan a la identidad del usuario?** (Vinculados a la identidad / No vinculados / No recopilados)
3. **¿Se utilizan para seguimiento?** (Sí/No)
4. **¿Se comparten con terceros?** (Sí/No)

---

## 📝 Declaraciones por Tipo de Dato

### 1. **Información de Contacto (Contact Info)**

#### 1.1. Nombre
- ✅ **¿Se recopilan?**: Sí
- ✅ **¿Vinculados a la identidad?**: Sí
- ❌ **¿Seguimiento?**: No
- ✅ **¿Compartidos con terceros?**: Sí (con otros usuarios de la plataforma)

**Propósito**: Para identificar al usuario en la plataforma y permitir la comunicación entre clientes y prestadores.

**Uso**: 
- Proporcionar el servicio principal (mostrar nombre en perfil)
- Análisis (estadísticas de uso)
- Comunicaciones (notificaciones de la app)

**Compartido con**:
- Otros usuarios de la plataforma (cuando se establece contacto para servicios)

#### 1.2. Dirección de Email
- ✅ **¿Se recopilan?**: Sí
- ✅ **¿Vinculados a la identidad?**: Sí
- ❌ **¿Seguimiento?**: No
- ✅ **¿Compartidos con terceros?**: Sí (Supabase, Twilio)

**Propósito**: Para autenticación, comunicación y recuperación de cuenta.

**Uso**:
- Proporcionar el servicio principal (login, registro)
- Funcionalidades del producto (notificaciones por email)
- Comunicaciones (notificaciones de la app)

**Compartido con**:
- Supabase (servicio de backend y autenticación)
- Twilio (para códigos de verificación por WhatsApp, si aplica)

#### 1.3. Número de Teléfono
- ✅ **¿Se recopilan?**: Sí
- ✅ **¿Vinculados a la identidad?**: Sí
- ❌ **¿Seguimiento?**: No
- ✅ **¿Compartidos con terceros?**: Sí (Supabase, Twilio)

**Propósito**: Para comunicación, verificación de cuenta y funcionalidades del servicio.

**Uso**:
- Proporcionar el servicio principal (verificación por WhatsApp, comunicación)
- Funcionalidades del producto (contacto entre usuarios)
- Comunicaciones (notificaciones y códigos de verificación)

**Compartido con**:
- Supabase (almacenamiento seguro)
- Twilio (envío de códigos de verificación por WhatsApp)

---

### 2. **Identificadores (Identifiers)**

#### 2.1. ID de Usuario
- ✅ **¿Se recopilan?**: Sí
- ✅ **¿Vinculados a la identidad?**: Sí
- ❌ **¿Seguimiento?**: No
- ✅ **¿Compartidos con terceros?**: Sí (Supabase)

**Propósito**: Para identificar únicamente al usuario en la plataforma.

**Uso**:
- Proporcionar el servicio principal (identificación de usuario)
- Análisis (estadísticas de uso)

**Compartido con**:
- Supabase (sistema de autenticación y base de datos)

#### 2.2. ID de Dispositivo
- ✅ **¿Se recopilan?**: Sí (implícito en Expo/React Native)
- ⚠️ **¿Vinculados a la identidad?**: No (o "No vinculados")
- ❌ **¿Seguimiento?**: No
- ✅ **¿Compartidos con terceros?**: Sí (Supabase para sesiones)

**Propósito**: Para gestionar sesiones de usuario y notificaciones push.

**Uso**:
- Funcionalidades del producto (notificaciones push)
- Análisis (estadísticas de uso)

**Compartido con**:
- Supabase (para gestionar sesiones de autenticación)

---

### 3. **Ubicación (Location)**

#### 3.1. Ubicación Precisa
- ✅ **¿Se recopilan?**: Sí
- ✅ **¿Vinculados a la identidad?**: Sí
- ❌ **¿Seguimiento?**: No
- ⚠️ **¿Compartidos con terceros?**: Sí (con otros usuarios de la plataforma de forma aproximada)

**Propósito**: Para conectar clientes con prestadores de servicios cercanos.

**Uso**:
- Proporcionar el servicio principal (búsqueda de prestadores cercanos)
- Funcionalidades del producto (mostrar ubicación aproximada a otros usuarios)
- Personalización (promociones basadas en ubicación)

**Compartido con**:
- Otros usuarios de la plataforma (ubicación aproximada, no precisa)
- Supabase (almacenamiento)

**Nota**: La ubicación solo se recopila cuando la app está en uso activo (foreground), no en segundo plano.

---

### 4. **Fotos o Videos (Photos or Videos)**

#### 4.1. Fotos
- ✅ **¿Se recopilan?**: Sí
- ✅ **¿Vinculados a la identidad?**: Sí
- ❌ **¿Seguimiento?**: No
- ✅ **¿Compartidos con terceros?**: Sí (con otros usuarios de la plataforma, Supabase Storage)

**Propósito**: Para fotos de perfil, portfolio de trabajos y documentación de servicios.

**Uso**:
- Proporcionar el servicio principal (perfiles profesionales, documentación de trabajos)
- Funcionalidades del producto (portfolio de prestadores)

**Compartido con**:
- Otros usuarios de la plataforma (fotos de perfil y portfolios son públicas)
- Supabase Storage (almacenamiento seguro de imágenes)

---

### 5. **Archivos y Documentos (Files and Docs)**

#### 5.1. Archivos de Usuario
- ✅ **¿Se recopilan?**: Sí (certificaciones, documentos profesionales)
- ✅ **¿Vinculados a la identidad?**: Sí
- ❌ **¿Seguimiento?**: No
- ⚠️ **¿Compartidos con terceros?**: Sí (Supabase Storage, no con otros usuarios)

**Propósito**: Para almacenar certificaciones y documentación profesional de prestadores.

**Uso**:
- Funcionalidades del producto (verificación de credenciales profesionales)

**Compartido con**:
- Supabase Storage (almacenamiento seguro y privado)

**Nota**: Los documentos profesionales son privados y solo visibles para el prestador y administradores.

---

### 6. **Información de Uso (User Content)**

#### 6.1. Otros Datos del Usuario
- ✅ **¿Se recopilan?**: Sí (calificaciones, reseñas, mensajes, solicitudes de servicio)
- ✅ **¿Vinculados a la identidad?**: Sí
- ❌ **¿Seguimiento?**: No
- ✅ **¿Compartidos con terceros?**: Sí (con otros usuarios de la plataforma según contexto)

**Propósito**: Para gestionar el contenido generado por usuarios (calificaciones, mensajes, solicitudes).

**Uso**:
- Proporcionar el servicio principal (sistema de calificaciones, mensajería)
- Funcionalidades del producto (comunicación entre usuarios)

**Compartido con**:
- Otros usuarios de la plataforma (calificaciones y reseñas públicas, mensajes privados entre usuarios involucrados)
- Supabase (almacenamiento)

---

### 7. **Búsquedas (Search History)**

#### 7.1. Historial de Búsqueda
- ⚠️ **¿Se recopilan?**: No (o Sí si guardas búsquedas)
- Si no guardas búsquedas, marca como "No recopilado"

**Recomendación**: Si no guardas el historial de búsquedas de usuarios, marca esto como "No recopilado".

---

### 8. **Actividad de Uso (Usage Data)**

#### 8.1. Interacciones del Producto
- ✅ **¿Se recopilan?**: Sí (implícito en logs de Supabase)
- ⚠️ **¿Vinculados a la identidad?**: No vinculados (o No si no guardas esta información)
- ❌ **¿Seguimiento?**: No
- ✅ **¿Compartidos con terceros?**: Sí (Supabase para análisis interno)

**Propósito**: Para mejorar el servicio y detectar problemas técnicos.

**Uso**:
- Análisis (mejora del producto)
- Diagnóstico del producto (detección de errores)

**Compartido con**:
- Supabase (logs y métricas internas)

---

### 9. **Datos de Diagnóstico (Diagnostics)**

#### 9.1. Datos de Producto
- ✅ **¿Se recopilan?**: Sí (logs de errores, métricas de rendimiento)
- ⚠️ **¿Vinculados a la identidad?**: No vinculados
- ❌ **¿Seguimiento?**: No
- ✅ **¿Compartidos con terceros?**: Sí (Supabase)

**Propósito**: Para detectar y resolver problemas técnicos.

**Uso**:
- Diagnóstico del producto (detección de errores)
- Análisis (mejora del rendimiento)

**Compartido con**:
- Supabase (logs de errores y métricas)

---

## 🚫 Datos que NO se Recopilan

Los siguientes tipos de datos NO se recopilan según la funcionalidad actual de ofiSi:

- ❌ Información financiera (Financial Info) - Los pagos no se procesan directamente en la app
- ❌ Información de salud y fitness (Health & Fitness)
- ❌ Información sensible (Sensitive Info)
- ❌ Información de compras (Purchase History) - No hay compras in-app
- ❌ Preferencias (Preferences) - No se recopilan preferencias detalladas
- ❌ Historial de navegación (Browsing History)
- ❌ Publicidad (Advertising Data)
- ❌ Otros datos de uso (Other Usage Data) - Solo datos básicos de diagnóstico

---

## 🔗 Terceros con los que se Comparten Datos

### 1. **Supabase** (Supabase Inc.)
- **Tipo de datos compartidos**: 
  - Información de contacto
  - Identificadores
  - Ubicación
  - Fotos/Videos
  - Archivos
  - Información de uso
  - Datos de diagnóstico
- **Propósito**: Backend, base de datos, autenticación, almacenamiento de archivos
- **Tipo de tercero**: Proveedor de servicios de infraestructura
- **¿Se utiliza para seguimiento?**: No

### 2. **Twilio** (Twilio Inc.)
- **Tipo de datos compartidos**: 
  - Email
  - Número de teléfono
- **Propósito**: Envío de códigos de verificación por WhatsApp
- **Tipo de tercero**: Proveedor de servicios de comunicación
- **¿Se utiliza para seguimiento?**: No

---

## ⚠️ SEGUIMIENTO (Tracking)

**IMPORTANTE**: La app **NO realiza seguimiento** según la definición de Apple.

Apple define "seguimiento" como:
- Vincular datos de apps o sitios web de terceros sobre un usuario o dispositivo determinado
- Compartir datos del usuario o dispositivo con un data broker
- Usar datos de apps o sitios web de terceros para publicidad dirigida o compartir datos con plataformas de medición de publicidad

ofiSi:
- ✅ NO vincula datos con apps o sitios web de terceros
- ✅ NO comparte datos con data brokers
- ✅ NO utiliza datos para publicidad dirigida
- ✅ NO utiliza plataformas de medición de publicidad

**Respuesta para todas las preguntas de seguimiento**: **NO**

---

## 📋 Resumen Rápido para Copiar/Pegar

### Datos que SÍ se recopilan:

1. **Información de Contacto**:
   - ✅ Nombre (Vinculado, No seguimiento, Compartido)
   - ✅ Email (Vinculado, No seguimiento, Compartido)
   - ✅ Teléfono (Vinculado, No seguimiento, Compartido)

2. **Identificadores**:
   - ✅ ID de Usuario (Vinculado, No seguimiento, Compartido)
   - ✅ ID de Dispositivo (No vinculado, No seguimiento, Compartido)

3. **Ubicación**:
   - ✅ Ubicación Precisa (Vinculado, No seguimiento, Compartido)

4. **Fotos/Videos**:
   - ✅ Fotos (Vinculado, No seguimiento, Compartido)

5. **Archivos**:
   - ✅ Archivos de Usuario (Vinculado, No seguimiento, Compartido)

6. **Información de Uso**:
   - ✅ Otros Datos del Usuario (Vinculado, No seguimiento, Compartido)
   - ✅ Interacciones del Producto (No vinculado, No seguimiento, Compartido)

7. **Diagnóstico**:
   - ✅ Datos de Producto (No vinculado, No seguimiento, Compartido)

### Datos que NO se recopilan:
- ❌ Información financiera
- ❌ Información de salud
- ❌ Información de compras
- ❌ Preferencias
- ❌ Historial de navegación
- ❌ Publicidad

### Terceros:
- ✅ Supabase (Proveedor de infraestructura)
- ✅ Twilio (Proveedor de comunicación)
- ❌ No se utiliza para seguimiento

---

## ✅ Checklist Final

Antes de enviar, verifica:

- [ ] Todos los tipos de datos están declarados correctamente
- [ ] Para cada dato, se especificó si está vinculado o no
- [ ] Todas las preguntas de seguimiento están marcadas como "No"
- [ ] Se especificaron todos los terceros con los que se comparten datos
- [ ] Se proporcionaron descripciones claras del propósito de uso
- [ ] La política de privacidad está publicada y accesible
- [ ] La URL de la política de privacidad está configurada en App Store Connect

---

## 🔗 Enlaces Útiles

- **App Store Connect**: https://appstoreconnect.apple.com/
- **Guía de Apple sobre Privacidad**: https://developer.apple.com/app-store/app-privacy-details/
- **Política de Privacidad de ofiSi**: [Tu URL pública de política de privacidad]

---

## 📝 Notas Importantes

1. **Precisión**: Es importante ser preciso. Si Apple detecta discrepancias entre lo declarado y la funcionalidad real de la app, puede rechazar la app.

2. **Actualizaciones**: Si agregas nuevas funcionalidades que recopilen nuevos tipos de datos, debes actualizar esta sección antes de enviar una nueva versión.

3. **Transparencia**: Cuanto más transparente seas, mejor será para la confianza de los usuarios y para la aprobación de Apple.

4. **Política de Privacidad**: Asegúrate de que tu política de privacidad pública refleje exactamente lo que declaras en App Store Connect.

---

## 🆘 Si Tienes Dudas

Si no estás seguro sobre si un dato específico se recopila o cómo declararlo:

1. Revisa tu código fuente para ver qué datos realmente se recopilan
2. Revisa tu política de privacidad para ver qué está documentado
3. Consulta la documentación de Apple: https://developer.apple.com/app-store/app-privacy-details/
4. En caso de duda, es mejor declarar que sí se recopila (ser transparente) que omitir algo

---

¡Éxito con la configuración! 🚀
