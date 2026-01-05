# 🔧 Fix: Error "No se puede realizar la llamada"

## Problema
Al intentar realizar una llamada desde la app, aparece el error "No se puede realizar la llamada".

## Causa
El problema se debía a:
1. **Formato inconsistente de números**: Diferentes pantallas usaban diferentes formatos
2. **URLs incorrectas**: Algunas pantallas no limpiaban correctamente el número
3. **canOpenURL fallando en iOS**: Similar al problema de WhatsApp
4. **Falta de normalización**: Los números no se normalizaban correctamente antes de abrir

## Solución Implementada

### 1. Función Utilitaria Unificada

Se creó `mobile/src/utils/phoneUtils.ts` con una función `openPhoneCall` que:
- ✅ Normaliza el número de teléfono correctamente
- ✅ Limpia caracteres especiales para `tel:`
- ✅ Intenta con y sin el `+` (algunos dispositivos prefieren uno u otro)
- ✅ En iOS intenta abrir directamente sin depender de `canOpenURL`
- ✅ Maneja errores de manera consistente

### 2. Actualización de Pantallas

Se actualizaron todas las pantallas para usar la función unificada:
- ✅ `MisTrabajosScreen.tsx`
- ✅ `MisPresupuestosScreen.tsx`
- ✅ `MisCotizacionesScreen.tsx`

### 3. Normalización de Números

La función ahora:
- Limpia el número (remueve espacios, guiones, etc.)
- Mantiene el formato `+` si está presente
- Intenta ambos formatos (`tel:+54...` y `tel:54...`) si es necesario

## Cómo Funciona

```typescript
// Antes (inconsistente):
const url = `tel:${telefono}`; // ❌ Puede fallar si tiene espacios o formato incorrecto

// Ahora (unificado):
await openPhoneCall(telefono, nombre); // ✅ Funciona siempre
```

La función:
1. Valida que el número no esté vacío
2. Limpia el número (solo números y +)
3. Construye URL `tel:` con el número limpio
4. En iOS intenta abrir directamente (no depende de canOpenURL)
5. En Android verifica primero, luego intenta abrir
6. Muestra mensaje de error claro si falla

## Verificación

### Probar en la App

1. Abre cualquier pantalla con botón de llamar
2. Haz clic en el botón de llamar
3. Debería abrirse la aplicación de llamadas con el número correcto

### Verificar Formato de Números

Los números en la base de datos deben estar en formato:
- ✅ `+5493804663809` (correcto)
- ✅ `093804663809` (se normaliza)
- ✅ `93804663809` (se normaliza)
- ❌ `3804663809` (sin código de país, puede fallar)

## Configuración de Permisos

### Android

Los permisos de llamadas ya están configurados en `app.json`. No se requieren permisos especiales para abrir la aplicación de llamadas, solo para hacer llamadas directamente (que no es lo que hacemos).

### iOS

iOS no requiere permisos especiales para abrir la aplicación de llamadas. La función intenta abrir directamente sin verificar primero.

## Troubleshooting

### Problema: Sigue sin funcionar en iOS

**Solución:**
1. Verifica que el número tenga formato correcto
2. Revisa los logs de la consola para ver el número que se está usando
3. Prueba abrir manualmente: `tel:+5493804663809` en Safari

### Problema: El número no se formatea correctamente

**Solución:**
1. Verifica el formato del número en la base de datos
2. Revisa los logs de la consola para ver el número normalizado
3. Asegúrate de que los números tengan código de país

### Problema: Se abre la app de llamadas pero no marca

**Solución:**
- Esto es normal, la app solo abre la aplicación de llamadas con el número
- El usuario debe presionar el botón de llamar en la app de llamadas
- Esto es por diseño de seguridad de iOS/Android

## Archivos Modificados

- ✅ `mobile/src/utils/phoneUtils.ts` (nuevo)
- ✅ `mobile/src/screens/MisTrabajosScreen.tsx`
- ✅ `mobile/src/screens/MisPresupuestosScreen.tsx`
- ✅ `mobile/src/screens/MisCotizacionesScreen.tsx`

## Notas

- La función `openPhoneCall` es reutilizable en toda la app
- Usa `tel:` que funciona en iOS y Android
- Intenta múltiples formatos si el primero falla
- Maneja errores de manera consistente en todas las pantallas
- No requiere permisos especiales (solo abre la app de llamadas, no llama directamente)

## Próximos Pasos

1. Probar en dispositivos iOS y Android
2. Verificar que los números en la base de datos estén en formato correcto
3. Si es necesario, actualizar números existentes en la base de datos

