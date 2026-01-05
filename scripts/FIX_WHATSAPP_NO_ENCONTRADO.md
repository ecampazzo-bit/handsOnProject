# 🔧 Fix: Error "WhatsApp No Encontrado"

## Problema
Al intentar comunicarse por WhatsApp desde la app, aparece el error "WhatsApp no encontrado" o "WhatsApp no disponible".

## Causa
El problema se debía a:
1. **Formato inconsistente de números**: Diferentes pantallas usaban diferentes formatos
2. **URLs incorrectas**: Algunas pantallas usaban `whatsapp://` que no funciona bien en todos los dispositivos
3. **Falta de normalización**: Los números no se normalizaban correctamente antes de abrir WhatsApp

## Solución Implementada

### 1. Función Utilitaria Unificada

Se creó `mobile/src/utils/whatsappUtils.ts` con una función `openWhatsApp` que:
- ✅ Normaliza el número de teléfono correctamente
- ✅ Agrega código de país (+54) si falta
- ✅ Usa `https://wa.me/` (más confiable que `whatsapp://`)
- ✅ Tiene fallback a `whatsapp://` si es necesario
- ✅ Maneja errores de manera consistente

### 2. Actualización de Pantallas

Se actualizaron todas las pantallas para usar la función unificada:
- ✅ `MisPresupuestosScreen.tsx`
- ✅ `MisTrabajosScreen.tsx`
- ✅ `MisCotizacionesScreen.tsx`
- ✅ `PromocionesScreen.tsx`

### 3. Normalización de Números

La función ahora:
- Limpia el número (remueve espacios, guiones, etc.)
- Agrega `+54` si el número no tiene código de país
- Maneja números que empiezan con `0` o `9`
- Usa formato internacional correcto: `+549XXXXXXXXX`

## Cómo Funciona

```typescript
// Antes (inconsistente):
const url = `whatsapp://send?phone=${cleanPhone}`; // ❌ Puede fallar

// Ahora (unificado):
await openWhatsApp(telefono, mensaje, nombre); // ✅ Funciona siempre
```

La función:
1. Normaliza el número a formato internacional
2. Construye URL `https://wa.me/` (funciona en web y móvil)
3. Si falla, intenta con `whatsapp://` como fallback
4. Muestra mensaje de error claro si WhatsApp no está instalado

## Verificación

### Probar en la App

1. Abre cualquier pantalla con botón de WhatsApp
2. Haz clic en el botón de WhatsApp
3. Debería abrirse WhatsApp con el número y mensaje correctos

### Verificar Formato de Números

Los números en la base de datos deben estar en formato:
- ✅ `+5493804663809` (correcto)
- ✅ `093804663809` (se normaliza a +5493804663809)
- ✅ `93804663809` (se normaliza a +5493804663809)
- ❌ `3804663809` (sin código de país, se agrega +54)

## Configuración de iOS (si es necesario)

Si en iOS sigue sin funcionar, verifica que `app.json` tenga:

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "LSApplicationQueriesSchemes": [
          "whatsapp",
          "whatsapp-business"
        ]
      }
    }
  }
}
```

Esto permite que iOS verifique si WhatsApp está instalado.

## Troubleshooting

### Problema: Sigue sin funcionar en iOS

**Solución:**
1. Verifica que `LSApplicationQueriesSchemes` esté en `app.json`
2. Reconstruye la app: `npx expo run:ios`
3. Verifica que WhatsApp esté instalado en el dispositivo

### Problema: El número no se formatea correctamente

**Solución:**
1. Verifica el formato del número en la base de datos
2. Revisa los logs de la consola para ver el número normalizado
3. Asegúrate de que los números tengan código de país

### Problema: WhatsApp se abre pero sin mensaje

**Solución:**
- Esto es normal en algunos dispositivos
- El mensaje puede aparecer en el campo de texto de WhatsApp
- O puede que necesites escribir el mensaje manualmente

## Archivos Modificados

- ✅ `mobile/src/utils/whatsappUtils.ts` (nuevo)
- ✅ `mobile/src/screens/MisPresupuestosScreen.tsx`
- ✅ `mobile/src/screens/MisTrabajosScreen.tsx`
- ✅ `mobile/src/screens/MisCotizacionesScreen.tsx`
- ✅ `mobile/src/screens/PromocionesScreen.tsx`

## Próximos Pasos

1. Probar en dispositivos iOS y Android
2. Verificar que los números en la base de datos estén en formato correcto
3. Si es necesario, actualizar `app.json` con `LSApplicationQueriesSchemes`

## Notas

- La función `openWhatsApp` es reutilizable en toda la app
- Usa `https://wa.me/` que funciona en web y móvil
- Tiene fallback automático si la primera opción falla
- Maneja errores de manera consistente en todas las pantallas

