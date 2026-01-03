# 🚀 GUÍA DE ACTUALIZACIÓN: Solución del Crash

## Paso 1: Actualizar el Código

El código ya está actualizado en estos archivos:

1. ✅ `mobile/src/services/solicitudService.ts` - Actualizado
2. ✅ `mobile/src/screens/SolicitarPresupuestoScreen.tsx` - Actualizado

---

## Paso 2: Reinstalar Dependencias

```bash
# Navega a la carpeta mobile
cd /Users/ecampazzo/Documents/Dev/handsOnProject/mobile

# Elimina node_modules y package-lock
rm -rf node_modules package-lock.json

# Reinstala
npm install
```

---

## Paso 3: Reconstruir la App

### Para iOS:
```bash
cd /Users/ecampazzo/Documents/Dev/handsOnProject/mobile

# Limpia Pods
rm -rf ios/Pods

# Reconstruye
npm run start
# Presiona 'i' para iOS
```

### Para Android:
```bash
cd /Users/ecampazzo/Documents/Dev/handsOnProject/mobile

# Limpia Gradle
./android/gradlew clean

# Reconstruye
npm run start
# Presiona 'a' para Android
```

---

## Paso 4: Verifica la Instalación

### En la Terminal:
Deberías ver algo como:
```
✓ App opened on http://localhost:19000
To open the app, scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

### En la App:
1. Inicia sesión
2. Ve a "Solicitar presupuesto"
3. Intenta agregar una foto
4. ✅ Debería funcionar SIN CRASH

---

## Paso 5: Verificar los Cambios

### En Editor (VS Code):
1. Abre `mobile/src/services/solicitudService.ts`
2. Busca `validateUserSession` (línea ~114)
3. ✅ Debería existir la nueva función

4. Abre `mobile/src/screens/SolicitarPresupuestoScreen.tsx`
5. Busca `handlePickImages` (línea ~44)
6. ✅ Debería tener mejor manejo de errores

---

## Paso 6: Prueba Rápida (5 minutos)

```
1. Login ✓
2. Home → Solicitar presupuesto ✓
3. Selecciona foto de galería ✓
4. Presiona "Enviar solicitud" ✓
5. ✅ No debería crashear
```

Si crashea, ve a "Solución de Problemas" abajo.

---

## Paso 7: Prueba Completa (Opcional)

Ver archivo: **TEST_CRASH_FOTOS.md** para 8 tests completos

---

## Verificación de Cambios

### Cambio 1: Nueva función en solicitudService.ts

**Ubicación**: Línea ~114

```typescript
const validateUserSession = async (): Promise<string> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("❌ CRÍTICO: Usuario no autenticado");
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("❌ CRÍTICO: No hay sesión activa");
    
    console.log(`✅ Sesión validada para usuario: ${user.id}`);
    return user.id;
  } catch (error) {
    console.error("Error validando sesión:", error);
    throw error;
  }
};
```

**Verificación**: ✅ Debe existir esta función

---

### Cambio 2: Reintentos en uploadSolicitudImages()

**Ubicación**: Línea ~145

```typescript
export const uploadSolicitudImages = async (
  solicitudId: number,
  imageUris: string[],
  maxRetries: number = 2  // ← NUEVO PARÁMETRO
)
```

**Dentro**: Sistema de reintentos con `while` loop

**Verificación**: ✅ Debe haber parámetro maxRetries

---

### Cambio 3: Mejor manejo en handleTakePhoto()

**Ubicación**: Línea ~56 en SolicitarPresupuestoScreen.tsx

```typescript
const handleTakePhoto = async () => {
  try {
    console.log("📸 Abriendo cámara...");  // ← NUEVO LOG
    const photo = await takePhoto();
    if (photo) {
      setFotos([...fotos, photo]);
      Alert.alert("Éxito", "Foto agregada a la solicitud");  // ← NUEVO
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);  // ← MEJORADO
    
    if (errorMessage.includes("permisos")) {  // ← NUEVO CHEQUEO
      Alert.alert(
        "Permisos requeridos",
        "La app necesita acceso a tu cámara. Por favor, habilita los permisos en Ajustes."
      );
    }
    // ...
  }
};
```

**Verificación**: ✅ Debe haber mejora en error handling

---

### Cambio 4: Validación en handleSubmit()

**Ubicación**: Línea ~95 en SolicitarPresupuestoScreen.tsx

Antes de crear solicitud:
```typescript
if (!user) {
  console.error("❌ No se pudo obtener el usuario");
  Alert.alert(
    "Error de autenticación",
    "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
    [{ text: "OK", onPress: () => navigation.navigate("Login") }]  // ← NUEVO
  );
  return;
}
```

**Verificación**: ✅ Debe redirigir a Login si sesión falla

---

## Solución de Problemas

### Problema: "Command not found: npm"

```bash
# Instala Node.js desde:
# https://nodejs.org/

