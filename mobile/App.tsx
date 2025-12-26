import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { Platform, NativeModules } from "react-native";
import { AuthNavigator } from "./src/navigation/AuthNavigator";
import { colors } from "./src/constants/colors";
import { supabase } from "./src/services/supabaseClient";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Configurar localización para DateTimePicker en Android
if (Platform.OS === "android") {
  // En Android, la localización del DateTimePicker se toma del sistema
  // pero podemos forzarla si es necesario
  try {
    if (NativeModules.I18nManager) {
      // Configurar para español
    }
  } catch (e) {
    console.log("No se pudo configurar localización:", e);
  }
}

const USER_SESSION_KEY = "@handson_user_session";

export default function App() {
  useEffect(() => {
    // Inicializar la sesión al cargar la app
    const initializeSession = async () => {
      try {
        console.log("=== Inicializando sesión al cargar la app ===");

        // Intentar obtener la sesión actual
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.log("No hay sesión actual:", sessionError);

          // Intentar restaurar desde AsyncStorage
          const savedSession = await AsyncStorage.getItem(USER_SESSION_KEY);
          if (savedSession) {
            try {
              const session = JSON.parse(savedSession);
              console.log("Sesión encontrada en AsyncStorage, restaurando...");

              const {
                data: { session: restoredSession },
                error: restoreError,
              } = await supabase.auth.setSession(session);

              if (!restoreError && restoredSession) {
                console.log(
                  "Sesión restaurada exitosamente:",
                  restoredSession.user?.id
                );
              }
            } catch (parseError) {
              console.error("Error al restaurar sesión:", parseError);
            }
          }
        } else if (session) {
          console.log("Sesión activa encontrada:", session.user?.id);
        }
      } catch (error) {
        console.error("Error en inicializeSession:", error);
      }
    };

    initializeSession();
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <AuthNavigator />
    </>
  );
}
