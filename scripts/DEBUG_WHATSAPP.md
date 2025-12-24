# 🔍 Debug: No Llega el Código por WhatsApp

Guía paso a paso para diagnosticar por qué no llega el código de verificación por WhatsApp.

## ✅ Checklist de Verificación

### 1. Verificar que la Edge Function esté Desplegada

1. Ve a Supabase Dashboard → **Edge Functions**
2. Verifica que `send-whatsapp-code` aparezca en la lista
3. Debe tener estado **"Active"** o **"Deployed"**

**Si no está desplegada:**
- Ve a Edge Functions → Create function
- Nombre: `send-whatsapp-code`
- Pega el código de `scripts/edge-functions/send-whatsapp-code/index.ts`
- Haz clic en "Deploy"

### 2. Verificar Variables de Entorno

1. Ve a Edge Functions → `send-whatsapp-code` → **Settings** o **Secrets**
2. Verifica que existan estas 3 variables:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_WHATSAPP_NUMBER`

**Si faltan:**
- Agrégalas con los valores correctos de Twilio

### 3. Verificar el Trigger en la Base de Datos

Ejecuta este SQL en el SQL Editor:

```sql
-- Verificar que el trigger existe
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_send_whatsapp';
```

**Si no existe:**
- Ejecuta el script: `scripts/setup_whatsapp_trigger.sql`

### 4. Verificar Extensión pg_net

```sql
-- Verificar si pg_net está habilitada
SELECT * FROM pg_extension WHERE extname = 'pg_net';
```

**Si no está habilitada:**
1. Ve a Database → Extensions
2. Busca `pg_net`
3. Haz clic en "Enable"

### 5. Probar la Edge Function Manualmente

#### Desde el Dashboard:

1. Ve a Edge Functions → `send-whatsapp-code`
2. Haz clic en **"Invoke function"**
3. Ingresa este JSON:
```json
{
  "telefono": "+5491112345678",
  "codigo": "123456"
}
```
4. Haz clic en **"Invoke"**
5. Revisa la respuesta:
   - Si dice `"success": true` → La función funciona
   - Si hay error → Revisa los logs

#### Desde Terminal (cURL):

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

### 6. Revisar Logs de la Edge Function

1. Ve a Edge Functions → `send-whatsapp-code` → **Logs**
2. Busca errores recientes
3. Los logs mostrarán:
   - Si se recibió la request
   - Si Twilio respondió
   - Cualquier error

**Errores comunes:**
- `Variables de entorno de Twilio no configuradas` → Falta configurar secrets
- `Unauthorized` → Credenciales de Twilio incorrectas
- `Invalid phone number` → Formato de teléfono incorrecto

### 7. Verificar Configuración de Twilio

#### A. Verificar Credenciales

1. Ve a [Twilio Console](https://console.twilio.com/)
2. Verifica que el **Account SID** y **Auth Token** sean correctos
3. Copia exactamente (sin espacios)

#### B. Verificar WhatsApp Sandbox (si usas sandbox)

1. Ve a Twilio Console → **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Verifica que tu número esté en la lista de números permitidos
3. Si no está, únete al sandbox enviando el código que Twilio te da

**Para unirse al sandbox:**
- Envía un mensaje de WhatsApp a: `+1 415 523 8886`
- Con el código que aparece en la consola de Twilio (ej: `join <codigo>`)

#### C. Verificar Número de WhatsApp

- **Sandbox**: `whatsapp:+14155238886` (siempre el mismo)
- **Business API**: Tu número de WhatsApp Business

### 8. Verificar que el Trigger se Active

Ejecuta este SQL para ver si el trigger se activa:

```sql
-- Insertar un código de prueba
INSERT INTO public.codigos_verificacion (
    telefono,
    codigo,
    expira_en
) VALUES (
    '+5491112345678',
    '123456',
    NOW() + INTERVAL '15 minutes'
);

-- Verificar que se insertó
SELECT * FROM public.codigos_verificacion 
WHERE telefono = '+5491112345678' 
ORDER BY creado_en DESC 
LIMIT 1;
```

**Si el trigger no funciona:**
- Revisa los logs de PostgreSQL
- Verifica que `pg_net` esté habilitada
- Verifica que la URL de la edge function sea correcta

### 9. Verificar Formato del Teléfono

El teléfono debe estar en formato internacional:
- ✅ Correcto: `+5491112345678`
- ❌ Incorrecto: `091112345678`, `91112345678`, `5491112345678`

### 10. Verificar en Twilio Dashboard

1. Ve a Twilio Console → **Monitor** → **Logs** → **Messaging**
2. Busca intentos de envío recientes
3. Si hay errores, verás el motivo:
   - `Invalid phone number`
   - `Unsubscribed recipient`
   - `Rate limit exceeded`
   - etc.

## 🐛 Soluciones Comunes

### Problema: "Function not found"
**Solución:** Despliega la función edge desde el dashboard

### Problema: "Unauthorized" o "Invalid credentials"
**Solución:** 
- Verifica que `TWILIO_ACCOUNT_SID` y `TWILIO_AUTH_TOKEN` sean correctos
- Asegúrate de copiar sin espacios adicionales

### Problema: "Invalid phone number"
**Solución:**
- Verifica que el número esté en formato internacional: `+5491112345678`
- Si usas sandbox, verifica que el número esté en la lista de permitidos

### Problema: "Unsubscribed recipient" (Sandbox)
**Solución:**
- Únete al sandbox enviando el código a `+1 415 523 8886`
- El código aparece en Twilio Console → Messaging → Try it out

### Problema: El trigger no se activa
**Solución:**
1. Verifica que `pg_net` esté habilitada
2. Re-ejecuta `scripts/setup_whatsapp_trigger.sql`
3. Verifica que la URL de la edge function sea correcta

### Problema: La función se ejecuta pero no envía
**Solución:**
- Revisa los logs de la edge function
- Verifica que Twilio responda con `status: "queued"` o `status: "sent"`
- Revisa el dashboard de Twilio para ver si hay errores

## 🧪 Test Completo Paso a Paso

1. **Probar función edge directamente:**
```bash
curl -X POST \
  'https://kqxnjpyupcxbajuzsbtx.supabase.co/functions/v1/send-whatsapp-code' \
  -H 'Authorization: Bearer TU_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"telefono": "+5491112345678", "codigo": "123456"}'
```

2. **Verificar respuesta:**
- Debe retornar `{"success": true, ...}`
- Si hay error, revisa el mensaje

3. **Verificar en Twilio:**
- Ve a Twilio Console → Monitor → Logs
- Debe aparecer un intento de envío

4. **Verificar en WhatsApp:**
- Debe llegar el mensaje al número especificado

## 📞 Contacto de Soporte

Si después de seguir estos pasos aún no funciona:
1. Revisa los logs de la edge function
2. Revisa los logs de Twilio
3. Verifica que todas las configuraciones estén correctas
4. Prueba con un número diferente

