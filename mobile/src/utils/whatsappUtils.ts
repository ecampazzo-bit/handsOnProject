import { Linking, Alert, Platform } from "react-native";

/**
 * Abre WhatsApp con un número de teléfono y mensaje opcional
 * @param telefono - Número de teléfono en cualquier formato
 * @param mensaje - Mensaje opcional a enviar
 * @param nombre - Nombre opcional para mostrar en errores
 */
export const openWhatsApp = async (
  telefono: string,
  mensaje?: string,
  nombre?: string
): Promise<void> => {
  try {
    // Validar que el teléfono no esté vacío
    if (!telefono || !telefono.trim()) {
      Alert.alert(
        "Error",
        "No se proporcionó un número de teléfono válido"
      );
      return;
    }

    // Guardar el número original para mostrar en errores
    const telefonoOriginal = telefono.trim();
    
    // Limpiar y normalizar el número de teléfono
    let phoneNumber = telefonoOriginal;
    
    // Remover todos los caracteres excepto números y +
    phoneNumber = phoneNumber.replace(/[^0-9+]/g, "");

    // Validar que quede algo después de limpiar
    if (!phoneNumber || phoneNumber.length < 8) {
      Alert.alert(
        "Error",
        `El número de teléfono "${telefonoOriginal}" no es válido`
      );
      return;
    }

    // Si no empieza con +, agregar código de país (Argentina por defecto)
    if (!phoneNumber.startsWith("+")) {
      // Si empieza con 0, removerlo y agregar +54
      if (phoneNumber.startsWith("0")) {
        phoneNumber = `+54${phoneNumber.substring(1)}`;
      } else if (phoneNumber.startsWith("9")) {
        // Si empieza con 9, agregar +54
        phoneNumber = `+54${phoneNumber}`;
      } else {
        // Asumir que es Argentina si no tiene código de país
        phoneNumber = `+54${phoneNumber}`;
      }
    }

    // Remover el + para la URL de wa.me (necesita solo números)
    const phoneForUrl = phoneNumber.replace(/^\+/, "");

    console.log(`📱 Intentando abrir WhatsApp:`);
    console.log(`   - Nombre: ${nombre || "Usuario"}`);
    console.log(`   - Número original: "${telefonoOriginal}"`);
    console.log(`   - Número normalizado: ${phoneNumber}`);
    console.log(`   - Número para URL: ${phoneForUrl}`);
    console.log(`   - Mensaje: ${mensaje || "Sin mensaje"}`);

    // Construir URLs para intentar
    const waMeUrl = mensaje
      ? `https://wa.me/${phoneForUrl}?text=${encodeURIComponent(mensaje)}`
      : `https://wa.me/${phoneForUrl}`;
    
    const nativeUrl = mensaje
      ? `whatsapp://send?phone=${phoneForUrl}&text=${encodeURIComponent(mensaje)}`
      : `whatsapp://send?phone=${phoneForUrl}`;

    // En iOS, canOpenURL puede fallar incluso si la app está instalada
    // Por eso intentamos abrir directamente y manejamos el error
    if (Platform.OS === "ios") {
      // En iOS, intentar primero con wa.me (más confiable)
      try {
        const canOpen = await Linking.canOpenURL(waMeUrl);
        if (canOpen) {
          await Linking.openURL(waMeUrl);
          return;
        }
      } catch (e) {
        console.log("⚠️ canOpenURL falló, intentando abrir directamente...");
      }
      
      // Si canOpenURL falla, intentar abrir directamente
      try {
        await Linking.openURL(waMeUrl);
        return;
      } catch (e) {
        console.log("⚠️ wa.me falló, intentando con esquema nativo...");
        try {
          await Linking.openURL(nativeUrl);
          return;
        } catch (e2) {
          console.error("❌ Error al abrir WhatsApp:", e2);
          const nombreUsuario = nombre ? ` ${nombre}` : "";
          Alert.alert(
            "WhatsApp no disponible",
            `No se pudo abrir WhatsApp para contactar a${nombreUsuario}.\n\nPor favor instala WhatsApp o contacta directamente al número:\n${phoneNumber}`
          );
        }
      }
    } else {
      // En Android, verificar primero
      const canOpen = await Linking.canOpenURL(waMeUrl);
      if (canOpen) {
        await Linking.openURL(waMeUrl);
      } else {
        // Intentar con esquema nativo
        const canOpenNative = await Linking.canOpenURL(nativeUrl);
        if (canOpenNative) {
          await Linking.openURL(nativeUrl);
        } else {
          // Si ambos fallan, intentar abrir directamente de todas formas
          try {
            await Linking.openURL(waMeUrl);
          } catch (e) {
            console.error("❌ Error al abrir WhatsApp:", e);
            const nombreUsuario = nombre ? ` ${nombre}` : "";
            Alert.alert(
              "WhatsApp no disponible",
              `No se pudo abrir WhatsApp para contactar a${nombreUsuario}.\n\nPor favor instala WhatsApp o contacta directamente al número:\n${phoneNumber}`
            );
          }
        }
      }
    }
  } catch (error) {
    console.error("❌ Error inesperado al abrir WhatsApp:", error);
    console.error("❌ Número recibido:", telefono);
    const nombreUsuario = nombre ? ` ${nombre}` : "";
    Alert.alert(
      "Error",
      `No se pudo abrir WhatsApp para contactar a${nombreUsuario}.\n\nPor favor contacta directamente al número:\n${telefono || "Número no disponible"}`
    );
  }
};

/**
 * Verifica si WhatsApp está instalado en el dispositivo
 */
export const isWhatsAppInstalled = async (): Promise<boolean> => {
  try {
    const whatsappUrl = "https://wa.me/";
    return await Linking.canOpenURL(whatsappUrl);
  } catch {
    return false;
  }
};

