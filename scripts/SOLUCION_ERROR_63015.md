# ✅ Solución: Error 63015 - Unirse al WhatsApp Sandbox

## Error
```
Error 63015: Channel Sandbox can only send messages to phone numbers 
that have joined the Sandbox
```

## Causa
Tu número de teléfono no está registrado en el WhatsApp Sandbox de Twilio. El sandbox solo permite enviar mensajes a números que se han unido previamente.

## Solución Paso a Paso

### Paso 1: Obtener el Código de Unión

1. Ve a: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
2. Busca la sección **"Join the Sandbox"** o **"Join Code"**
3. Copia el código de unión (ejemplo: `join abc-xyz` o solo `abc-xyz`)

### Paso 2: Enviar el Código de Unión

1. Abre WhatsApp en tu teléfono (`+5493804663809`)
2. Envía un mensaje a: `+1 415 523 8886`
3. Mensaje exacto: `join abc-xyz` (reemplaza `abc-xyz` con tu código real)
   - Si el código es solo `abc-xyz`, envía: `join abc-xyz`
   - Si el código ya incluye `join`, envía solo el código

### Paso 3: Confirmar Unión

Deberías recibir una respuesta de Twilio que dice:
- "You're all set!" o
- "You have successfully joined the Sandbox" o
- Mensaje similar de confirmación

### Paso 4: Verificar en Twilio

1. Ve a: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
2. Busca la lista de números en "To" (números permitidos)
3. Verifica que tu número `+5493804663809` aparezca en la lista

### Paso 5: Probar Nuevamente

1. Espera 1-2 minutos después de unirte
2. Intenta verificar tu teléfono desde la app nuevamente
3. El mensaje debería llegar ahora

## Notas Importantes

### ✅ Formato del Mensaje
- El mensaje debe ser exactamente: `join <codigo>` (sin comillas)
- No agregues espacios extra
- No uses mayúsculas a menos que el código las tenga

### ✅ Número de Destino
- Siempre envía a: `+1 415 523 8886`
- Este es el número oficial del WhatsApp Sandbox de Twilio

### ✅ Formato del Número
- Tu número debe estar en formato internacional: `+5493804663809`
- Debe incluir el código de país `+54` para Argentina

### ✅ Tiempo de Espera
- Después de unirte, espera 1-2 minutos antes de probar
- Twilio puede tardar un momento en actualizar la lista

## Verificación

### Verificar que Estás en el Sandbox

1. Ve a: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
2. Busca tu número en la lista de "To"
3. Si aparece → ✅ Estás registrado
4. Si no aparece → ❌ Necesitas unirte (repite Paso 2)

### Probar Manualmente

1. Ve a: Supabase Dashboard → Edge Functions → `send-whatsapp-code`
2. Haz clic en "Invoke function"
3. Ingresa:
```json
{
  "telefono": "+5493804663809",
  "codigo": "123456"
}
```
4. Si ahora funciona → ✅ Problema resuelto
5. Si sigue fallando → Revisa que el número esté en el sandbox

## Problemas Comunes

### Problema 1: No Recibo Confirmación
**Solución**: 
- Verifica que enviaste el mensaje correctamente
- Verifica que el código de unión sea correcto
- Espera unos minutos y verifica en el dashboard de Twilio

### Problema 2: El Código No Funciona
**Solución**:
- Asegúrate de copiar el código exacto del dashboard
- No agregues espacios ni caracteres extra
- El formato debe ser: `join <codigo>` (con espacio)

### Problema 3: Sigue Fallando Después de Unirme
**Solución**:
- Espera 2-3 minutos (puede tardar en actualizar)
- Verifica que tu número aparezca en la lista del sandbox
- Prueba con otro número para verificar que el sandbox funciona

## Checklist

- [ ] Código de unión copiado del dashboard de Twilio
- [ ] Mensaje enviado a `+1 415 523 8886` con formato `join <codigo>`
- [ ] Confirmación recibida de Twilio
- [ ] Número verificado en la lista del sandbox
- [ ] Esperado 1-2 minutos después de unirse
- [ ] Probado nuevamente desde la app

## Para Producción

**Importante**: El WhatsApp Sandbox es solo para desarrollo y pruebas. Para producción necesitas:

1. Un número de WhatsApp verificado de Twilio
2. Aprobar tu caso de uso con Twilio
3. Configurar el número en la variable `TWILIO_WHATSAPP_NUMBER`

Para más información: https://www.twilio.com/docs/whatsapp

## Resumen Rápido

1. Ve a: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
2. Copia el código de unión
3. Envía WhatsApp desde `+5493804663809` a `+1 415 523 8886`
4. Mensaje: `join <codigo>`
5. Espera confirmación
6. Prueba nuevamente

¡Eso debería solucionar el error 63015!

