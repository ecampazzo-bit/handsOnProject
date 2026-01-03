# Test Rápido: Carga de Foto de Perfil en Android

**Duración:** 5 minutos
**Objetivo:** Verificar que la carga de foto de perfil NO causa crash en Android

## Pasos de Testing

### 1. Preparar la App
```bash
cd mobile
npm run android
```
Esperar a que la app se compile e instale en el dispositivo.

### 2. Login
- Inicia sesión con una cuenta válida
- Deberías ver la pantalla principal

### 3. Navegar a Gestión de Cuenta
- Presiona el botón de menú o perfil (arriba a la derecha)
- Selecciona "Gestión de Cuenta" o "Editar Perfil"

### 4. Test 1: Subir foto desde Cámara
**Pasos:**
1. Presiona "Cambiar foto de perfil" o "Editar avatar"
2. Selecciona "Cámara"
3. Toma una foto (puede ser cualquier cosa)
4. Presiona "OK" o "Confirmar"

**Verificación:**
- ✅ **Esperado:** La app inicia la carga
- ✅ **Esperado:** Esperas 3-4 segundos mientras se procesa
- ✅ **Esperado:** Aparece la nueva foto en el perfil
- ✅ **Esperado:** No hay crash, no se reinicia la app
- ✅ **Log útil:** Abre la consola y deberías ver:
  ```
  📤 Leyendo archivo de avatar (intento 1/5)...
  ✅ Archivo leído: XXXXX caracteres base64
  ✅ ArrayBuffer creado: XXXXX bytes
  ```

**Si hay error:**
- ❌ Error RLS: Significa que la sesión expiró, login nuevamente
- ❌ Error ENOENT: El archivo no se escribió (timeout excedido)
- ❌ Crash sin logs: Problema en captura de foto

### 5. Test 2: Subir foto desde Galería (Verificación de Regresión)
**Pasos:**
1. Presiona "Cambiar foto de perfil"
2. Selecciona "Galería"
3. Selecciona una foto
4. Presiona "OK" o "Confirmar"

**Verificación:**
- ✅ **Esperado:** Funciona inmediatamente (< 2 segundos)
- ✅ **Esperado:** Nueva foto aparece en perfil
- ✅ **Esperado:** No hay crash

### 6. Test 3: Registro con Foto (Opcional)
Si quieres también probar en RegisterScreen:
1. Logout y crea una cuenta nueva
2. Durante el registro, intenta cargar foto desde cámara
3. Verifica mismo comportamiento (3-4 segundos, sin crash)

## Interpretación de Resultados

### Escenario A: ✅ TODO FUNCIONA
```
Foto de cámara:   ✅ Se carga en 3-4s, no hay crash
Foto de galería:  ✅ Se carga en 1-2s, no hay crash
Logs:             ✅ Muestran "intento 1/5"
Conclusión:       🎉 FIXES FUNCIONANDO - PROBLEMA RESUELTO
```

### Escenario B: ⚠️ FUNCIONA LENTAMENTE
```
Foto de cámara:   ✅ Se carga pero tarda 4-5s
Foto de galería:  ✅ Se carga normal
Logs:             ⚠️ Muestran "intento 2/5" o más reintentos
Conclusión:       📊 PARCIALMENTE FUNCIONAL - Android más lento de lo esperado
Próximo paso:     Aumentar timeout de 500ms a 600-700ms
```

### Escenario C: ❌ AÚN FALLA
```
Foto de cámara:   ❌ Crash o "Error ENOENT"
Foto de galería:  ✅ Funciona
Logs:             ❌ No aparecen los logs, o error en intento 5/5
Conclusión:       🔴 PROBLEMA NO RESUELTO
Próximo paso:     Investigar dispositivo específico, puede necesitar timeout aún mayor
```

### Escenario D: 🔴 REGRESIÓN EN iOS
```
iPhone:           ❌ Ahora es muy lento (> 5s) o falla
Android:          ✅ Funciona
Conclusión:       ⚠️ REGRESIÓN - Los fixes afectaron iOS negativamente
Próximo paso:     Ajustar Platform checks, iOS no debería verse afectado
```

## Console Logs Reference

### Logs Esperados (Success)
```log
🔄 Convirtiendo avatar a JPG...
✅ Avatar convertido a JPG
📤 Leyendo archivo de avatar (intento 1/5): file://...
📁 Archivo encontrado: 145230 bytes
✅ Archivo leído: 193640 caracteres base64
✅ ArrayBuffer creado: 145230 bytes
📤 Subiendo avatar a: USER_ID/avatar.jpg
⏳ Subiendo a Storage...
✅ Imagen subida correctamente
```

### Logs Warning (Reintentos, pero funciona)
```log
📤 Leyendo archivo de avatar (intento 1/5)...
⚠️ Archivo vacío (0 bytes), esperando 800ms e intentando de nuevo...
📤 Leyendo archivo de avatar (intento 2/5)...
📁 Archivo encontrado: 145230 bytes
✅ Archivo leído: 193640 caracteres base64
✅ ArrayBuffer creado: 145230 bytes
```

### Logs Error (Falla después de reintentos)
```log
📤 Leyendo archivo de avatar (intento 1/5)...
⚠️ Error al leer (intento 1/5): ENOENT: no such file or directory
[Repite para intentos 2/3/4/5]
❌ Error al leer archivo de avatar después de 5 intentos: ENOENT
```

## Recolección de Información para Debug

Si hay problema, copia esta información:

```
Dispositivo:          [Tu modelo de Android]
Android Version:      [Ej: Android 13]
Sesión:               45cbf3df-89d6-45cf-abd5-d356f3968dde
Problema:             [Describe qué falla]
Último Log:           [Copia el último mensaje de error]
Tiempo de Espera:     [Cuánto tiempo esperó antes de fallar]
Ubicación Cámara:     [Foto tomada de cámara frontal o trasera]
```

## Próximos Pasos Según Resultado

### Si Test es exitoso (Escenario A):
1. Crear más usuarios de prueba
2. Probar en diferentes dispositivos Android (si es posible)
3. Probar iOS para verificar no hay regresión
4. Cerrar el issue como RESOLVED

### Si hay reintentos (Escenario B):
1. Aumentar timeout en profileService.ts:
   - `500ms` → `700ms` en convertToJPG
   - `800ms` → `1000ms` en retry waits
2. Re-testear

### Si falla (Escenario C):
1. Capturar logs completos
2. Aumentar máximos:
   - `maxRetries: 5` → `maxRetries: 7` en Android
   - `800ms` → `1200ms` en retry waits
3. Considerar agregar logging adicional

### Si regresión iOS (Escenario D):
1. Revisar Platform checks en código
2. Verificar que iOS no tenga esperas adicionales
3. Reducir timeouts en iOS si están demasiado altos

---

**Ready:** ✅ Todos los fixes compilados sin errores
**Próximo:** Ejecutar tests en dispositivos reales (Android y iOS)
