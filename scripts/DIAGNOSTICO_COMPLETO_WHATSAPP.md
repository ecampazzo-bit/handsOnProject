# 🔍 Diagnóstico Completo: No Llega el WhatsApp

## ✅ Checklist de Verificación Paso a Paso

### 1. Verificar Edge Function (2 min)

1. Ve a: https://supabase.com/dashboard/project/kqxnjpyupcxbajuzsbtx/functions
2. Verifica que `send-whatsapp-code` esté desplegada
3. Haz clic en "Invoke function"
4. Ingresa:
```json
{
  "telefono": "+5491112345678",
  "codigo": "123456"
}
```
5. Revisa la respuesta:
   - ✅ `"success": true` → La función funciona
   - ❌ Error → Revisa los logs

### 2. Verificar Variables de Entorno (1 min)

En Edge Functions → `send-whatsapp-code` → Settings/Secrets:

- [ ] `TWILIO_ACCOUNT_SID` = (tu Account SID)
- [ ] `TWILIO_AUTH_TOKEN` = (tu Auth Token)
- [ ] `TWILIO_WHATSAPP_NUMBER` = `whatsapp:+14155238886` (para sandbox)

**IMPORTANTE:** El número debe tener el formato `whatsapp:+14155238886`

### 3. Verificar Twilio Sandbox (CRÍTICO - 5 min)

Si usas el **WhatsApp Sandbox** de Twilio (gratis para pruebas):

1. Ve a: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
2. Busca el código de unión (ej: `join <codigo>`)
3. **Envía un mensaje de WhatsApp** a: `+1 415 523 8886`
4. Con el mensaje: `join <codigo>` (reemplaza `<codigo>` con el código que aparece)
5. Deberías recibir confirmación: "You're all set!"

**Si NO te unes al sandbox, NO recibirás mensajes.**

### 4. Verificar Formato del Teléfono (1 min)

El teléfono debe estar en formato internacional:
- ✅ Correcto: `+5491112345678`
- ❌ Incorrecto: `091112345678`, `91112345678`, `5491112345678`

### 5. Verificar Trigger o RPC (2 min)

#### Opción A: Si usas Trigger

Ejecuta en SQL Editor:
```sql
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_send_whatsapp';
```

Si NO existe:
- Ejecuta: `scripts/setup_whatsapp_trigger_fixed.sql`
- Verifica que el `service_role_key` esté correcto

#### Opción B: Si usas RPC Directa

Ejecuta en SQL Editor:
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'enviar_codigo_whatsapp';
```

Si NO existe:
- Ejecuta: `scripts/add_phone_verification.sql`

### 6. Probar RPC Directamente (2 min)

Ejecuta en SQL Editor:
```sql
SELECT * FROM public.enviar_codigo_whatsapp('+5491112345678');
```

**Revisa la respuesta:**
- Si dice `"success": true` → La RPC funciona
- Si hay error → Revisa el mensaje

### 7. Revisar Logs de Edge Function (2 min)

1. Ve a: Edge Functions → `send-whatsapp-code` → Logs
2. Busca intentos recientes
3. Revisa los mensajes de error

**Errores comunes:**
- `Invalid From and To pair` → Formato incorrecto (ya corregido)
- `Unauthorized` → Credenciales incorrectas
- `Invalid phone number` → Formato de teléfono incorrecto
- `Unsubscribed recipient` → No estás en el sandbox

### 8. Revisar Logs de Twilio (2 min)

1. Ve a: https://console.twilio.com/us1/monitor/logs/messaging
2. Busca intentos de envío recientes
3. Revisa el estado:
   - `queued` → En cola
   - `sent` → Enviado
   - `delivered` → Entregado
   - `failed` → Falló (revisa el motivo)

### 9. Verificar pg_net (1 min)

Ejecuta en SQL Editor:
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_net';
```

Si NO existe:
- Database > Extensions > Busca `pg_net` > Enable

## 🐛 Problemas Comunes y Soluciones

### Problema 1: "Unsubscribed recipient"
**Causa:** No estás en el WhatsApp Sandbox de Twilio

**Solución:**
1. Ve a: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
2. Copia el código de unión
3. Envía WhatsApp a `+1 415 523 8886` con: `join <codigo>`

### Problema 2: "Invalid phone number"
**Causa:** Formato de teléfono incorrecto

**Solución:**
- Asegúrate de que el teléfono esté en formato: `+5491112345678`
- Debe empezar con `+` y tener código de país

### Problema 3: El trigger no se activa
**Causa:** El trigger no existe o pg_net no está habilitada

**Solución:**
1. Habilita `pg_net` en Database > Extensions
2. Ejecuta: `scripts/setup_whatsapp_trigger_fixed.sql`
3. Verifica que el `service_role_key` esté correcto

### Problema 4: La RPC funciona pero no envía
**Causa:** El trigger no llama a la edge function

**Solución:**
- Usa la versión directa: `scripts/enviar_codigo_whatsapp_directo.sql`
- Esta versión llama directamente a la edge function sin depender del trigger

### Problema 5: "Unauthorized"
**Causa:** Credenciales de Twilio incorrectas o service_role_key incorrecto

**Solución:**
1. Verifica `TWILIO_ACCOUNT_SID` y `TWILIO_AUTH_TOKEN` en las variables de entorno
2. Verifica el `service_role_key` en el trigger/RPC

## 🧪 Test Completo

Ejecuta este test paso a paso:

### Paso 1: Probar Edge Function Directamente
```bash
curl -X POST \
  'https://kqxnjpyupcxbajuzsbtx.supabase.co/functions/v1/send-whatsapp-code' \
  -H 'Authorization: Bearer TU_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "telefono": "+5491112345678",
    "codigo": "123456"
  }'
```

**Resultado esperado:**
```json
{
  "success": true,
  "message": "Código enviado exitosamente",
  "messageSid": "SM..."
}
```

### Paso 2: Probar RPC
```sql
SELECT * FROM public.enviar_codigo_whatsapp('+5491112345678');
```

**Resultado esperado:**
```json
{
  "success": true,
  "message": "Código generado exitosamente",
  "codigo": "123456"
}
```

### Paso 3: Verificar en Twilio
1. Ve a: https://console.twilio.com/us1/monitor/logs/messaging
2. Debe aparecer un intento de envío
3. Estado debe ser: `queued`, `sent`, o `delivered`

### Paso 4: Verificar en WhatsApp
- Debe llegar el mensaje al número especificado

## 📋 Checklist Final

- [ ] Edge function desplegada y probada manualmente
- [ ] Variables de entorno configuradas (3 variables)
- [ ] Unido al WhatsApp Sandbox (si usas sandbox)
- [ ] Formato de teléfono correcto: `+5491112345678`
- [ ] Trigger o RPC configurado
- [ ] pg_net habilitada
- [ ] service_role_key correcto en trigger/RPC
- [ ] Logs de edge function revisados
- [ ] Logs de Twilio revisados
- [ ] Número en lista de permitidos (sandbox)

## 🆘 Si Aún No Funciona

1. **Revisa los logs de la edge function** - Busca errores específicos
2. **Revisa los logs de Twilio** - Verifica el estado del mensaje
3. **Prueba con un número diferente** - Puede ser problema del número específico
4. **Verifica que el número esté en formato correcto** - Debe ser internacional con `+`
5. **Asegúrate de estar en el sandbox** - Si usas sandbox, es obligatorio

