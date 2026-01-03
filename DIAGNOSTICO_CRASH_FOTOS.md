# 🔴 DIAGNÓSTICO: CRASH AL SUBIR FOTOS

## Problema
La app se cierra y se reabre desde el login cuando intentas subir una foto.

## Causas Identificadas

### 1. **⚠️ ERROR CRÍTICO: Falta Try-Catch en handleTakePhoto**
**Ubicación:** [mobile/src/screens/SolicitarPresupuestoScreen.tsx](mobile/src/screens/SolicitarPresupuestoScreen.tsx#L56)

```tsx
const handleTakePhoto = async () => {
  try {
    const photo = await takePhoto();
    if (photo) {
      setFotos([...fotos, photo]);
    }
  } catch (error) {
    Alert.alert("Error", "No se pudo tomar la foto");
    console.error(error);
  }
};
```

**PROBLEMA:** El try-catch solo captura errores de `takePhoto()`, pero:
- Si `setFotos()` causa un error (muy raro pero posible)
- Si ocurre un error después de `setFotos()`, no se captura

**MÁS IMPORTANTE:** El error de permisos lanzado en `takePhoto()` NO está siendo manejado correctamente. Si el usuario rechaza permisos, puede causar un estado inconsistente.

---

### 2. **🔴 PROBLEMA GRAVE: Falta de Validación de Sesión**
**Ubicación:** [mobile/src/screens/SolicitarPresupuestoScreen.tsx](mobile/src/screens/SolicitarPresupuestoScreen.tsx#L116)

```tsx
const { urls, error: uploadError } = await uploadSolicitudImages(
  solicitudId,
  fotos
);
```

**PROBLEMA:** 
- No se verifica si `solicitudId` es válido ANTES de intentar subir
- Si `solicitudId` es `null` o `undefined`, `uploadSolicitudImages()` puede fallar silenciosamente
- **El error de sesión no se propaga correctamente**

---

### 3. **🔴 ERROR DE RLS (Row-Level Security)**
**Ubicación:** [mobile/src/services/solicitudService.ts](mobile/src/services/solicitudService.ts#L120-L160)

Cuando subes fotos:
```typescript
const fileName = `${user.id}/${solicitudId}/${timestamp}_${i}.jpg`;

const { data: uploadData, error: uploadError } = await supabase.storage
  .from("solicitudes")
  .upload(fileName, arrayBuffer, {...});
```

**POSIBLES PROBLEMAS DE RLS:**
- Si la sesión se pierde entre la creación de solicitud y la subida de fotos
- Si `user.id` no coincide con las políticas de seguridad
- Si el bucket "solicitudes" tiene RLS muy restrictivas

**Sin sesión válida = CRASH**

---

### 4. **⚠️ SESIÓN SE PIERDE DURANTE OPERACIONES LARGAS**
**Ubicación:** [mobile/src/services/supabaseClient.ts](mobile/src/services/supabaseClient.ts)

```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  ...
});
```

**PROBLEMA:**
- `autoRefreshToken: true` debería mantener la sesión viva
- Pero si el token expira DURANTE la conversión de imagen JPG (que puede tardar), la sesión se pierde
- Supabase intenta refrescarlo pero puede no tener tiempo

---

### 5. **🔴 MANEJO INCOMPLETO DE ERRORES EN uploadSolicitudImages()**
**Ubicación:** [mobile/src/services/solicitudService.ts](mobile/src/services/solicitudService.ts#L160-L180)

```typescript
if (uploadError) {
  console.error(`❌ Error al subir imagen ${i + 1}:`, uploadError);
  // ... solo continúa con la siguiente imagen
  continue;
}

if (!uploadData) {
  console.error(`❌ No se recibió data después de subir imagen ${i + 1}`);
  continue;
}
```

**PROBLEMA:**
- Los errores se ignoran silenciosamente
- Si TODAS las imágenes fallan, devuelve un array vacío
- La pantalla no sabe que no se subió nada

---

### 6. **⚠️ CONVERSIÓN A JPG PUEDE FALLAR SIN NOTIFICACIÓN**
**Ubicación:** [mobile/src/services/solicitudService.ts](mobile/src/services/solicitudService.ts#L10-L30)

```typescript
const convertToJPG = async (uri: string): Promise<string> => {
  try {
    const manipResult = await ImageManipulator.manipulateAsync(uri, [], {
      compress: 0.8,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    return manipResult.uri;
  } catch (error) {
    console.error("Error al convertir imagen a JPG:", error);
    // ← Devuelve la URI original si falla (puede ser HEIC o formato incompatible)
    return uri;
  }
};
```

**PROBLEMA:**
- Si la conversión falla, usa la imagen original
- Luego intenta leerla como JPG y puede fallar
- Esto causa un crash en `uriToArrayBuffer()`

---

## Soluciones a Implementar

### ✅ Solución 1: Agregar Manejo Global de Sesión
Añadir validación antes de cualquier operación de storage.

### ✅ Solución 2: Mejorar Try-Catch en handleTakePhoto y handlePickImages
Capturar todos los errores incluyendo los de permisos.

### ✅ Solución 3: Validar Sesión en uploadSolicitudImages()
Verificar que el usuario esté autenticado ANTES de intentar subir.

### ✅ Solución 4: Implementar Reintentos
Si falla por error de sesión, reintentar después de verificar sesión.

### ✅ Solución 5: Mejor Logging de Errores
No silenciar errores que pueden causar crashes.

### ✅ Solución 6: Verificar Permisos Antes
Solicitar permisos antes de abrir el picker/cámara.

---

## Pasos Recomendados

1. **PRIMERO:** Implementar validación de sesión en `uploadSolicitudImages()`
2. **SEGUNDO:** Mejorar manejo de errores en `handleTakePhoto()` y `handlePickImages()`
3. **TERCERO:** Agregar reintentos automáticos para errores de RLS
4. **CUARTO:** Implementar timeout y cancelación de operaciones largas
5. **QUINTO:** Probar con fotos de diferentes formatos (HEIC, PNG, WebP)

---

## Comando para Reproducir el Error

1. Abre la app
2. Login
3. Solicitar presupuesto
4. Toma una foto O selecciona de galería
5. La foto se muestra
6. Presiona "Enviar solicitud"
7. 👀 Observa si se crashea

---

## Señales de Alerta en Logs

Busca estos mensajes en la consola:

```
❌ Row-level security policy violated
❌ User not authenticated
⚠️ No session active
❌ El archivo está vacío o no se pudo leer
❌ Error al subir imagen
```

Si ves alguno de estos, es el culpable del crash.
