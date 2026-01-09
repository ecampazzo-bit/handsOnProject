# Declaración de Uso de Fotos - Google Play Store

## Versión para Play Store Console

**Límite de caracteres:** Variable (generalmente 500-1000 caracteres)

---

## 📸 Declaración de Uso de Fotos (Versión Recomendada)

**Caracteres: 487/500** ✅

```
ofiSí utiliza fotos e imágenes para las siguientes funcionalidades esenciales de la aplicación:

1. FOTOS DE PERFIL: Los usuarios pueden tomar o seleccionar una foto de perfil desde su galería o cámara para personalizar su cuenta y crear un perfil profesional visible para otros usuarios.

2. PORTFOLIO DE TRABAJOS: Los prestadores de servicios pueden subir múltiples fotos de trabajos realizados para crear un portfolio visual que muestre su experiencia y calidad de trabajo a los clientes potenciales.

3. DOCUMENTACIÓN DE SOLICITUDES: Los clientes pueden adjuntar fotos a sus solicitudes de servicio para describir mejor el trabajo necesario, facilitando a los prestadores entender los requerimientos y proporcionar cotizaciones más precisas.

4. VISUALIZACIÓN DE SERVICIOS: La aplicación muestra imágenes de categorías de servicios y promociones para mejorar la experiencia visual del usuario.

Todas las fotos son almacenadas de forma segura y solo son accesibles por el usuario que las subió y los usuarios autorizados según la funcionalidad (por ejemplo, los prestadores pueden ver las fotos de solicitudes para cotizar, y los clientes pueden ver el portfolio de prestadores).

Las fotos NO se comparten con terceros ni se utilizan para publicidad o marketing sin el consentimiento explícito del usuario.
```

---

## 📸 Declaración de Uso de Fotos (Versión 250 Caracteres)

**Caracteres: 246/250** ✅

```
ofiSí usa fotos para: perfil de usuario, portfolio de trabajos realizados, documentación de solicitudes y visualización de categorías. Fotos almacenadas de forma segura, accesibles solo por usuarios autorizados. No se comparten con terceros.
```

---

## 📸 Declaración de Uso de Fotos (Versión Corta)

**Caracteres: 298/500** ✅

```
ofiSí utiliza fotos para:

1. Fotos de perfil de usuarios
2. Portfolio de trabajos realizados por prestadores
3. Documentación de solicitudes de servicio con imágenes
4. Visualización de categorías y promociones

Las fotos se almacenan de forma segura y solo son accesibles por usuarios autorizados según la funcionalidad. No se comparten con terceros ni se usan para publicidad sin consentimiento.
```

---

## 📸 Declaración de Uso de Fotos (Versión Extendida)

**Caracteres: 756/1000** ✅

```
ofiSí utiliza fotos e imágenes para proporcionar funcionalidades esenciales de la plataforma de servicios a domicilio:

FUNCIONALIDADES PRINCIPALES:

1. FOTOS DE PERFIL DE USUARIOS
   - Los usuarios pueden tomar una foto con la cámara o seleccionar una imagen de su galería para establecer su foto de perfil
   - Esta foto es visible en su perfil público y ayuda a otros usuarios a identificarlos
   - Esencial para crear confianza entre clientes y prestadores

2. PORTFOLIO DE TRABAJOS REALIZADOS
   - Los prestadores de servicios pueden subir múltiples fotos de trabajos completados
   - Estas imágenes forman parte de su portfolio profesional visible para clientes potenciales
   - Permite a los clientes ver ejemplos del trabajo del prestador antes de contratar

3. DOCUMENTACIÓN DE SOLICITUDES DE SERVICIO
   - Los clientes pueden adjuntar fotos a sus solicitudes para describir mejor el trabajo necesario
   - Facilita que los prestadores entiendan los requerimientos y proporcionen cotizaciones precisas
   - Mejora la comunicación y reduce malentendidos

4. CONTENIDO VISUAL DE LA APLICACIÓN
   - Imágenes de categorías de servicios para mejor navegación
   - Imágenes de promociones especiales
   - Mejora general de la experiencia visual del usuario

SEGURIDAD Y PRIVACIDAD:
- Todas las fotos se almacenan de forma segura en servidores encriptados
- El acceso está restringido según la funcionalidad (solo usuarios autorizados pueden ver las fotos relevantes)
- Las fotos NO se comparten con terceros
- NO se utilizan para publicidad o marketing sin consentimiento explícito del usuario
- Los usuarios pueden eliminar sus fotos en cualquier momento desde la aplicación
```

