# 🐛 Debug: WhatsApp No Disponible

## Pasos para Diagnosticar

### 1. Verificar Logs en la Consola

Cuando presionas el botón de WhatsApp, deberías ver en la consola:
```
📱 Intentando abrir WhatsApp para: +5493804663809 (5493804663809)
```

Si no ves este log, la función no se está llamando.

### 2. Verificar Formato del Número

Ejecuta en la consola de la app:
```javascript
// Ver qué número se está pasando
console.log("Número recibido:", telefono);
```

El número debería estar en formato:
- ✅ `+5493804663809`
- ✅ `093804663809` (se normaliza a +5493804663809)
- ❌ `3804663809` (sin código de país)

### 3. Verificar que WhatsApp Está Instalado

**En Android:**
- Abre WhatsApp manualmente
- Si no se abre, instálalo desde Google Play

**En iOS:**
- Abre WhatsApp manualmente
- Si no se abre, instálalo desde App Store

### 4. Probar URL Manualmente

Abre el navegador en tu dispositivo y prueba:
```
https://wa.me/5493804663809?text=Hola
```

Si esto funciona, el problema está en la app. Si no funciona, el problema puede ser el número.

### 5. Verificar Configuración de iOS

Si estás en iOS, verifica que `app.json` tenga:
```json
"LSApplicationQueriesSchemes": [
  "whatsapp",
  "whatsapp-business"
]
```

Luego reconstruye la app:
```bash
cd mobile
npx expo run:ios
```

### 6. Verificar en Android

En Android, la configuración debería funcionar automáticamente. Si no funciona:
1. Verifica que WhatsApp esté instalado
2. Prueba abrir WhatsApp manualmente
3. Reconstruye la app: `npx expo run:android`

## Soluciones por Plataforma

### iOS

**Problema**: `canOpenURL` retorna `false` incluso con WhatsApp instalado

**Solución**: La función ahora intenta abrir directamente sin verificar primero.

**Si sigue fallando:**
1. Verifica que `LSApplicationQueriesSchemes` esté en `app.json`
2. Reconstruye la app completamente
3. Verifica que WhatsApp esté realmente instalado

### Android

**Problema**: La URL no se abre

**Solución**: La función intenta múltiples formatos de URL.

**Si sigue fallando:**
1. Verifica que WhatsApp esté instalado
2. Prueba abrir WhatsApp manualmente
3. Verifica los logs de Android Studio

## Logs a Revisar

Busca en la consola:
- `📱 Intentando abrir WhatsApp para:` - La función se está ejecutando
- `⚠️ canOpenURL falló` - iOS no puede verificar, pero intentará abrir
- `⚠️ wa.me falló` - La URL wa.me no funcionó, intentando nativo
- `❌ Error al abrir WhatsApp:` - Error específico

## Prueba Rápida

1. Abre cualquier pantalla con botón de WhatsApp
2. Presiona el botón
3. Revisa la consola para ver los logs
4. Si ves `❌ Error`, copia el mensaje completo

## Si Nada Funciona

1. **Verifica el número**: Asegúrate de que el número en la base de datos sea correcto
2. **Prueba manualmente**: Abre `https://wa.me/5493804663809` en el navegador
3. **Reinstala WhatsApp**: Desinstala y reinstala WhatsApp
4. **Reconstruye la app**: `npx expo run:ios` o `npx expo run:android`
