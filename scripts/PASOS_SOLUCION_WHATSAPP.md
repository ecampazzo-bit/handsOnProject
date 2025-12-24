# 🔧 Pasos para Solucionar: No Llega el Código de WhatsApp

## 🎯 Diagnóstico Rápido (5 minutos)

### Paso 1: Probar la Edge Function Directamente

1. Ve a: https://supabase.com/dashboard/project/kqxnjpyupcxbajuzsbtx/functions
2. Busca `send-whatsapp-code`
3. Si NO existe → Créala (ver guía completa)
4. Si existe → Haz clic en "Invoke function"
5. Ingresa:
```json
{
  "telefono": "+5491112345678",
  "codigo": "123456"
}
```
6. Clic en "Invoke"

**Resultado esperado:**
- ✅ `"success": true` → La función funciona, el problema es el trigger/RPC
- ❌ Error → Revisa variables de entorno y configuración de Twilio

### Paso 2: Verificar Variables de Entorno

En la función `send-whatsapp-code` → Settings/Secrets:

- [ ] `TWILIO_ACCOUNT_SID` existe
- [ ] `TWILIO_AUTH_TOKEN` existe  
- [ ] `TWILIO_WHATSAPP_NUMBER` existe (debe ser `whatsapp:+14155238886` para sandbox)

**Si faltan:** Agrégalas con los valores de Twilio

### Paso 3: Verificar Trigger

Ejecuta en SQL Editor:

```sql
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_send_whatsapp';
```

**Si NO existe:**
- Ejecuta: `scripts/setup_whatsapp_trigger_fixed.sql`
- **IMPORTANTE:** Reemplaza `'TU_SERVICE_ROLE_KEY_AQUI'` con tu service_role_key
- Encuéntralo en: Settings > API > service_role key

### Paso 4: Verificar pg_net

```sql
SELECT * FROM pg_extension WHERE extname = 'pg_net';
```

**Si NO existe:**
- Database > Extensions > Busca `pg_net` > Enable

## 🔄 Solución Alternativa: RPC Directa

Si el trigger no funciona, usa esta versión que llama directamente a la edge function:

1. Ejecuta: `scripts/enviar_codigo_whatsapp_directo.sql`
2. **IMPORTANTE:** Reemplaza `'TU_SERVICE_ROLE_KEY_AQUI'` con tu service_role_key
3. Esta versión NO depende del trigger

## ✅ Verificación Final

1. **Prueba desde la app:**
   - Intenta verificar un teléfono
   - Debería llegar el código

2. **Revisa logs:**
   - Edge Functions > send-whatsapp-code > Logs
   - Busca errores recientes

3. **Revisa Twilio:**
   - https://console.twilio.com/us1/monitor/logs/messaging
   - Debe aparecer el intento de envío

## 🐛 Problemas Comunes

### "Function not found"
→ Despliega la edge function

### "Unauthorized"  
→ Verifica service_role_key en el trigger/RPC

### "Invalid phone number"
→ Verifica formato: `+5491112345678` (internacional)

### "Unsubscribed recipient" (Sandbox)
→ Únete al sandbox enviando código a `+1 415 523 8886`

## 📞 Siguiente Paso

Si después de estos pasos aún no funciona:
1. Revisa los logs de la edge function
2. Revisa los logs de Twilio
3. Prueba con un número diferente
4. Verifica que el número esté en la lista de permitidos (si sandbox)

