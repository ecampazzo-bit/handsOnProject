# Guía: Crear Edge Function en Supabase para WhatsApp

Esta guía te ayudará a crear una función edge en Supabase que envíe códigos de verificación por WhatsApp usando Twilio.

## 📋 Requisitos Previos

1. Cuenta de Twilio con WhatsApp habilitado
2. Proyecto de Supabase configurado
3. Supabase CLI instalado (opcional, pero recomendado)

## 🚀 Opción 1: Usando Supabase Dashboard (Más Fácil)

### Paso 1: Crear la Función Edge

1. **Ve al Dashboard de Supabase**: https://supabase.com/dashboard
2. **Selecciona tu proyecto**: `handsOnProject`
3. **Ve a "Edge Functions"** en el menú lateral izquierdo
4. **Haz clic en "Create a new function"**
5. **Nombre de la función**: `send-whatsapp-code`
6. **Haz clic en "Create function"**

### Paso 2: Configurar Variables de Entorno

1. En la página de la función, ve a **"Settings"** o **"Secrets"**
2. Agrega las siguientes variables de entorno:
   - `TWILIO_ACCOUNT_SID`: Tu Account SID de Twilio
   - `TWILIO_AUTH_TOKEN`: Tu Auth Token de Twilio
   - `TWILIO_WHATSAPP_NUMBER`: Tu número de WhatsApp de Twilio (formato: `whatsapp:+14155238886`)

### Paso 3: Escribir el Código

Reemplaza el código por defecto con el contenido del archivo:
`scripts/edge-functions/send-whatsapp-code/index.ts`

### Paso 4: Desplegar

1. Haz clic en **"Deploy"** o **"Save"**
2. Espera a que se despliegue (puede tomar unos minutos)

## 🛠️ Opción 2: Usando Supabase CLI (Recomendado para Desarrollo)

### Paso 1: Instalar Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# O usando npm
npm install -g supabase
```

### Paso 2: Iniciar Sesión

```bash
supabase login
```

### Paso 3: Vincular tu Proyecto

```bash
cd /Users/ecampazzo/Documents/Dev/handsOnProject
supabase link --project-ref kqxnjpyupcxbajuzsbtx
```

### Paso 4: Crear la Función

```bash
supabase functions new send-whatsapp-code
```

Esto creará una carpeta `supabase/functions/send-whatsapp-code/`

### Paso 5: Escribir el Código

Copia el contenido de `scripts/edge-functions/send-whatsapp-code/index.ts` en:
`supabase/functions/send-whatsapp-code/index.ts`

### Paso 6: Configurar Secrets

```bash
supabase secrets set TWILIO_ACCOUNT_SID=tu_account_sid
supabase secrets set TWILIO_AUTH_TOKEN=tu_auth_token
supabase secrets set TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### Paso 7: Desplegar

```bash
supabase functions deploy send-whatsapp-code
```

## 🔗 Paso 7: Configurar el Trigger en la Base de Datos

Después de crear la función edge, necesitas configurar un trigger que la llame automáticamente cuando se inserte un código.

Ejecuta este SQL en el SQL Editor de Supabase:

```sql
-- Crear función que llama a la edge function
CREATE OR REPLACE FUNCTION public.trigger_send_whatsapp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_url TEXT;
    v_response JSONB;
BEGIN
    -- URL de tu edge function
    v_url := 'https://kqxnjpyupcxbajuzsbtx.supabase.co/functions/v1/send-whatsapp-code';
    
    -- Llamar a la edge function usando http extension
    -- Nota: Necesitas habilitar la extensión http en Supabase
    PERFORM
        net.http_post(
            url := v_url,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
            ),
            body := jsonb_build_object(
                'telefono', NEW.telefono,
                'codigo', NEW.codigo
            )
        );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log el error pero no fallar la inserción del código
        RAISE WARNING 'Error al llamar edge function: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Crear el trigger
DROP TRIGGER IF EXISTS trigger_send_whatsapp ON public.codigos_verificacion;
CREATE TRIGGER trigger_send_whatsapp
AFTER INSERT ON public.codigos_verificacion
FOR EACH ROW
EXECUTE FUNCTION public.trigger_send_whatsapp();
```

**Nota**: Si la extensión `http` o `net` no está disponible, puedes usar `pg_net` o crear un webhook alternativo.

## 🔄 Alternativa: Usar pg_net (Recomendado)

Si `net.http_post` no funciona, usa `pg_net`:

```sql
-- Habilitar extensión pg_net (si no está habilitada)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Crear función con pg_net
CREATE OR REPLACE FUNCTION public.trigger_send_whatsapp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Usar pg_net para hacer la llamada HTTP
    PERFORM
        net.http_post(
            url := 'https://kqxnjpyupcxbajuzsbtx.supabase.co/functions/v1/send-whatsapp-code',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
            )::jsonb,
            body := jsonb_build_object(
                'telefono', NEW.telefono,
                'codigo', NEW.codigo
            )::jsonb
        );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error al llamar edge function: %', SQLERRM;
        RETURN NEW;
END;
$$;
```

## 🧪 Probar la Función

### Desde el Dashboard:

1. Ve a **Edge Functions** > **send-whatsapp-code**
2. Haz clic en **"Invoke function"**
3. Ingresa este JSON en el body:
```json
{
  "telefono": "+5491112345678",
  "codigo": "123456"
}
```
4. Haz clic en **"Invoke"**

### Desde la Terminal:

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

## 📝 Verificar que Funciona

1. **Prueba desde la app**: Intenta verificar un teléfono
2. **Revisa los logs**: Ve a Edge Functions > send-whatsapp-code > Logs
3. **Verifica en Twilio**: Revisa el dashboard de Twilio para ver los mensajes enviados

## 🐛 Solución de Problemas

### Error: "Function not found"
- Verifica que la función esté desplegada
- Verifica que el nombre de la función sea correcto
- Verifica que la URL sea correcta

### Error: "Unauthorized"
- Verifica que el `service_role_key` esté configurado correctamente
- Verifica que el header `Authorization` tenga el formato correcto

### Error: "pg_net extension not found"
- Ve a Database > Extensions en Supabase Dashboard
- Busca `pg_net` y habilítala
- O usa la alternativa con webhooks

### Los mensajes no llegan por WhatsApp
- Verifica que Twilio esté configurado correctamente
- Verifica que el número de destino esté en formato internacional
- Verifica que el número esté en la lista de números permitidos de Twilio (si usas sandbox)

## 📚 Recursos Adicionales

- [Documentación de Edge Functions de Supabase](https://supabase.com/docs/guides/functions)
- [Documentación de Twilio WhatsApp](https://www.twilio.com/docs/whatsapp)
- [Documentación de pg_net](https://github.com/supabase/pg_net)

