# 🚨 Solución Inmediata: No Llega el WhatsApp

## ⚡ Verificación Rápida (5 minutos)

### 1. ¿Estás en el WhatsApp Sandbox? (MÁS COMÚN)

Si usas el **WhatsApp Sandbox** de Twilio (gratis), **DEBES unirte primero**:

1. Ve a: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
2. Busca el código de unión (ej: `join <codigo>`)
3. **Envía un mensaje de WhatsApp** desde tu teléfono a: `+1 415 523 8886`
4. Con el mensaje: `join <codigo>` (reemplaza `<codigo>` con el código que aparece)
5. Deberías recibir: "You're all set! You can send messages to this number."

**Si NO haces esto, NO recibirás mensajes.**

### 2. Probar Edge Function Directamente

1. Ve a: Supabase Dashboard → Edge Functions → `send-whatsapp-code`
2. Haz clic en **"Invoke function"**
3. Ingresa:
```json
{
  "telefono": "+5491112345678",
  "codigo": "123456"
}
```
4. Revisa la respuesta:
   - ✅ `"success": true` → La función funciona
   - ❌ Error → Revisa el mensaje

### 3. Verificar Variables de Entorno

En Edge Functions → `send-whatsapp-code` → Settings/Secrets:

- `TWILIO_ACCOUNT_SID` = (tu Account SID)
- `TWILIO_AUTH_TOKEN` = (tu Auth Token)
- `TWILIO_WHATSAPP_NUMBER` = `whatsapp:+14155238886` (para sandbox)

**IMPORTANTE:** El número debe ser exactamente `whatsapp:+14155238886` (con el prefijo `whatsapp:`)

### 4. Revisar Logs de Edge Function

1. Ve a: Edge Functions → `send-whatsapp-code` → **Logs**
2. Busca intentos recientes
3. Revisa los mensajes:
   - `✅ Mensaje enviado exitosamente` → Funcionó
   - `❌ Error de Twilio` → Revisa el error específico

### 5. Revisar Logs de Twilio

1. Ve a: https://console.twilio.com/us1/monitor/logs/messaging
2. Busca intentos de envío recientes
3. Revisa el estado:
   - `queued` → En cola (espera unos segundos)
   - `sent` → Enviado
   - `delivered` → Entregado
   - `failed` → Falló (revisa el motivo)
   - `undelivered` → No entregado (puede ser que no estés en el sandbox)

## 🔧 Soluciones por Error

### Error: "Unsubscribed recipient"
**Solución:** Únete al WhatsApp Sandbox (ver paso 1)

### Error: "Invalid phone number"
**Solución:** 
- Asegúrate de que el teléfono esté en formato: `+5491112345678`
- Debe empezar con `+` y tener código de país

### Error: "Invalid From and To pair"
**Solución:** Ya corregido en el código. Asegúrate de que `TWILIO_WHATSAPP_NUMBER` sea `whatsapp:+14155238886`

### No hay error pero no llega
**Posibles causas:**
1. No estás en el WhatsApp Sandbox → Únete (paso 1)
2. El número está mal formateado → Debe ser `+5491112345678`
3. El trigger no se activa → Usa la RPC directa (ver abajo)

## 🔄 Si el Trigger No Funciona

Si el trigger no funciona, usa la versión directa de la RPC:

1. Ejecuta: `scripts/enviar_codigo_whatsapp_directo.sql`
2. **IMPORTANTE:** Reemplaza `'TU_SERVICE_ROLE_KEY_AQUI'` con tu service_role_key
3. Esta versión llama directamente a la edge function sin depender del trigger

## ✅ Checklist Final

- [ ] Unido al WhatsApp Sandbox (si usas sandbox)
- [ ] Edge function probada manualmente (funciona)
- [ ] Variables de entorno configuradas (3 variables)
- [ ] `TWILIO_WHATSAPP_NUMBER` = `whatsapp:+14155238886`
- [ ] Formato de teléfono correcto: `+5491112345678`
- [ ] Logs de edge function revisados
- [ ] Logs de Twilio revisados

## 🆘 Si Aún No Funciona

1. **Revisa los logs de la edge function** - Busca el error específico
2. **Revisa los logs de Twilio** - Verifica el estado del mensaje
3. **Prueba con un número diferente** - Puede ser problema del número específico
4. **Verifica que el número esté en formato correcto** - Debe ser internacional con `+`
5. **Asegúrate de estar en el sandbox** - Si usas sandbox, es obligatorio