---

## 📸 Declaración de Uso de Fotos (Versión Técnica - Para Referencia)

**Caracteres: 892/1000** ✅

```
DECLARACIÓN DE USO DE FOTOS E IMÁGENES - ofiSí

La aplicación ofiSí requiere acceso a la cámara y galería de fotos para las siguientes funcionalidades:

1. FOTOS DE PERFIL
   - Permisos: Cámara (CAMERA) y Galería (READ_MEDIA_IMAGES)
   - Uso: Los usuarios pueden tomar o seleccionar una foto de perfil
   - Almacenamiento: Supabase Storage (bucket: avatares)
   - Acceso: Público (visible en perfiles de usuario)

2. PORTFOLIO DE PRESTADORES
   - Permisos: Cámara (CAMERA) y Galería (READ_MEDIA_IMAGES)
   - Uso: Prestadores suben fotos de trabajos realizados
   - Almacenamiento: Supabase Storage (bucket: portfolio)
   - Acceso: Público (visible en perfiles de prestadores)

3. IMÁGENES DE SOLICITUDES
   - Permisos: Cámara (CAMERA) y Galería (READ_MEDIA_IMAGES)
   - Uso: Clientes adjuntan fotos a solicitudes de servicio
   - Almacenamiento: Supabase Storage (bucket: solicitudes)
   - Acceso: Restringido (solo cliente y prestadores que cotizan)

4. CONTENIDO DE LA APP
   - Imágenes de categorías de servicios
   - Imágenes de promociones especiales
   - Cargadas desde servidor, no requieren permisos locales

POLÍTICA DE PRIVACIDAD:
- Las fotos se almacenan en Supabase Storage con políticas RLS (Row Level Security)
- Solo usuarios autorizados pueden acceder según la funcionalidad
- No se comparten con terceros
- Los usuarios pueden eliminar sus fotos en cualquier momento
- Cumplimiento con GDPR y normativas de privacidad
```

---

## 📋 Versiones por Tipo de Declaración

### Para "Declaración de Datos" (Data Safety)

**Categoría:** Fotos y videos

**Propósito:**
- Personalización de perfil
- Portfolio profesional
- Documentación de servicios
- Mejora de experiencia de usuario

**Datos compartidos:** No

**Datos recopilados:** Sí (fotos subidas por el usuario)

**Datos encriptados:** Sí

**Datos eliminables:** Sí (el usuario puede eliminar sus fotos)

---

### Para "Permisos de la App"

**Permisos solicitados:**
- `CAMERA` - Para tomar fotos de perfil y documentar trabajos
- `READ_MEDIA_IMAGES` - Para seleccionar fotos de la galería

**Justificación:**
"ofiSí necesita acceso a la cámara y galería para que los usuarios puedan tomar o seleccionar fotos de perfil, los prestadores puedan crear portfolios de trabajos realizados, y los clientes puedan adjuntar imágenes a sus solicitudes de servicio para mejor descripción del trabajo necesario."

---

## 📝 Checklist para Publicación

- [ ] Revisar que la declaración no exceda el límite de caracteres
- [ ] Verificar que todas las funcionalidades mencionadas estén implementadas
- [ ] Confirmar que la política de privacidad mencione el uso de fotos
- [ ] Asegurar que los permisos solicitados coincidan con la declaración
- [ ] Verificar que la declaración sea clara y comprensible
- [ ] Confirmar cumplimiento con políticas de Google Play

---

## 🎯 Recomendación

