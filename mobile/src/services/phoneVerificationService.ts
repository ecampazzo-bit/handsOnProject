import { supabase } from "./supabaseClient";
import { formatArgentinePhone } from "../utils/validation";

/**
 * Envía un código de verificación por WhatsApp
 */
export const sendVerificationCode = async (
  telefono: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const formattedPhone = formatArgentinePhone(telefono);

    console.log(`📱 Enviando código de verificación a: ${formattedPhone}`);

    // Paso 1: Generar código usando la RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "enviar_codigo_whatsapp",
      {
        p_telefono: formattedPhone,
      }
    );

    if (rpcError) {
      console.error("❌ Error al generar código:", rpcError);
      return {
        success: false,
        error: rpcError.message || "Error al generar código de verificación",
      };
    }

    if (!rpcData || rpcData.success === false) {
      console.error("❌ RPC retornó error:", rpcData?.error);
      return {
        success: false,
        error: rpcData?.error || "Error al generar código de verificación",
      };
    }

    console.log("✅ Código generado:", rpcData.codigo);

    // Paso 2: Llamar directamente a la Edge Function para enviar el WhatsApp
    try {
      console.log(`📞 Llamando a Edge Function para enviar WhatsApp...`);

      const response = await fetch(
        "https://kqxnjpyupcxbajuzsbtx.supabase.co/functions/v1/send-whatsapp-code",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            telefono: formattedPhone,
            codigo: rpcData.codigo,
          }),
        }
      );

      const edgeFunctionData = await response.json();

      if (!response.ok) {
        console.error("❌ Error de Edge Function:", edgeFunctionData);
        // Aunque falle el envío de WhatsApp, el código ya fue generado
        // El usuario puede verlo en logs para desarrollo
        return {
          success: true,
          error: null,
        };
      }

      console.log(
        "✅ Código de verificación enviado exitosamente por WhatsApp",
        edgeFunctionData
      );
      return { success: true, error: null };
    } catch (edgeFunctionError) {
      console.error("⚠️ Error al llamar Edge Function:", edgeFunctionError);
      // El código fue generado, solo falló el envío de WhatsApp
      // Retornamos éxito porque el código está guardado
      return { success: true, error: null };
    }
  } catch (error) {
    console.error("❌ Error inesperado al enviar código:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al enviar código",
    };
  }
};

/**
 * Verifica el código ingresado por el usuario
 */
export const verifyCode = async (
  telefono: string,
  codigo: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const formattedPhone = formatArgentinePhone(telefono);

    console.log(`🔍 Verificando código para: ${formattedPhone}`);
    console.log(`📝 Código ingresado: ${codigo}`);

    const { data, error } = await supabase.rpc("verificar_codigo_whatsapp", {
      p_telefono: formattedPhone,
      p_codigo: codigo.trim(), // Limpiar espacios del código
    });

    if (error) {
      console.error("❌ Error al verificar código:", error);
      console.error("📋 Detalles:", JSON.stringify(error, null, 2));
      return {
        success: false,
        error: error.message || "Error al verificar código",
      };
    }

    console.log("📦 Respuesta de verificación:", JSON.stringify(data, null, 2));

    if (data && data.success === false) {
      // Si hay información de debug, mostrarla
      if (data.debug_info) {
        console.log("🐛 Debug info:", JSON.stringify(data.debug_info, null, 2));
      }

      return {
        success: false,
        error: data.error || "Código inválido o expirado",
      };
    }

    console.log("✅ Código verificado exitosamente");
    return { success: true, error: null };
  } catch (error) {
    console.error("❌ Error inesperado al verificar código:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al verificar código",
    };
  }
};

/**
 * Verifica si un teléfono ya está verificado
 */
export const isPhoneVerified = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("telefono_verificado")
      .eq("id", userId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.telefono_verificado === true;
  } catch (error) {
    console.error("Error al verificar estado:", error);
    return false;
  }
};
