# 🔧 Fix: Twilio Monitor Muestra "Failed"

## Problema
En el monitor de mensajes de Twilio aparece el estado `failed` en lugar de `delivered`.

## Pasos para Diagnosticar

### Paso 1: Ver el Error Específico en Twilio

1. Ve a: https://console.twilio.com/us1/monitor/logs/messaging
2. Haz clic en el mensaje que falló
3. Revisa la sección **"Error Details"** o **"Error Code"**
4. Anota el código de error y el mensaje

### Paso 2: Errores Comunes y Soluciones

#### Error 1: "Unsubscribed recipient" (Código 63016)

**Causa**: Tu número no está registrado en el WhatsApp Sandbox

**Solución**:
1. Ve a: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
2. Copia el código de unión (ej: `join abc-xyz`)
3. Envía WhatsApp desde tu número a: `+1 415 523 8886`
4. Mensaje: `join abc-xyz` (reemplaza con tu código)
5. Espera confirmación: "You're all set!"

#### Error 2: "Invalid phone number" (Código 21211)

**Causa**: Formato de número incorrecto

**Solución**:
- El número debe estar en formato: `+5493804663809`
- Debe empezar con `+` y código de país
- No debe tener espacios ni caracteres especiales

**Verificar en la Edge Function**:
- Revisa los logs de la Edge Function
- Verifica que el número se esté formateando correctamente

#### Error 3: "Permission denied" (Código 20003)

**Causa**: Credenciales de Twilio incorrectas o expiradas

**Solución**:
1. Ve a: Supabase Dashboard → Edge Functions → `send-whatsapp-code` → Settings/Secrets
2. Verifica:
   - `TWILIO_ACCOUNT_SID` = Tu Account SID correcto
   - `TWILIO_AUTH_TOKEN` = Tu Auth Token correcto
3. Si están incorrectas, actualízalas
4. Si expiraron, genera nuevas credenciales en Twilio

#### Error 4: "From number is not a valid WhatsApp-enabled number" (Código 21608)

**Causa**: El número "From" no está configurado correctamente

**Solución**:
1. Verifica la variable `TWILIO_WHATSAPP_NUMBER` en la Edge Function
2. Debe ser: `whatsapp:+14155238886` (para sandbox)
3. O tu número de WhatsApp verificado de Twilio

#### Error 5: "Message body is required" (Código 21606)

**Causa**: El mensaje está vacío o no se está enviando correctamente

**Solución**:
- Revisa los logs de la Edge Function
- Verifica que el código se esté generando correctamente
- Verifica que el mensaje se esté construyendo correctamente

### Paso 3: Verificar Logs de la Edge Function

1. Ve a: Supabase Dashboard → Edge Functions → `send-whatsapp-code` → Logs
2. Busca el intento reciente que falló
3. Revisa:
   - `❌ Error de Twilio:` → Muestra el error específico
   - `📞 De: ... | Para: ...` → Verifica los números
   - `📝 Mensaje: ...` → Verifica que el mensaje esté completo

### Paso 4: Probar Manualmente la Edge Function

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
   - Si retorna error → Copia el mensaje de error
   - Si retorna éxito pero falla en Twilio → Revisa el Paso 2

### Paso 5: Verificar Formato del Número

Ejecuta este script SQL para verificar cómo se están guardando los teléfonos:

```sql
SELECT 
    id,
    email,
    telefono,
    public.normalizar_telefono(telefono) as telefono_normalizado
FROM public.users
ORDER BY created_at DESC
LIMIT 10;
```

El `telefono_normalizado` debe ser: `+5493804663809` (sin espacios, con +)

## Solución Rápida por Tipo de Error

### Si el error es "Unsubscribed recipient":
1. Únete al sandbox (ver Error 1 arriba)
2. Espera 1-2 minutos
3. Prueba nuevamente

### Si el error es "Invalid phone number":
1. Verifica el formato del número en la base de datos
2. Verifica que la función `normalizar_telefono` esté funcionando
3. Ejecuta: `SELECT public.normalizar_telefono('+5493804663809');`

### Si el error es "Permission denied":
1. Verifica las credenciales en Supabase
2. Verifica las credenciales en Twilio Dashboard
3. Regenera el Auth Token si es necesario

### Si el error es otro:
1. Copia el código de error exacto
2. Busca en: https://www.twilio.com/docs/api/errors
3. O contacta soporte de Twilio

## Verificación de Configuración

### En Supabase (Edge Function Secrets):
- [ ] `TWILIO_ACCOUNT_SID` configurado
- [ ] `TWILIO_AUTH_TOKEN` configurado
- [ ] `TWILIO_WHATSAPP_NUMBER` = `whatsapp:+14155238886` (sandbox)

### En Twilio Dashboard:
- [ ] Account SID correcto
- [ ] Auth Token activo (no expirado)
- [ ] Número en sandbox (si usas sandbox)
- [ ] Número verificado (si usas producción)

## Script de Diagnóstico

Ejecuta este script para ver las últimas llamadas:

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

- [ ] Error específico identificado en Twilio
- [ ] Solución aplicada según el tipo de error
- [ ] Variables de entorno verificadas
- [ ] Número registrado en sandbox (si aplica)
- [ ] Formato de número correcto
- [ ] Edge Function probada manualmente
- [ ] Logs revisados

## Si Aún No Funciona

1. **Copia el código de error exacto** de Twilio
2. **Revisa los logs de la Edge Function** para ver qué se está enviando
3. **Verifica las credenciales** en ambos lados (Supabase y Twilio)
4. **Prueba con otro número** para descartar problemas del número específico
5. **Contacta soporte de Twilio** con el código de error específico

## Nota Importante

El código de error específico en Twilio es la clave para solucionar el problema. Asegúrate de revisar la sección "Error Details" en el monitor de mensajes de Twilio para obtener el código exacto.