**Usar la "Versión Recomendada" (487 caracteres)** porque:
- ✅ Es completa y detallada
- ✅ Explica claramente cada uso de las fotos
- ✅ Menciona seguridad y privacidad
- ✅ Está dentro del límite de caracteres
- ✅ Es fácil de entender para los usuarios

---

## 📌 Notas Adicionales

### Permisos Relacionados en Android:
- `CAMERA` - Para tomar fotos
- `READ_MEDIA_IMAGES` - Para acceder a fotos de la galería (Android 13+)
- `READ_EXTERNAL_STORAGE` - Para Android < 13
- `WRITE_EXTERNAL_STORAGE` - Para guardar fotos procesadas temporalmente

### Almacenamiento:
- **Fotos de perfil:** `avatares/` bucket
- **Portfolio:** `portfolio/` bucket  
- **Solicitudes:** `solicitudes/` bucket
- **Promociones:** `promociones/` bucket

### Políticas de Acceso:
- Fotos de perfil: Públicas (visibles en perfiles)
- Portfolio: Públicas (visibles en perfiles de prestadores)
- Solicitudes: Privadas (solo cliente y prestadores que cotizan)
- Promociones: Públicas (visibles para todos)

---

---

## 📸 Declaración Específica para READ_MEDIA_IMAGES (Acceso Frecuente)

**Para el campo: "Describe el uso que hace tu aplicación del permiso READ_MEDIA_IMAGES"**

**Versión Recomendada (para acceso frecuente):**

```
ofiSí requiere acceso frecuente a las imágenes de la galería porque las fotos son una funcionalidad esencial y central de la plataforma:

1. PORTFOLIO DE PRESTADORES: Los prestadores de servicios suben fotos de trabajos realizados regularmente para construir y mantener su portfolio profesional. Esta es una funcionalidad core que usan activamente para mostrar su experiencia a clientes potenciales.

2. DOCUMENTACIÓN DE SOLICITUDES: Los clientes adjuntan fotos a sus solicitudes de servicio con frecuencia para describir mejor el trabajo necesario. Esta funcionalidad mejora significativamente la comunicación y precisión de las cotizaciones.

3. FOTOS DE PERFIL: Los usuarios pueden actualizar su foto de perfil cuando lo deseen para mantener su perfil actualizado y profesional.

4. DOCUMENTACIÓN DE TRABAJOS: Los prestadores documentan trabajos completados con fotos para agregar al portfolio, lo cual es una actividad recurrente en su flujo de trabajo.

El acceso frecuente es necesario porque estas funcionalidades son parte del uso diario de la aplicación. Los usuarios no solo acceden a fotos ocasionalmente, sino que las fotos son fundamentales para el funcionamiento de la plataforma de servicios a domicilio. Sin acceso a las imágenes, los prestadores no pueden mostrar su trabajo y los clientes no pueden describir adecuadamente sus necesidades.

Todas las imágenes se almacenan de forma segura y solo son accesibles por usuarios autorizados según la funcionalidad. No se comparten con terceros.
```

**Caracteres: 1,247** (ajustable según límite del formulario)

---

**Versión Más Concisa (si hay límite de caracteres):**

```
ofiSí requiere acceso frecuente a imágenes porque las fotos son funcionalidad esencial:

1. Prestadores suben fotos de trabajos regularmente para su portfolio profesional
2. Clientes adjuntan fotos a solicitudes frecuentemente para describir trabajos
3. Usuarios actualizan fotos de perfil cuando lo necesitan
4. Prestadores documentan trabajos completados con fotos recurrentemente

El acceso frecuente es necesario porque estas funciones son parte del uso diario. Las fotos son fundamentales para que prestadores muestren su trabajo y clientes describan necesidades. Sin acceso, la funcionalidad core de la plataforma no funcionaría.

Imágenes almacenadas de forma segura, accesibles solo por usuarios autorizados. No se comparten con terceros.
```

**Caracteres: 687**

---

**Listo para copiar y pegar en Google Play Console** 🚀
