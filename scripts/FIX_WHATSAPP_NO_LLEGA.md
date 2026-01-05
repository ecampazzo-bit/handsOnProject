# 🔧 Fix: WhatsApp No Llega (Edge Function Retorna Éxito)

## Problema
La Edge Function retorna `{"success": true, "messageSid": "..."}` pero el mensaje de WhatsApp no llega al teléfono.

## Causa Más Común: Twilio Sandbox

Si estás usando el **WhatsApp Sandbox** de Twilio (gratis), **DEBES registrar tu número primero**.

## Solución Paso a Paso

### Paso 1: Verificar si Estás en el Sandbox

1. Ve a: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
2. Busca el código de unión (ejemplo: `join abc-xyz`)
3. Verifica si tu número está en la lista de "To" permitidos

### Paso 2: Registrar tu Número en el Sandbox

Si tu número NO está registrado:

1. **Copia el código de unión** del dashboard de Twilio (ej: `join abc-xyz`)
2. **Envía un WhatsApp** desde tu teléfono (`+5493804663809`) a: `+1 415 523 8886`
3. **Mensaje**: `join abc-xyz` (reemplaza con tu código)
4. **Espera confirmación**: Deberías recibir "You're all set!"

**IMPORTANTE**: 
- El número debe estar en formato internacional: `+5493804663809`
- El mensaje debe ser exactamente: `join <codigo>` (sin comillas)
- Debes enviar desde WhatsApp, no SMS

### Paso 3: Verificar Logs de Twilio

1. Ve a: https://console.twilio.com/us1/monitor/logs/messaging
2. Busca los mensajes recientes
3. Revisa el estado:
   - ✅ `delivered` → Mensaje entregado
   - ⚠️ `sent` → Enviado pero no confirmado
   - ❌ `failed` → Falló (revisa el motivo)
   - ❌ `undelivered` → No entregado (probablemente no estás en sandbox)

### Paso 4: Verificar Variables de Entorno

En Supabase Dashboard → Edge Functions → `send-whatsapp-code` → Settings/Secrets:

Verifica que tengas:
- ✅ `TWILIO_ACCOUNT_SID` = Tu Account SID de Twilio
- ✅ `TWILIO_AUTH_TOKEN` = Tu Auth Token de Twilio
- ✅ `TWILIO_WHATSAPP_NUMBER` = `whatsapp:+14155238886` (para sandbox)

### Paso 5: Probar Manualmente la Edge Function

1. Ve a: Supabase Dashboard → Edge Functions → `send-whatsapp-code`
2. Haz clic en "Invoke function"
3. Ingresa:
```json
{
  "telefono": "+5493804663809",
  "codigo": "123456"
}
```
4. Revisa la respuesta:
   - Si retorna `success: true` → La función funciona
   - Si retorna error → Revisa el mensaje

### Paso 6: Revisar Logs de la Edge Function

1. Ve a: Edge Functions → `send-whatsapp-code` → Logs
2. Busca intentos recientes
3. Revisa:
   - `✅ Mensaje enviado exitosamente` → Funcionó
   - `❌ Error de Twilio` → Revisa el error específico

## Problemas Comunes y Soluciones

### Problema 1: "Unsubscribed recipient" en Twilio

**Causa**: Tu número no está registrado en el WhatsApp Sandbox

**Solución**: 
1. Ve a: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
2. Copia el código de unión
3. Envía WhatsApp desde tu número a `+1 415 523 8886` con el mensaje `join <codigo>`

### Problema 2: "Invalid phone number"

**Causa**: Formato de teléfono incorrecto

**Solución**: 
- Asegúrate que el teléfono esté en formato: `+5493804663809`
- Debe empezar con `+` y código de país

### Problema 3: Edge Function retorna éxito pero no llega

**Causa**: Twilio acepta el mensaje pero no puede entregarlo (sandbox)

**Solución**: 
- Verifica que estés en el sandbox (Paso 2)
- Revisa los logs de Twilio para ver el estado real del mensaje

### Problema 4: No hay logs en Twilio

**Causa**: La Edge Function no está llamando a Twilio correctamente

**Solución**:
- Verifica las variables de entorno
- Revisa los logs de la Edge Function
- Prueba la Edge Function manualmente

## Verificación Rápida

Ejecuta este script SQL para ver las últimas llamadas:

```sql
-- Ver últimas llamadas a la edge function
SELECT 
    id,
    url,
    method,
    created,
    error_msg,
    status_code
FROM net.http_request_queue
WHERE url LIKE '%send-whatsapp-code%'
ORDER BY created DESC
LIMIT 10;
```

## Checklist Final

- [ ] Número registrado en Twilio Sandbox
- [ ] Variables de entorno configuradas (3 variables)
- [ ] Edge function probada manualmente (retorna éxito)
- [ ] Logs de Twilio revisados (estado del mensaje)
- [ ] Logs de Edge Function revisados (sin errores)
- [ ] Formato de teléfono correcto (`+5493804663809`)

## Si Aún No Funciona

1. **Revisa los logs de Twilio** - El estado real del mensaje está ahí
2. **Verifica el sandbox** - Es obligatorio si usas sandbox
3. **Prueba con otro número** - Para descartar problemas del número específico
4. **Contacta soporte de Twilio** - Si el problema persiste

## Nota Importante

Si estás usando el **WhatsApp Sandbox** de Twilio (gratis), **SOLO puedes enviar mensajes a números que hayan enviado el código de unión**. Para producción, necesitas un número de WhatsApp verificado de Twilio.