# Verifica:
node --version
npm --version

# Luego intenta de nuevo
npm install
```

---

### Problema: "EACCES: permission denied"

```bash
# En macOS, usa sudo:
sudo npm install

# O instala sin sudo:
npm install --no-save expo-cli
```

---

### Problema: "Pod install failed" (iOS)

```bash
cd mobile/ios
rm -rf Pods
pod install
cd ..
```

---

### Problema: App aún crashea después de actualizar

1. ✅ Verifica que los archivos se actualizaron:
   ```bash
   grep -n "validateUserSession" mobile/src/services/solicitudService.ts
   ```
   - Debe mostrar resultados (si está vacío = no se actualizó)

2. ✅ Limpia caché:
   ```bash
   watchman watch-del-all
   cd mobile
   rm -rf node_modules
   npm install
   npm start
   ```

3. ✅ En la terminal de Expo, presiona:
   - `c` para limpiar caché
   - `r` para recargar

---

### Problema: Logs no aparecem

1. Abre DevTools:
   - En terminal: Presiona `j`
   - O en el navegador: `http://localhost:19000`

2. Abre la consola:
   - Chrome DevTools (F12) → Console

3. Filtra por tus logs:
   - Búsca `uploadSolicitud` o `Cámara`

---

## Rollback (Si Necesitas Volver)

Si algo sale mal y necesitas revertir:

```bash
cd /Users/ecampazzo/Documents/Dev/handsOnProject

# Ver el historial
git log --oneline | head -10

# Revertir al commit anterior
git revert HEAD
# O
git checkout HEAD~1 -- mobile/src/services/solicitudService.ts
git checkout HEAD~1 -- mobile/src/screens/SolicitarPresupuestoScreen.tsx
```

---

## Verificación Final

```bash
# Ejecuta esto en la carpeta mobile:

# 1. Verifica que exista el código nuevo
echo "=== Buscando validateUserSession ==="
grep -c "validateUserSession" src/services/solicitudService.ts
# Resultado: debe ser > 0

# 2. Verifica que el logging esté actualizado
echo "=== Buscando logs nuevos ==="
grep -c "📸 Abriendo cámara" src/screens/SolicitarPresupuestoScreen.tsx
# Resultado: debe ser > 0

# 3. Verifica que haya reintentos
echo "=== Buscando reintentos ==="
grep -c "maxRetries" src/services/solicitudService.ts
# Resultado: debe ser > 1
```

Si todos salen `> 0`, ¡la actualización fue exitosa! ✅

---

## Próximas Acciones

1. **Prueba la app** (5 min)
   - Intenta subir una foto
   - Verifica que no crashee

2. **Si funciona**: ✅ ¡Problema resuelto!

3. **Si aún falla**:
   - Abre los logs (DevTools)
   - Copia los mensajes de error
   - Comparte los logs para debugging

---

## Soporte

Si tienes preguntas o problemas:

1. **Documentación del problema**:
   - Ver: **DIAGNOSTICO_CRASH_FOTOS.md**

2. **Documentación de la solución**:
   - Ver: **SOLUCION_CRASH_FOTOS.md**

3. **Guía de pruebas**:
   - Ver: **TEST_CRASH_FOTOS.md**

4. **Resumén ejecutivo**:
   - Ver: **RESUMEN_SOLUCION_FOTOS.md**

---

**¡Listo para empezar! 🚀**

Ejecuta:
```bash
cd /Users/ecampazzo/Documents/Dev/handsOnProject/mobile
npm install
npm start
```
