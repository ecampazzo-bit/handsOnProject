# 🚀 Guía Rápida: Edge Function para WhatsApp

## Método Más Fácil: Dashboard de Supabase

### Paso 1: Crear la Función (5 minutos)

1. Ve a: https://supabase.com/dashboard/project/kqxnjpyupcxbajuzsbtx
2. Menú lateral → **"Edge Functions"**
3. Clic en **"Create a new function"**
4. Nombre: `send-whatsapp-code`
5. Clic en **"Create function"**

### Paso 2: Pegar el Código

1. Abre el archivo: `scripts/edge-functions/send-whatsapp-code/index.ts`
2. Copia TODO el contenido
3. Pégalo en el editor de la función edge
4. Haz clic en **"Deploy"** o **"Save"**

### Paso 3: Configurar Variables de Entorno

En la misma página de la función:

1. Ve a la pestaña **"Settings"** o busca **"Secrets"**
2. Agrega estas 3 variables:

```
TWILIO_ACCOUNT_SID = tu_account_sid_de_twilio
TWILIO_AUTH_TOKEN = tu_auth_token_de_twilio
TWILIO_WHATSAPP_NUMBER = whatsapp:+14155238886
```

**¿Dónde obtener las credenciales de Twilio?**
- Ve a: https://console.twilio.com/
- Account SID y Auth Token están en el dashboard principal
- Para WhatsApp Sandbox (gratis para pruebas): usa `whatsapp:+14155238886`

### Paso 4: Configurar el Trigger

1. Ve a **SQL Editor** en Supabase
2. Copia y pega el contenido de: `scripts/setup_whatsapp_trigger.sql`
3. Ejecuta el script

### Paso 5: Probar

1. Ve a **Edge Functions** > `send-whatsapp-code`
2. Clic en **"Invoke function"**
3. Ingresa:
```json
{
  "telefono": "+5491112345678",
  "codigo": "123456"
}
```
4. Clic en **"Invoke"**
5. Deberías ver "success: true" y el mensaje debería llegar por WhatsApp

## ✅ Checklist

- [ ] Función edge creada y desplegada
- [ ] Variables de entorno configuradas (3 variables)
- [ ] Trigger SQL ejecutado
- [ ] Prueba exitosa desde el dashboard
- [ ] Prueba desde la app móvil

## 🐛 Problemas Comunes

### "Function not found"
→ Verifica que la función esté desplegada (debe aparecer en la lista)

### "Unauthorized" 
→ Verifica que el trigger use el `service_role_key` correcto

### "pg_net extension not found"
→ Ve a Database > Extensions y habilita `pg_net`

### Los mensajes no llegan
→ Verifica que Twilio esté configurado y que el número esté en formato internacional

## 📚 Archivos de Referencia

- **Código de la función**: `scripts/edge-functions/send-whatsapp-code/index.ts`
- **Guía completa**: `scripts/CREAR_EDGE_FUNCTION_WHATSAPP.md`
- **Script del trigger**: `scripts/setup_whatsapp_trigger.sql`

