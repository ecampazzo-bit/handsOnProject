import { Linking, Alert, Platform } from "react-native";

/**
 * Abre la aplicación de llamadas con un número de teléfono
 * @param telefono - Número de teléfono en cualquier formato
 * @param nombre - Nombre opcional para mostrar en errores
 */
export const openPhoneCall = async (
  telefono: string,
  nombre?: string
): Promise<void> => {
  try {
    // Validar que el teléfono no esté vacío
    if (!telefono || !telefono.trim()) {
      Alert.alert(
        "Error",
        `No se puede llamar a ${nombre || "el usuario"} porque no tiene un número de teléfono registrado.`
      );
      return;
    }

    // Guardar el número original
    const telefonoOriginal = telefono.trim();
    
    // Limpiar y normalizar el número de teléfono para llamadas
    // Para tel:, necesitamos solo números, sin espacios ni caracteres especiales
    let phoneNumber = telefonoOriginal;
    
    // Remover todos los caracteres excepto números y +
    phoneNumber = phoneNumber.replace(/[^0-9+]/g, "");

    // Validar que quede algo después de limpiar
    if (!phoneNumber || phoneNumber.length < 8) {
      Alert.alert(
        "Error",
        `El número de teléfono "${telefonoOriginal}" no es válido para realizar una llamada.`
      );
      return;
    }

    // Para tel:, algunos dispositivos prefieren con +, otros sin +
    // Intentaremos ambos formatos si es necesario
    const urlWithPlus = `tel:${phoneNumber}`;
    const urlWithoutPlus = `tel:${phoneNumber.replace(/^\+/, "")}`;

    console.log(`📞 Intentando realizar llamada:`);
    console.log(`   - Nombre: ${nombre || "Usuario"}`);
    console.log(`   - Número original: "${telefonoOriginal}"`);
    console.log(`   - Número para llamada: ${phoneNumber}`);

    // En iOS, canOpenURL puede fallar incluso si la app está instalada
    // Por eso intentamos abrir directamente y manejamos el error
    if (Platform.OS === "ios") {
      // En iOS, intentar primero con el número tal cual
      try {
        const canOpen = await Linking.canOpenURL(urlWithPlus);
        if (canOpen) {
          await Linking.openURL(urlWithPlus);
          return;
        }
      } catch (e) {
        console.log("⚠️ canOpenURL falló, intentando abrir directamente...");
      }
      
      // Si canOpenURL falla, intentar abrir directamente
      try {
        await Linking.openURL(urlWithPlus);
        return;
      } catch (e) {
        console.log("⚠️ URL con + falló, intentando sin +...");
        try {
          await Linking.openURL(urlWithoutPlus);
          return;
        } catch (e2) {
          console.error("❌ Error al abrir aplicación de llamadas:", e2);
          const nombreUsuario = nombre ? ` a ${nombre}` : "";
          Alert.alert(
            "No se puede realizar la llamada",
            `No se pudo abrir la aplicación de llamadas para contactar${nombreUsuario}.\n\nPor favor llama manualmente al número:\n${phoneNumber}`
          );
        }
      }
    } else {
      // En Android, verificar primero
      const canOpen = await Linking.canOpenURL(urlWithPlus);
      if (canOpen) {
        await Linking.openURL(urlWithPlus);
      } else {
        // Intentar sin el +
        const canOpenWithoutPlus = await Linking.canOpenURL(urlWithoutPlus);
        if (canOpenWithoutPlus) {
          await Linking.openURL(urlWithoutPlus);
        } else {
          // Si ambos fallan, intentar abrir directamente de todas formas
          try {
            await Linking.openURL(urlWithPlus);
          } catch (e) {
            console.error("❌ Error al abrir aplicación de llamadas:", e);
            const nombreUsuario = nombre ? ` a ${nombre}` : "";
            Alert.alert(
              "No se puede realizar la llamada",
              `No se pudo abrir la aplicación de llamadas para contactar${nombreUsuario}.\n\nPor favor llama manualmente al número:\n${phoneNumber}`
            );
          }
        }
      }
    }
  } catch (error) {
    console.error("❌ Error inesperado al realizar llamada:", error);
    console.error("❌ Número recibido:", telefono);
    const nombreUsuario = nombre ? ` a ${nombre}` : "";
    Alert.alert(
      "Error",
      `No se pudo realizar la llamada${nombreUsuario}.\n\nPor favor llama manualmente al número:\n${telefono || "Número no disponible"}`
    );
  }
};

