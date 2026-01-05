# 🚀 Migrar Twilio WhatsApp de Sandbox a Producción

## Resumen

Para usar WhatsApp en producción con Twilio, necesitas:
1. Un número de WhatsApp verificado de Twilio
2. Aprobar tu caso de uso con Twilio
3. Actualizar la configuración de la Edge Function
4. Cambiar las variables de entorno

## Paso 1: Verificar tu Negocio en Facebook Business Manager

**IMPORTANTE**: Antes de obtener un número de WhatsApp en producción, necesitas verificar tu negocio en Facebook Business Manager.

1. Ve a: https://business.facebook.com/
2. Crea o accede a tu cuenta de Business Manager
3. Completa la verificación de tu negocio
4. Este proceso puede tardar 1-2 días

## Paso 2: Obtener un Número de WhatsApp Verificado

### Opción A: Solicitar un Número Nuevo (Recomendado)

1. Ve a: https://console.twilio.com/
2. En el menú lateral, busca **"Messaging"** → **"Try it out"** → **"Send a WhatsApp message"**
   - O directamente: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
3. Busca la sección **"Get Started with WhatsApp"** o **"Request Production Access"**
4. Haz clic en **"Request Production Access"** o **"Get Started"**
5. Completa el formulario:
   - **Business Name**: Nombre de tu empresa/app
   - **Use Case**: Describe cómo usarás WhatsApp (verificación de códigos, notificaciones, etc.)
   - **Expected Volume**: Volumen mensual de mensajes
   - **Country**: Selecciona Argentina
   - **Facebook Business Manager ID**: Tu ID de Business Manager (obtenido en Paso 1)
6. Envía la solicitud
7. Espera la aprobación (puede tardar 1-5 días hábiles)

### Opción B: Usar un Número Existente

Si ya tienes un número de Twilio:

1. Ve a: https://console.twilio.com/us1/phone-numbers/incoming
2. Selecciona tu número
3. Busca la opción **"Messaging"** o **"WhatsApp"**
4. Sigue las instrucciones para habilitar WhatsApp
5. Necesitarás vincularlo con tu Facebook Business Manager

## Paso 3: Aprobar tu Caso de Uso

Twilio requiere aprobación para usar WhatsApp en producción. El proceso de solicitud puede estar integrado con el Paso 2, pero si necesitas aprobar plantillas específicas:

### 3.1. Preparar tu Solicitud

1. Ve a: https://console.twilio.com/
2. Navega a **"Messaging"** → **"Content Templates"** o busca **"WhatsApp Templates"**
   - O directamente: https://console.twilio.com/us1/develop/sms/content-templates
3. Si no encuentras la opción, el proceso de aprobación puede estar integrado con la solicitud del número
4. Completa el formulario con:

**Información del Negocio:**
- Nombre de la empresa
- Descripción del negocio
- Sitio web
- Política de privacidad (URL)

**Caso de Uso:**
- Tipo de mensajes: **"Authentication"** (verificación de códigos)
- Descripción detallada: "Enviamos códigos de verificación de 6 dígitos a usuarios que se registran en nuestra aplicación"
- Ejemplo de mensaje: "Tu código de verificación HandsOn es: 123456. Válido por 15 minutos."

**Volumen Esperado:**
- Mensajes por mes
- Picos de tráfico esperados

### 2.2. Plantilla de Mensaje

Twilio requiere que uses plantillas aprobadas. Para códigos de verificación:

**Plantilla sugerida:**
```
Tu código de verificación {{1}} es: {{2}}

Válido por 15 minutos.

No compartas este código con nadie.
```

Donde:
- `{{1}}` = Nombre de la app (ej: "HandsOn")
- `{{2}}` = Código de 6 dígitos

### 2.3. Enviar Solicitud

1. Revisa toda la información
2. Acepta los términos
3. Envía la solicitud
4. Espera la aprobación (1-5 días hábiles)

## Paso 4: Configurar la Edge Function para Producción

### 4.1. Actualizar Variables de Entorno

En Supabase Dashboard → Edge Functions → `send-whatsapp-code` → Settings/Secrets:

**Cambiar:**
- `TWILIO_WHATSAPP_NUMBER` = `whatsapp:+549XXXXXXXXX` (tu número de producción)

**Mantener:**
- `TWILIO_ACCOUNT_SID` = (igual)
- `TWILIO_AUTH_TOKEN` = (igual)

### 4.2. Verificar el Código de la Edge Function

El código actual debería funcionar, pero verifica que:

1. El número "From" use el formato correcto: `whatsapp:+549XXXXXXXXX`
2. El mensaje esté en el formato aprobado por Twilio
3. No uses contenido dinámico no aprobado

### 4.3. Actualizar el Mensaje (si es necesario)

Si Twilio requiere una plantilla específica, actualiza el mensaje en la Edge Function:

```typescript
// En scripts/edge-functions/send-whatsapp-code/index.ts
const message = `Tu código de verificación HandsOn es: ${codigo}\n\nVálido por 15 minutos.\n\nNo compartas este código con nadie.`;
```

