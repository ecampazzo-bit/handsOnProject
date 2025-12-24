# Edge Function: send-whatsapp-code

Esta función edge envía códigos de verificación por WhatsApp usando Twilio.

## 📋 Configuración

### Variables de Entorno Requeridas

Configura estas variables en Supabase Dashboard > Edge Functions > Settings:

- `TWILIO_ACCOUNT_SID`: Tu Account SID de Twilio
- `TWILIO_AUTH_TOKEN`: Tu Auth Token de Twilio  
- `TWILIO_WHATSAPP_NUMBER`: Tu número de WhatsApp de Twilio (formato: `whatsapp:+14155238886`)

### Cómo Obtener las Credenciales de Twilio

1. Ve a [Twilio Console](https://console.twilio.com/)
2. En el dashboard, encontrarás:
   - **Account SID**: En la parte superior del dashboard
   - **Auth Token**: Haz clic en "Show" para revelarlo
3. Para WhatsApp:
   - Si usas **WhatsApp Sandbox**: El número es `whatsapp:+14155238886` (número de prueba)
   - Si usas **WhatsApp Business API**: Usa tu número de WhatsApp Business

## 🚀 Despliegue

### Opción 1: Dashboard de Supabase

1. Ve a Edge Functions en el dashboard
2. Crea una nueva función llamada `send-whatsapp-code`
3. Copia el contenido de `index.ts`
4. Configura las variables de entorno
5. Haz clic en "Deploy"

### Opción 2: Supabase CLI

```bash
# Desde la raíz del proyecto
supabase functions deploy send-whatsapp-code
```

## 📨 Formato de Request

```json
{
  "telefono": "+5491112345678",
  "codigo": "123456"
}
```

## ✅ Formato de Response

### Éxito:
```json
{
  "success": true,
  "message": "Código enviado exitosamente",
  "messageSid": "SM1234567890abcdef"
}
```

### Error:
```json
{
  "success": false,
  "error": "Mensaje de error",
  "details": { ... }
}
```

## 🔗 Integración con Trigger

Esta función se llama automáticamente cuando se inserta un código en la tabla `codigos_verificacion` mediante un trigger de PostgreSQL.

Ver: `scripts/add_phone_verification.sql` para el trigger.

## 🧪 Testing

### Desde el Dashboard:

1. Ve a Edge Functions > send-whatsapp-code
2. Haz clic en "Invoke function"
3. Ingresa:
```json
{
  "telefono": "+5491112345678",
  "codigo": "123456"
}
```

### Desde cURL:

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

## 📝 Notas

- El número de teléfono debe estar en formato internacional (ej: +5491112345678)
- El código debe ser de 6 dígitos
- Los mensajes se envían a través de Twilio WhatsApp API
- En desarrollo, puedes usar el WhatsApp Sandbox de Twilio (gratis)

