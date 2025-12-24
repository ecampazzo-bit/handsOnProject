# Verificación de Teléfono con WhatsApp

Este documento explica cómo funciona y cómo configurar la verificación de teléfono mediante WhatsApp.

## 📋 Descripción

El sistema permite verificar números de teléfono enviando códigos OTP (One-Time Password) de 6 dígitos por WhatsApp. Los usuarios deben ingresar el código recibido para completar la verificación.

## 🚀 Configuración Inicial

### 1. Ejecutar Scripts SQL

Ejecuta el script SQL en Supabase para crear las funciones y tablas necesarias:

```sql
-- Ejecutar en SQL Editor de Supabase
\i scripts/phone_verification_functions.sql
```

O copia y pega el contenido de `scripts/phone_verification_functions.sql` en el SQL Editor.

### 2. Verificar Estructura

Después de ejecutar el script, verifica que se hayan creado:

- ✅ Campo `telefono_verificado` en la tabla `users`
- ✅ Tabla `codigos_verificacion`
- ✅ Función `enviar_codigo_whatsapp(telefono)`
- ✅ Función `verificar_codigo_whatsapp(telefono, codigo)`
- ✅ Función `generar_codigo_otp()`
- ✅ Función `limpiar_codigos_expirados()`

## 🔧 Integración con WhatsApp

### Opción 1: Twilio WhatsApp API (Recomendado)

1. **Crear cuenta en Twilio**
   - Registrarse en [Twilio](https://www.twilio.com)
   - Obtener Account SID y Auth Token
   - Configurar WhatsApp Sandbox o WhatsApp Business API

2. **Crear Edge Function en Supabase**

Crea una función edge que se active cuando se inserte un código:

```typescript
// supabase/functions/send-whatsapp/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { telefono, codigo } = await req.json()
  
  // Enviar mensaje por Twilio
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
  const fromNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER') // formato: whatsapp:+14155238886
  
  const message = `Tu código de verificación HandsOn es: ${codigo}. Válido por 15 minutos.`
  
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: fromNumber,
        To: `whatsapp:${telefono}`,
        Body: message,
      }),
    }
  )
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

3. **Configurar Trigger en Supabase**

```sql
-- Crear función que llama al webhook
CREATE OR REPLACE FUNCTION webhook_enviar_whatsapp()
RETURNS TRIGGER AS $$
BEGIN
  -- Llamar a la edge function
  PERFORM net.http_post(
    url := 'https://tu-proyecto.supabase.co/functions/v1/send-whatsapp',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object(
      'telefono', NEW.telefono,
      'codigo', NEW.codigo
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
CREATE TRIGGER trigger_enviar_whatsapp
AFTER INSERT ON public.codigos_verificacion
FOR EACH ROW
EXECUTE FUNCTION webhook_enviar_whatsapp();
```

### Opción 2: MessageBird

Similar a Twilio, pero usando la API de MessageBird:

```typescript
const response = await fetch('https://rest.messagebird.com/messages', {
  method: 'POST',
  headers: {
    'Authorization': `AccessKey ${Deno.env.get('MESSAGEBIRD_API_KEY')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    originator: 'HandsOn',
    recipients: [telefono],
    body: `Tu código de verificación es: ${codigo}`,
    type: 'text',
    channelId: Deno.env.get('MESSAGEBIRD_WHATSAPP_CHANNEL_ID'),
  }),
})
```

### Opción 3: WhatsApp Business API Directo

Si tienes acceso directo a WhatsApp Business API, puedes integrarlo directamente.

## 📱 Flujo de Usuario

1. **Registro**
   - Usuario completa el formulario de registro
   - Después de crear la cuenta, se navega automáticamente a la pantalla de verificación

2. **Envío de Código**
   - Se envía automáticamente un código de 6 dígitos por WhatsApp
   - El código expira en 15 minutos
   - Máximo 5 intentos de verificación

3. **Verificación**
   - Usuario ingresa el código de 6 dígitos
   - El código se valida contra la base de datos
   - Si es correcto, el teléfono se marca como verificado
   - Usuario puede continuar con la aplicación

4. **Reenvío**
   - Si el código expira o no llega, el usuario puede solicitar uno nuevo
   - Hay un cooldown de 60 segundos entre envíos

## 🔒 Seguridad

- **Expiración**: Los códigos expiran en 15 minutos
- **Intentos**: Máximo 5 intentos fallidos por código
- **Limpieza**: Los códigos expirados se limpian automáticamente
- **Unicidad**: Solo un código activo por teléfono a la vez

## 🧪 Testing en Desarrollo

En desarrollo, el código se retorna en la respuesta de `enviar_codigo_whatsapp`:

```json
{
  "success": true,
  "codigo": "123456",  // Solo en desarrollo
  "expira_en": "2025-12-23T15:30:00Z"
}
```

**⚠️ IMPORTANTE**: Elimina el campo `codigo` de la respuesta en producción.

También puedes consultar los códigos directamente en la tabla:

```sql
SELECT * FROM codigos_verificacion 
WHERE telefono = '+5491112345678' 
ORDER BY creado_en DESC 
LIMIT 1;
```

## 📊 Monitoreo

Para verificar el estado de las verificaciones:

```sql
-- Usuarios con teléfono verificado
SELECT id, nombre, apellido, telefono, telefono_verificado
FROM users
WHERE telefono_verificado = true;

-- Códigos activos
SELECT telefono, creado_en, expira_en, intentos, usado
FROM codigos_verificacion
WHERE usado = false AND expira_en > NOW();
```

## 🐛 Solución de Problemas

### El código no llega por WhatsApp

1. Verifica que la integración con WhatsApp esté configurada correctamente
2. Verifica que el número esté en formato internacional (+54...)
3. Revisa los logs de la edge function o webhook
4. Verifica que el servicio de WhatsApp (Twilio, etc.) esté activo

### Código inválido o expirado

- Los códigos expiran en 15 minutos
- Máximo 5 intentos por código
- Solicita un nuevo código si es necesario

### Error al verificar

- Verifica que el teléfono esté en el formato correcto
- Asegúrate de que el código tenga exactamente 6 dígitos
- Verifica que no hayas excedido el límite de intentos

## 📝 Notas Adicionales

- Los códigos se generan aleatoriamente (000000-999999)
- Un código usado no puede ser reutilizado
- Los códigos anteriores se invalidan automáticamente al generar uno nuevo
- La verificación es opcional pero recomendada para mayor seguridad

