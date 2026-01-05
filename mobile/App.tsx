import React, { useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { Platform, NativeModules, Alert } from "react-native";
import { AuthNavigator } from "./src/navigation/AuthNavigator";
import { colors } from "./src/constants/colors";
import { supabase } from "./src/services/supabaseClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  initializeNotifications,
  setupNotificationListeners,
  scheduleLocalNotification,
} from "./src/services/notificationService";
import * as Notifications from "expo-notifications";

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

/**
 * Configura el listener de Realtime para recibir notificaciones de Supabase
 */
const setupRealtimeNotifications = (userId: string) => {
  console.log("Configurando Realtime para notificaciones, usuario:", userId);

  const channel = supabase
    .channel(`notificaciones:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notificaciones",
        filter: `usuario_id=eq.${userId}`,
      },
      async (payload) => {
        console.log("Nueva notificación recibida desde Supabase:", payload);
        
        const notificacion = payload.new;
        
        // Mostrar notificación push en el dispositivo
        try {
          await scheduleLocalNotification(
            notificacion.titulo || "Nueva notificación",
            notificacion.contenido || "",
            {
              notificacionId: notificacion.id,
              tipo: notificacion.tipo,
              referenciaId: notificacion.referencia_id,
              referenciaTipo: notificacion.referencia_tipo,
              screen: "Notificaciones",
            }
          );
        } catch (error) {
          console.error("Error al mostrar notificación push:", error);
        }
      }
    )
    .subscribe((status) => {
      console.log("Estado de suscripción Realtime:", status);
    });

  return channel;
};

export default function App() {
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);
  const realtimeChannel = useRef<any>(null);

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
                
                // Inicializar notificaciones después de restaurar sesión
                await initializeNotifications(restoredSession.user?.id);
              }
            } catch (parseError) {
              console.error("Error al restaurar sesión:", parseError);
            }
          }
        } else if (session) {
          console.log("Sesión activa encontrada:", session.user?.id);
          
          // Inicializar notificaciones si hay sesión
          await initializeNotifications(session.user?.id);
          
          // Configurar listener de Realtime para notificaciones
          setupRealtimeNotifications(session.user.id);
        } else {
          // Inicializar notificaciones incluso sin sesión (para solicitar permisos)
          await initializeNotifications();
        }
      } catch (error) {
        console.error("Error en inicializeSession:", error);
      }
    };

    initializeSession();

    // Configurar listeners de notificaciones
    const listeners = setupNotificationListeners(
      // Cuando se recibe una notificación
      async (notification) => {
        console.log("Notificación recibida en primer plano:", notification);
        
        // Mostrar notificación local si es necesario
        try {
          await scheduleLocalNotification(
            notification.request.content.title || "Nueva notificación",
            notification.request.content.body || "",
            notification.request.content.data
          );
        } catch (error) {
          console.error("Error al mostrar notificación local:", error);
        }
      },
      // Cuando el usuario toca una notificación
      (response) => {
        console.log("Usuario tocó la notificación:", response);
        const data = response.notification.request.content.data;
        
        // Aquí puedes navegar a una pantalla específica basada en los datos
        if (data?.screen) {
          // Navegar a la pantalla correspondiente
          console.log("Navegar a:", data.screen);
        }
      }
    );

    notificationListener.current = listeners.receivedSubscription;
    responseListener.current = listeners.responseSubscription;

    // Configurar canal de notificaciones para Android
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
        sound: "default",
        enableVibrate: true,
        showBadge: true,
      });
    }

    // Escuchar cambios de autenticación para configurar/limpiar Realtime
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Cambio de estado de autenticación:", event, session?.user?.id);

      if (event === "SIGNED_IN" && session?.user?.id) {
        // Usuario inició sesión - configurar Realtime
        if (realtimeChannel.current) {
          await supabase.removeChannel(realtimeChannel.current);
        }
        realtimeChannel.current = setupRealtimeNotifications(session.user.id);
        await initializeNotifications(session.user.id);
      } else if (event === "SIGNED_OUT") {
        // Usuario cerró sesión - limpiar Realtime
        if (realtimeChannel.current) {
          await supabase.removeChannel(realtimeChannel.current);
          realtimeChannel.current = null;
        }
      }
    });

    // Limpiar listeners al desmontar
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
      if (realtimeChannel.current) {
        supabase.removeChannel(realtimeChannel.current);
      }
      authSubscription.unsubscribe();
    };
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <AuthNavigator />
    </>
  );
}
