# ⚡ Cheat Sheet: Android Fix en 30 Segundos

## El Problema
```
iOS:     ✅ Fotos funcionan
Android: ❌ La app crashea
```

## La Causa
```
Android = Lento
iOS = Rápido
```

## La Solución
```typescript
import { Platform } from "react-native";

// 1. Espera mayor
const waitTime = Platform.OS === 'android' ? 500 : 300;

// 2. Más reintentos
const maxRetries = Platform.OS === 'android' ? 5 : 3;

// 3. Esperas más largas
const waitMs = Platform.OS === 'android' ? 800 : 500;

// 4. Pantalla de edición
allowsEditing: Platform.OS === 'android'

// 5. Espera post-captura
if (Platform.OS === 'android') {
  await new Promise(r => setTimeout(r, 200));
}
```

## El Resultado
```
iOS:     ~1s (igual)
Android: ~3-4s (pero FUNCIONA)
```

## Archivos Afectados
```
mobile/src/services/solicitudService.ts
(7 cambios, ~20 líneas, 100% backwards compatible)
```

## Testing
```bash
1. npm start
2. r (reload)
3. Android: Toma foto → Envía → ✅ No crashea
4. iOS: Toma foto → Envía → ✅ Rápido (como antes)
```

## Logs Esperados

### Android
```
⏳ Android: esperando 200ms...
⏳ Esperando 500ms...
📤 Leyendo archivo (intento 1/5)...
✅ Imagen subida exitosamente
```

### iOS
```
⏳ Esperando 300ms... (not 500)
📤 Leyendo archivo (intento 1/3)... (not 1/5)
✅ Imagen subida exitosamente
```

## Si No Funciona
```
1. Aumenta 500ms a 700ms
2. Aumenta 5 reintentos a 7
3. Aumenta 800ms a 1000ms
4. Revisa logs
```

## Documentación Completa
```
COMPARATIVA_IOS_VS_ANDROID.md      (lectura rápida)
DIAGNOSTICO_ANDROID_VS_IOS.md      (análisis profundo)
TEST_ANDROID_VS_IOS.md              (cómo probar)
```

---

**Datetime**: 3 de enero de 2026  
**Status**: ✅ Listo
**Complejidad**: 🟢 Baja
**Risk**: 🟢 Bajo