## Paso 5: Probar en Producción

### 5.1. Probar Manualmente

1. Ve a: Supabase Dashboard → Edge Functions → `send-whatsapp-code`
2. Haz clic en "Invoke function"
3. Ingresa:
```json
{
  "telefono": "+5493804663809",
  "codigo": "123456"
}
```
4. Verifica que el mensaje llegue

### 5.2. Verificar en Twilio

1. Ve a: https://console.twilio.com/us1/monitor/logs/messaging
2. Busca el mensaje enviado
3. Verifica que el estado sea `delivered`

## Paso 6: Actualizar Configuración de la App

### 6.1. Verificar que la App Use el Número Correcto

La app ya está configurada para usar la Edge Function, así que no necesitas cambios en el código de la app móvil. Solo asegúrate de que:

- La Edge Function tenga las variables de entorno correctas
- El número de producción esté configurado

### 6.2. Monitoreo

Configura alertas en Twilio para monitorear:
- Mensajes fallidos
- Límites de cuota
- Errores de entrega

## Costos de Producción

### Precios de Twilio WhatsApp (Argentina)

- **Mensajes entrantes**: $0.005 USD por mensaje
- **Mensajes salientes**: $0.005 USD por mensaje
- **Número de WhatsApp**: Incluido (no hay costo adicional)

### Estimación de Costos

Si envías 1,000 códigos de verificación por mes:
- Costo: 1,000 × $0.005 = **$5 USD/mes**

## Checklist de Migración

### Antes de Migrar
- [ ] Número de WhatsApp verificado obtenido
- [ ] Caso de uso aprobado por Twilio
- [ ] Plantilla de mensaje aprobada (si aplica)
- [ ] Variables de entorno preparadas

### Durante la Migración
- [ ] Variables de entorno actualizadas en Supabase
- [ ] Edge Function probada manualmente
- [ ] Mensaje de prueba enviado y recibido
- [ ] Logs de Twilio verificados

### Después de Migrar
- [ ] App probada en producción
- [ ] Monitoreo configurado
- [ ] Alertas configuradas
- [ ] Documentación actualizada

## Diferencias entre Sandbox y Producción

| Característica | Sandbox | Producción |
|---------------|---------|------------|
| Número | `+1 415 523 8886` | Tu número verificado |
| Registro | Manual (join code) | Automático |
| Límites | Solo números registrados | Todos los números |
| Costo | Gratis | $0.005 por mensaje |
| Aprobación | No requerida | Requerida |
| Plantillas | No requeridas | Pueden ser requeridas |

## Troubleshooting

### Problema 1: Mensaje No Llega en Producción

**Solución:**
- Verifica que el número esté verificado en Twilio
- Verifica que el caso de uso esté aprobado
- Revisa los logs de Twilio para ver el error específico

### Problema 2: "Template Not Approved"

**Solución:**
- Usa solo plantillas aprobadas por Twilio
- No modifiques el contenido del mensaje sin aprobación
- Contacta a Twilio para aprobar nuevas plantillas

### Problema 3: Límites de Cuota

**Solución:**
- Verifica tu límite en Twilio Dashboard
- Solicita aumento de límite si es necesario
- Considera implementar rate limiting en tu app

## Recursos Adicionales

- **Documentación de Twilio WhatsApp**: https://www.twilio.com/docs/whatsapp
- **Guía de Aprobación**: https://www.twilio.com/docs/whatsapp/quickstart
- **Facebook Business Manager**: https://business.facebook.com/
- **Consola de Twilio**: https://console.twilio.com/
- **WhatsApp Sandbox (para pruebas)**: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
- **Precios**: https://www.twilio.com/whatsapp/pricing
- **Soporte**: https://support.twilio.com/

## Notas Finales

1. **Mantén el Sandbox**: Puedes mantener el sandbox activo para pruebas
2. **Monitoreo**: Configura alertas para detectar problemas temprano
3. **Backup**: Considera tener un plan B si Twilio falla
4. **Costos**: Monitorea los costos regularmente

## Resumen Rápido

1. ✅ Verifica tu negocio en Facebook Business Manager
2. ✅ Solicita número de WhatsApp en Twilio Console
3. ✅ Aproba tu caso de uso con Twilio
4. ✅ Actualiza `TWILIO_WHATSAPP_NUMBER` en Supabase
5. ✅ Prueba manualmente la Edge Function
6. ✅ Verifica que los mensajes lleguen
7. ✅ Configura monitoreo y alertas

## URLs Actualizadas

- **Consola de Twilio**: https://console.twilio.com/
- **WhatsApp Sandbox (pruebas)**: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
- **Facebook Business Manager**: https://business.facebook.com/
- **Números de Twilio**: https://console.twilio.com/us1/phone-numbers/incoming
- **Monitoreo de Mensajes**: https://console.twilio.com/us1/monitor/logs/messaging

¡Listo para producción! 🚀

