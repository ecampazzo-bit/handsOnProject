# 🔍 Diagnóstico: Código se Genera pero WhatsApp No Llega

## ✅ Lo que Funciona
- ✅ La función RPC `enviar_codigo_whatsapp` funciona
- ✅ El código se genera correctamente
- ✅ La llamada HTTP se hace (sin errores)

## 🔴 Lo que NO Funciona
- ❌ El WhatsApp no llega al teléfono

## 🔍 Pasos de Diagnóstico

### Paso 1: Verificar Edge Function

1. Ve a: Supabase Dashboard → Edge Functions
2. Verifica que `send-whatsapp-code` esté desplegada
3. Haz clic en "Invoke function"
4. Ingresa:
```json
{
  "telefono": "+5493804663809",
  "codigo": "123456"
}
```
5. Revisa la respuesta:
   - ✅ Si dice `"success": true` → La función funciona
   - ❌ Si hay error → Revisa el mensaje

### Paso 2: Revisar Logs de Edge Function

1. Ve a: Edge Functions → `send-whatsapp-code` → **Logs**
2. Busca intentos recientes
3. Revisa los mensajes:
   - `✅ Mensaje enviado exitosamente` → Funcionó
   - `❌ Error de Twilio` → Revisa el error específico
   - Si no hay logs → La edge function no se está llamando

### Paso 3: Verificar Variables de Entorno

En Edge Functions → `send-whatsapp-code` → Settings/Secrets:

- [ ] `TWILIO_ACCOUNT_SID` = (tu Account SID)
- [ ] `TWILIO_AUTH_TOKEN` = (tu Auth Token)
- [ ] `TWILIO_WHATSAPP_NUMBER` = `whatsapp:+14155238886` (para sandbox)

### Paso 4: Verificar Twilio Sandbox (CRÍTICO)

Si usas el **WhatsApp Sandbox** de Twilio:

1. Ve a: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
2. Verifica que el número `+5493804663809` esté en la lista de permitidos
3. Si NO está:
   - Busca el código de unión (ej: `join <codigo>`)
   - Envía un WhatsApp desde `+5493804663809` a: `+1 415 523 8886`
   - Con el mensaje: `join <codigo>`
   - Deberías recibir: "You're all set!"

**Si NO estás en el sandbox, NO recibirás mensajes.**

### Paso 5: Revisar Logs de Twilio

1. Ve a: https://console.twilio.com/us1/monitor/logs/messaging
2. Busca intentos de envío recientes
3. Revisa el estado:
   - `queued` → En cola
   - `sent` → Enviado
   - `delivered` → Entregado
   - `failed` → Falló (revisa el motivo)
   - `undelivered` → No entregado (puede ser que no estés en el sandbox)

### Paso 6: Verificar Llamadas HTTP desde pg_net

Ejecuta en SQL Editor:

```sql
SELECT 
    id,
    url,
    method,
    created,
    error_msg
FROM net.http_request_queue
WHERE url LIKE '%send-whatsapp-code%'
ORDER BY created DESC
LIMIT 10;
```

Esto muestra las últimas llamadas HTTP. Revisa:
- Si hay llamadas a la edge function
- Si hay `error_msg` (si hay, ese es el problema)
- La fecha `created` (debe ser reciente)

## 🐛 Problemas Comunes

### Problema 1: No hay logs en la Edge Function
**Causa:** La edge function no se está llamando

**Solución:**
- Verifica que `pg_net` esté habilitada
- Verifica que el `service_role_key` sea correcto
- Revisa los logs de PostgreSQL

### Problema 2: "Unsubscribed recipient" en Twilio
**Causa:** No estás en el WhatsApp Sandbox

**Solución:** Únete al sandbox (ver Paso 4)

### Problema 3: "Invalid phone number"
**Causa:** Formato de teléfono incorrecto

**Solución:** Verifica que el teléfono esté en formato: `+5493804663809`

### Problema 4: Edge Function retorna error
**Causa:** Variables de entorno incorrectas o Twilio no configurado

**Solución:** Revisa las variables de entorno (Paso 3)

## 🔧 Solución Rápida

### Si no estás en el Sandbox:

1. Ve a: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
2. Copia el código de unión
3. Envía WhatsApp desde `+5493804663809` a `+1 415 523 8886`
4. Mensaje: `join <codigo>`
5. Espera confirmación
6. Prueba nuevamente desde la app

### Si la Edge Function no se llama:

1. Verifica que `pg_net` esté habilitada
2. Verifica el `service_role_key` en la función
3. Revisa los logs de PostgreSQL

## 📋 Checklist

- [ ] Edge function desplegada
- [ ] Variables de entorno configuradas (3 variables)
- [ ] Edge function probada manualmente (funciona)
- [ ] Logs de edge function revisados
- [ ] Logs de Twilio revisados
- [ ] Número en lista de permitidos (sandbox)
- [ ] pg_net habilitada
- [ ] service_role_key correcto

## 🆘 Si Aún No Funciona

1. **Revisa los logs de la edge function** - Busca errores específicos
2. **Revisa los logs de Twilio** - Verifica el estado del mensaje
3. **Prueba la edge function manualmente** - Verifica que funcione
4. **Verifica que estés en el sandbox** - Es obligatorio si usas sandbox

