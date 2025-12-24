// Edge Function para enviar mensajes de promociones por WhatsApp usando Twilio
// Supabase Edge Function - Deno Runtime

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Manejar CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Obtener variables de entorno
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioWhatsAppNumber =
      Deno.env.get("TWILIO_WHATSAPP_NUMBER") || "whatsapp:+14155238886";

    // Validar que las variables estén configuradas
    if (!twilioAccountSid || !twilioAuthToken) {
      console.error("❌ Variables de entorno de Twilio no configuradas");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Configuración de Twilio incompleta",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parsear el body de la request
    const { to, message } = await req.json();

    if (!to || !message) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Teléfono (to) y mensaje (message) son requeridos",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`📱 Enviando mensaje de promoción a ${to}`);

    // Formatear el número de teléfono para Twilio
    let formattedPhone = to.trim();

    // Remover cualquier prefijo whatsapp: existente para limpiar
    if (formattedPhone.startsWith("whatsapp:")) {
      formattedPhone = formattedPhone.replace("whatsapp:", "");
    }

    // Asegurar que empiece con +
    if (!formattedPhone.startsWith("+")) {
      formattedPhone = `+${formattedPhone}`;
    }

    // Agregar prefijo whatsapp: al número de destino
    formattedPhone = `whatsapp:${formattedPhone}`;

    // Asegurar que el número From también tenga el formato correcto
    let fromNumber = twilioWhatsAppNumber.trim();
    if (!fromNumber.startsWith("whatsapp:")) {
      fromNumber = `whatsapp:${fromNumber}`;
    }

    // Preparar las credenciales para Twilio (Basic Auth)
    const credentials = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    // Llamar a la API de Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;

    const formData = new URLSearchParams({
      From: fromNumber,
      To: formattedPhone,
      Body: message,
    });

    console.log(`📤 Enviando a Twilio: ${twilioUrl}`);
    console.log(`📞 De: ${fromNumber} | Para: ${formattedPhone}`);
    console.log(`📝 Mensaje: ${message}`);

    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const twilioData = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error("❌ Error de Twilio:", twilioData);
      return new Response(
        JSON.stringify({
          success: false,
          error: twilioData.message || "Error al enviar mensaje por WhatsApp",
          details: twilioData,
        }),
        {
          status: twilioResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ Mensaje de promoción enviado exitosamente:", twilioData.sid);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Mensaje enviado exitosamente",
        messageSid: twilioData.sid,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Error inesperado:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

