# 🚨 Solución Rápida: No Llega el Código de WhatsApp

## ⚡ Pasos Rápidos para Diagnosticar

### 1. Verificar Edge Function (2 minutos)

1. Ve a: https://supabase.com/dashboard/project/kqxnjpyupcxbajuzsbtx/functions
2. Verifica que `send-whatsapp-code` esté en la lista
3. Si NO está:
   - Clic en "Create function"
   - Nombre: `send-whatsapp-code`
   - Copia el código de `scripts/edge-functions/send-whatsapp-code/index.ts`
   - Clic en "Deploy"

### 2. Verificar Variables de Entorno (1 minuto)

1. En la función `send-whatsapp-code`, ve a **Settings** o **Secrets**
2. Verifica que existan:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_WHATSAPP_NUMBER` (debe ser `whatsapp:+14155238886` para sandbox)

**Si faltan:**
- Agrégalas con los valores de Twilio

### 3. Probar la Función Directamente (1 minuto)

1. En Edge Functions → `send-whatsapp-code`
2. Clic en **"Invoke function"**
3. Ingresa:
```json
{
  "telefono": "+5491112345678",
  "codigo": "123456"
}
```
4. Clic en **"Invoke"**
5. **Revisa la respuesta:**
   - ✅ Si dice `"success": true` → La función funciona, el problema es el trigger
   - ❌ Si hay error → Revisa los logs y las variables de entorno

### 4. Verificar Trigger (2 minutos)

Ejecuta en SQL Editor:

```sql
-- Verificar que existe
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_send_whatsapp';
```

**Si NO existe:**
- Ejecuta: `scripts/setup_whatsapp_trigger_fixed.sql`
- **IMPORTANTE:** Reemplaza `'TU_SERVICE_ROLE_KEY_AQUI'` con tu service_role_key real
- Puedes encontrarlo en: Settings > API > service_role key

### 5. Verificar pg_net (1 minuto)

Ejecuta en SQL Editor:

```sql
SELECT * FROM pg_extension WHERE extname = 'pg_net';
```

**Si NO existe:**
- Ve a Database > Extensions
- Busca `pg_net`
- Clic en "Enable"

### 6. Verificar Twilio Sandbox (si usas sandbox)

1. Ve a: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
2. Verifica que tu número esté en la lista de permitidos
3. Si NO está:
   - Envía un mensaje de WhatsApp a: `+1 415 523 8886`
   - Con el código que aparece en la página (ej: `join <codigo>`)

## 🔧 Solución Más Común: Trigger No Funciona

El problema más común es que el trigger no puede obtener el `service_role_key`. 

### Solución Rápida:

1. Ve a: Supabase Dashboard > Settings > API
2. Copia el **service_role key** (el secreto, no el público)
3. Ejecuta este SQL (reemplaza `TU_KEY`):

```sql
-- Actualizar la función con tu service_role_key
CREATE OR REPLACE FUNCTION public.trigger_send_whatsapp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_url TEXT;
    v_service_role_key TEXT;
BEGIN
    v_url := 'https://kqxnjpyupcxbajuzsbtx.supabase.co/functions/v1/send-whatsapp-code';
    v_service_role_key := 'TU_SERVICE_ROLE_KEY_AQUI'; -- Pega tu key aquí
    
    PERFORM
        net.http_post(
            url := v_url,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || v_service_role_key
            )::jsonb,
            body := jsonb_build_object(
                'telefono', NEW.telefono,
                'codigo', NEW.codigo
            )::jsonb
        );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error: %', SQLERRM;
        RETURN NEW;
END;
$$;
```

## 🧪 Test Completo

Ejecuta esto para probar todo:

```sql
-- 1. Insertar un código de prueba
INSERT INTO public.codigos_verificacion (
    telefono,
    codigo,
    expira_en
) VALUES (
    '+5491112345678',  -- Cambia por tu número
    '123456',
    NOW() + INTERVAL '15 minutes'
);

-- 2. Verificar que se insertó
SELECT * FROM public.codigos_verificacion 
ORDER BY creado_en DESC 
LIMIT 1;

-- 3. Revisar logs de la edge function
-- Ve a: Edge Functions > send-whatsapp-code > Logs
```

## 📋 Checklist Final

- [ ] Edge function desplegada
- [ ] Variables de entorno configuradas (3 variables)
- [ ] Función probada manualmente (funciona)
- [ ] Trigger existe
- [ ] pg_net habilitada
- [ ] service_role_key configurado en el trigger
- [ ] Número en lista de permitidos de Twilio (si sandbox)

## 🆘 Si Aún No Funciona

1. **Revisa los logs de la edge function:**
   - Edge Functions > send-whatsapp-code > Logs
   - Busca errores recientes

2. **Revisa los logs de Twilio:**
   - https://console.twilio.com/us1/monitor/logs/messaging
   - Busca intentos de envío

3. **Verifica el formato del teléfono:**
   - Debe ser: `+5491112345678` (formato internacional)
   - NO: `091112345678` o `91112345678`

4. **Prueba con un número diferente** que esté en la lista de permitidos

