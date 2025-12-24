# Edge Function: send-whatsapp-promocion

Esta Edge Function envía mensajes de promociones por WhatsApp usando Twilio.

## Configuración

1. Crea la función en Supabase Dashboard:
   - Edge Functions > Create Function
   - Nombre: `send-whatsapp-promocion`
   - Copia el contenido de `index.ts`

2. Configura las variables de entorno en Supabase:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_WHATSAPP_NUMBER` (opcional, tiene default)

## Uso

La función espera un POST con:
```json
{
  "to": "+5491123456789",
  "message": "Quiero mi promoción: [Nombre de la Promoción]\nCódigo: ABC123"
}
```

## Integración

Se usa desde la función SQL `enviar_promocion_whatsapp()` que:
1. Obtiene la información de la promoción
2. Construye el mensaje con el formato "Quiero mi promoción: [nombre]"
3. Llama a esta Edge Function
4. Registra el uso en `promociones_uso`

