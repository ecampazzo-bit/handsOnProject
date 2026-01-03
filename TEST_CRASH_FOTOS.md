# 🧪 GUÍA DE PRUEBAS: Crash al Subir Fotos

## Antes de Probar

1. **Actualiza tu app**
   ```bash
   cd mobile
   npm install
   npm run start
   # En el emulador/dispositivo: Recarga la app (r)
   ```

2. **Abre la consola de React Native**
   ```bash
   # El comando ya debería estar corriendo
   # Presiona 'i' para iOS o 'a' para Android
   # Presiona 'j' para abrir Developer Tools
   ```

3. **Asegúrate de estar logueado**
   - Si ves LoginScreen, completa el login primero

---

## Test 1: ✅ Subida Normal Exitosa

### Pasos:
1. Inicia sesión
2. Ve a **"Home"** → **"Solicitar presupuesto"**
3. Selecciona un servicio (ej: "Vidrios")
4. Escribe descripción: *"Necesito cambiar una ventana"*
5. Presiona **"📷 Galería"**
6. Selecciona **UNA imagen** de tu galería
7. Presiona **"Enviar solicitud"**

### Resultado Esperado ✅:
- ✅ La imagen aparece en la pantalla
- ✅ En la consola ves:
  ```
  ✅ Imagen 1 convertida a JPG
  📤 Subiendo imagen 1 a: ...
  ✅ Imagen 1 subida exitosamente
  ```
- ✅ Ves alerta: *"¡Solicitud enviada!"*
- ✅ **LA APP NO CRASHEA** (esto es lo importante)
- ✅ Vuelves a la pantalla anterior

### Si Falla ❌:
- Verás mensajes de error en consola
- Abre DevTools (`j` en la consola)
- Captura los logs y comparte

---

## Test 2: ✅ Múltiples Fotos

### Pasos:
1. Repite Test 1 pero selecciona **3-4 imágenes** en "Galería"
2. Presiona "Enviar solicitud"

### Resultado Esperado ✅:
- ✅ Ves en consola:
  ```
  📸 Iniciando carga de 4 imagen(es)...
  🔄 Procesando imagen 1/4...
  ...
  ✅ Subida completada: 4/4 imágenes
  ```
- ✅ Todas se suben sin crash
- ✅ Alerta: *"Se subieron 4 fotos"*

---

## Test 3: ✅ Captura con Cámara

### Pasos:
1. Ve a **"Solicitar presupuesto"**
2. Presiona **"📸 Cámara"**
3. Toma una foto (presiona el botón de captura)
4. Acepta la foto (presiona "Use Photo" o similar)
5. Presiona **"Enviar solicitud"**

### Resultado Esperado ✅:
- ✅ La foto se captura correctamente
- ✅ Aparece en la pantalla
- ✅ Se sube sin crash
- ✅ Ves alerta de éxito

### Si Dice "Permisos requeridos" ⚠️:
- ✅ **Esto es normal** si nunca permitiste cámara
- En iOS: Ve a Ajustes → Privacidad → Cámara → Activa tu app
- En Android: Ve a Ajustes → Aplicaciones → [Tu App] → Permisos → Cámara

---

## Test 4: ✅ Rechazo de Permisos

### Pasos:
1. **En iOS**:
   - Ajustes → Privacidad → Cámara → Desactiva [Tu App]
   
2. **En Android**:
   - Ajustes → Aplicaciones → [Tu App] → Permisos → Desactiva Cámara

3. Vuelve a la app
4. Presiona **"📸 Cámara"**

### Resultado Esperado ✅:
- ✅ Ves alerta: *"Permisos requeridos"*
- ✅ **LA APP NO CRASHEA**
- ✅ Puedes presionar OK y continuar

---

## Test 5: ✅ Foto HEIC (iPhone)

### Pasos:
1. Toma una foto con la cámara del iPhone (formato HEIC por defecto)
2. Ve a **"Solicitar presupuesto"** → **"📷 Galería"**
3. Selecciona esa foto HEIC
4. Presiona **"Enviar solicitud"**

