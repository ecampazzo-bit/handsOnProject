# 📋 Resumen Rápido: Migración a Producción

## Pasos Esenciales

### 1. Verificar Negocio en Facebook (1-2 días)
- Ve a: https://business.facebook.com/
- Crea/verifica tu cuenta de Business Manager
- Obtén tu Business Manager ID

### 2. Obtener Número de WhatsApp (1-5 días)
- Ve a: https://console.twilio.com/
- Navega a: Messaging → Try it out → Send a WhatsApp message
- O directamente: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
- Busca "Request Production Access" o "Get Started"
- Completa el formulario con tu Business Manager ID
- Espera aprobación (1-5 días)

### 3. Actualizar Configuración (2 min)
- Supabase Dashboard → Edge Functions → `send-whatsapp-code` → Settings/Secrets
- Cambia: `TWILIO_WHATSAPP_NUMBER` = `whatsapp:+549XXXXXXXXX` (tu número)

### 4. Probar (2 min)
- Invoca la Edge Function manualmente
- Verifica que el mensaje llegue

## ✅ Checklist

- [ ] Negocio verificado en Facebook Business Manager
- [ ] Número de WhatsApp solicitado en Twilio
- [ ] Caso de uso aprobado
- [ ] Variable `TWILIO_WHATSAPP_NUMBER` actualizada
- [ ] Prueba manual exitosa
- [ ] App probada en producción

## 💰 Costos

- **Por mensaje**: $0.005 USD
- **Ejemplo**: 1,000 mensajes/mes = $5 USD/mes

## 🔗 Enlaces Rápidos

- **Consola de Twilio**: https://console.twilio.com/
- **WhatsApp Sandbox (pruebas)**: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
- **Facebook Business Manager**: https://business.facebook.com/
- **Monitoreo**: https://console.twilio.com/us1/monitor/logs/messaging

## ⚠️ Importante

- El código de la Edge Function **ya está listo** para producción
- Solo necesitas cambiar la variable de entorno
- No necesitas modificar el código de la app móvil

