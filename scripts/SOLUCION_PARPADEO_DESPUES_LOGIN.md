# 🔧 Solución: Pantalla Parpadeando Después del Login

## 🐛 Problema

Después de hacer login, la pantalla queda parpadeando o haciendo flicker en lugar de navegar correctamente a la pantalla Home.

## ✅ Soluciones Implementadas

### 1. Optimización de Navegación en AuthNavigator

Se implementaron las siguientes mejoras:

- ✅ **Flag de navegación única:** Previene múltiples navegaciones simultáneas
- ✅ **Timeout mejorado:** Aumentado a 300ms para dar tiempo a que la transición se estabilice
- ✅ **Verificación de estado:** Solo actualiza `isAuthenticated` si realmente cambió
- ✅ **Limpieza de timeouts:** Previene memory leaks y navegaciones duplicadas
- ✅ **Manejo de errores:** Try-catch alrededor de las navegaciones

### 2. Optimización de HomeScreen

- ✅ **useFocusEffect optimizado:** Ya no recarga el usuario cada vez que se enfoca (solo notificaciones)
- ✅ **Sin navegación inmediata:** Ya no navega a Login directamente desde HomeScreen, deja que AuthNavigator maneje esto

### 3. Configuración de Stack Navigator

- ✅ **gestureEnabled: false:** Deshabilita gestos para evitar navegación accidental
- ✅ **detachInactiveScreens: true:** Optimización de rendimiento

---

## 🔍 Diagnóstico

El parpadeo generalmente ocurre por:

1. **Múltiples navegaciones:** El `onAuthStateChange` se dispara múltiples veces (INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED) y cada uno intenta navegar
2. **Re-renders infinitos:** El estado `isAuthenticated` cambia repetidamente causando re-renders
3. **Conflicto de listeners:** Múltiples listeners de autenticación compitiendo
4. **React Native Reanimated:** Puede causar problemas de renderizado si no está configurado correctamente

---

## 🔧 Verificaciones Adicionales

### 1. Verificar que React Native Reanimated esté configurado correctamente

El archivo `babel.config.js` debe tener el plugin de Reanimated **al final**:

```javascript
plugins: [
  'react-native-reanimated/plugin', // ← Debe ser el ÚLTIMO plugin
],
```

### 2. Limpiar cache y reconstruir

```bash
cd mobile

# Limpiar cache de Metro
rm -rf .expo
rm -rf node_modules/.cache

# Limpiar cache de React Native
npm start -- --reset-cache
```

### 3. Verificar logs en consola

Revisa los logs cuando ocurre el parpadeo. Deberías ver mensajes como:
- "AuthNavigator - Cambio de estado: SIGNED_IN"
- "Sesión restaurada/iniciada, navegando a Home"

Si ves estos mensajes múltiples veces rápidamente, hay navegaciones duplicadas.

---

## 🎯 Solución Rápida

Si el problema persiste después de los cambios:

### Opción 1: Aumentar el delay de navegación

En `AuthNavigator.tsx`, busca el `setTimeout` y aumenta el delay:

```typescript
setTimeout(() => {
  // ...
}, 500); // Aumentar de 300ms a 500ms
```

### Opción 2: Deshabilitar animaciones temporalmente

En `AuthNavigator.tsx`, cambiar:

```typescript
screenOptions={{
  animationEnabled: false, // Deshabilitar animaciones temporalmente
  // ...
}}
```

### Opción 3: Verificar React Native Reanimated

Si usas Reanimated y causa problemas, prueba deshabilitarlo temporalmente:

```bash
# En babel.config.js, comentar temporalmente:
// 'react-native-reanimated/plugin',
```

Luego reconstruir:
```bash
cd mobile
npm start -- --reset-cache
```

---

## 📋 Checklist de Verificación

Después de aplicar las soluciones, verifica:

- [ ] El parpadeo desapareció
- [ ] La navegación a Home es suave después del login
- [ ] No hay logs de errores en la consola
- [ ] La app funciona correctamente en modo standalone (APK)
- [ ] El estado de autenticación se mantiene correctamente

---

## 🔄 Si el Problema Persiste

### 1. Generar nuevo APK con los cambios

```bash
cd mobile
./generar-apk-standalone.sh
```

O si prefieres Debug (más rápido):

```bash
cd mobile/android
./gradlew clean
./gradlew assembleDebug
```

### 2. Verificar en dispositivo físico

A veces el parpadeo solo ocurre en builds de producción. Prueba:

```bash
# APK Debug
cd mobile/android
./gradlew assembleDebug

# Instalar
adb install app/build/outputs/apk/debug/app-debug.apk
```

### 3. Revisar logs de Android

```bash
# Ver logs en tiempo real
adb logcat | grep -i "react\|expo\|navigation"

# O filtrar por tu app
adb logcat | grep "com.ofisi.mobile"
```

### 4. Verificar memoria

El parpadeo puede ser causado por falta de memoria. Verifica:

```bash
# Ver uso de memoria
adb shell dumpsys meminfo com.ofisi.mobile
```

---

## 💡 Solución Alternativa: Simplificar Navegación

Si nada funciona, puedes simplificar el flujo de navegación usando `navigation.replace` directamente desde LoginScreen en lugar de depender de `onAuthStateChange`:

```typescript
// En LoginScreen.tsx, después de login exitoso:
if (user) {
  // Navegar directamente
  navigation.replace("Home");
}
```

Pero esto requiere eliminar la navegación automática de `AuthNavigator` para evitar conflictos.

---

## 📝 Cambios Realizados

Los siguientes archivos fueron modificados para solucionar el parpadeo:

1. **`mobile/src/navigation/AuthNavigator.tsx`**
   - Agregado flag `navigationHandledRef` para prevenir múltiples navegaciones
   - Aumentado delay de navegación a 300ms
   - Agregado cleanup de timeouts
   - Mejorado manejo de estado para evitar re-renders innecesarios

2. **`mobile/src/screens/HomeScreen.tsx`**
   - Optimizado `useFocusEffect` para no recargar usuario innecesariamente
   - Removida navegación directa a Login (deja que AuthNavigator maneje)

---

## ✅ Resultado Esperado

Después de estos cambios:

1. ✅ Login exitoso
2. ✅ Transición suave a Home (sin parpadeos)
3. ✅ Estado de autenticación estable
4. ✅ Sin re-renders innecesarios
5. ✅ Navegación fluida

---

## 🚨 Si Nada Funciona

Como último recurso, puedes intentar:

1. **Regenerar el proyecto Android desde cero:**
   ```bash
   cd mobile
   rm -rf android
   npx expo prebuild --platform android
   ```

2. **Verificar versión de React Navigation:**
   ```bash
   npm list @react-navigation/native @react-navigation/stack
   ```

3. **Actualizar dependencias:**
   ```bash
   cd mobile
   npm update @react-navigation/native @react-navigation/stack react-native-reanimated
   ```

---

**Nota:** Los cambios ya aplicados deberían resolver el problema del parpadeo. Si persiste después de generar un nuevo APK, revisa los logs para identificar la causa específica.