### Resultado Esperado ✅:
- ✅ La foto HEIC se convierte a JPG automáticamente
- ✅ En consola ves:
  ```
  ✅ Imagen convertida a JPG
  ```
- ✅ Se sube sin problemas
- ✅ **NO hay mensaje de "formato no soportado"**

---

## Test 6: 🔴 Falta de Sesión (Difícil de Reproducir)

### Pasos:
1. Login normal
2. Ve a **"Solicitar presupuesto"**
3. **Sin cerrar la app**, limpia AsyncStorage:
   ```bash
   # En DevTools (presiona 'j'):
   AsyncStorage.clear()
   ```
4. Selecciona foto
5. Presiona "Enviar solicitud"

### Resultado Esperado ✅:
- ✅ Ves alerta: *"Tu sesión ha expirado"*
- ✅ Botón "OK" te lleva a Login
- ✅ **NO CRASHEA** (esto es lo importante)

---

## Test 7: 🔴 Conexión Lenta (Simulado)

### Pasos:
1. Abre DevTools
2. En Red, selecciona "Slow 4G" o "Offline"
3. Intenta subir foto
4. **Importante**: Mientras sube, NO cierres la app

### Resultado Esperado ✅:
- ✅ Ves indicador de carga (Loading)
- ✅ App responde mientras carga
- ✅ Si falla por timeout:
  ```
  ⚠️ Error de conexión
  🔄 Reintentando...
  ```
- ✅ Luego de 2 reintentos, si sigue fallando, te dice

---

## Test 8: ✅ Foto CORRUPTA (Edge Case)

### Pasos:
1. Toma foto muy pixelada o oscura
2. O selecciona un PNG de galería
3. Intenta subir

### Resultado Esperado ✅:
- ✅ Se convierte a JPG de todas formas
- ✅ Se sube sin crash
- ✅ Si falla por tamaño, ves mensaje claro

---

## Checkpoints de Éxito

Marca las que pasaron ✓:

```
Subida de 1 foto: [ ]
Subida de múltiples fotos: [ ]
Captura con cámara: [ ]
Rechazo de permisos (sin crash): [ ]
Foto HEIC convertida: [ ]
Sesión expirada (muestra alerta): [ ]
Foto con conexión lenta: [ ]
NO CRASHEA en ningún escenario: [ ] ← ESTE ES EL MÁS IMPORTANTE
```

---

## Cómo Leer los Logs

### Éxito ✅:
```
✅ Sesión validada
📤 Subiendo imagen
✅ Imagen subida exitosamente
✅ Subida completada
```

### Error ❌:
```
❌ Error al subir imagen
❌ CRÍTICO: Usuario no autenticado
❌ Fallos: Imagen 1: [razón]
```

### Warning ⚠️:
```
⚠️ Error al subir, reintentando...
⚠️ No se pudo verificar el archivo
```

---

## Si Todo Funciona ✅

¡Excelente! El problema está resuelto. Ahora puedes:

1. Crear solicitudes con fotos sin miedo a crashes
2. Los permisos son claros si faltan
3. La sesión se valida correctamente
4. Los errores se muestran de forma clara

---

## Si Aún Hay Problemas ❌

Comparte esta información:

1. **¿En qué paso crashea?**
   - Test 1, 2, 3, etc.

2. **¿Qué dice el error?**
   - Captura de pantalla del crash

3. **¿Qué ves en la consola?**
   - Copia y pega los logs (especialmente los con ❌)

4. **¿Sistema operativo?**
   - iPhone/Android, versión

5. **¿Tipo de foto?**
   - JPG, PNG, HEIC, WebP, etc.

---

## Comandos Útiles

```bash
# Limpiar caché de React Native
rm -rf node_modules && npm install

# Reconstruir app (iOS)
cd ios && rm -rf Pods && pod install && cd ..

# Reconstruir app (Android)
./android/gradlew clean

# Ver logs en vivo
expo logs --ios    # o --android
```

---

**¡Gracias por probar y reportar! 🙌**
