import React, { useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { Platform, NativeModules, Alert, AppState, AppStateStatus } from "react-native";
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
 * Restaura la sesión desde AsyncStorage cuando la app vuelve al foreground
 */
const restoreSession = async (): Promise<boolean> => {
  try {
    console.log("=== Restaurando sesión al volver al foreground ===");
    
    // Primero intentar obtener la sesión actual de Supabase
    const {
      data: { session: currentSession },
      error: sessionError,
    } = await supabase.auth.getSession();

    // Si ya hay una sesión activa, verificar que sea válida
    if (currentSession && currentSession.user) {
      console.log("Sesión activa encontrada, verificando validez...");
      
      // Intentar refrescar el token para asegurar que la sesión sea válida
      try {
        const { data: { session: refreshedSession }, error: refreshError } = 
          await supabase.auth.refreshSession();
        
        if (!refreshError && refreshedSession) {
          console.log("Sesión refrescada exitosamente");
          // Guardar la sesión refrescada
          await AsyncStorage.setItem(
            USER_SESSION_KEY,
            JSON.stringify(refreshedSession)
          );
          return true;
        }
      } catch (refreshError) {
        console.log("No se pudo refrescar la sesión, continuando con la actual");
      }
      
      // Si la sesión actual es válida, guardarla y retornar
      await AsyncStorage.setItem(
        USER_SESSION_KEY,
        JSON.stringify(currentSession)
      );
      return true;
    }

    // Si no hay sesión activa, intentar restaurar desde AsyncStorage
    console.log("No hay sesión activa, intentando restaurar desde AsyncStorage...");
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
          
          // Guardar la sesión restaurada
          await AsyncStorage.setItem(
            USER_SESSION_KEY,
            JSON.stringify(restoredSession)
          );
          return true;
        } else {
          console.log("Error al restaurar sesión:", restoreError);
          // Si la sesión guardada es inválida, limpiarla
          await AsyncStorage.removeItem(USER_SESSION_KEY);
          return false;
        }
      } catch (parseError) {
        console.error("Error al parsear sesión guardada:", parseError);
        // Limpiar sesión corrupta
        await AsyncStorage.removeItem(USER_SESSION_KEY);
        return false;
      }
    } else {
      console.log("No hay sesión guardada en AsyncStorage");
      return false;
    }
  } catch (error) {
    console.error("Error al restaurar sesión:", error);
    return false;
  }
};

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
  const appState = useRef<AppStateStatus>(AppState.currentState);

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
        // Usuario inició sesión - guardar sesión y configurar Realtime
        try {
          await AsyncStorage.setItem(
            USER_SESSION_KEY,
            JSON.stringify(session)
          );
          console.log("Sesión guardada después de SIGNED_IN");
        } catch (error) {
          console.error("Error al guardar sesión:", error);
        }
        
        // Configurar Realtime
        if (realtimeChannel.current) {
          await supabase.removeChannel(realtimeChannel.current);
        }
        realtimeChannel.current = setupRealtimeNotifications(session.user.id);
        await initializeNotifications(session.user.id);
      } else if (event === "SIGNED_OUT") {
        // Usuario cerró sesión - limpiar Realtime y sesión guardada
        try {
          await AsyncStorage.removeItem(USER_SESSION_KEY);
          console.log("Sesión eliminada después de SIGNED_OUT");
        } catch (error) {
          console.error("Error al eliminar sesión:", error);
        }
        
        if (realtimeChannel.current) {
          await supabase.removeChannel(realtimeChannel.current);
          realtimeChannel.current = null;
        }
      } else if (event === "TOKEN_REFRESHED" && session?.user?.id) {
        // Token refrescado - actualizar sesión guardada
        try {
          await AsyncStorage.setItem(
            USER_SESSION_KEY,
            JSON.stringify(session)
          );
          console.log("Sesión actualizada después de TOKEN_REFRESHED");
        } catch (error) {
          console.error("Error al actualizar sesión:", error);
        }
      }
    });

    // Listener para cuando la app vuelve al foreground
    const appStateSubscription = AppState.addEventListener(
      "change",
      async (nextAppState: AppStateStatus) => {
        console.log("AppState cambió:", {
          previous: appState.current,
          next: nextAppState,
        });

        // Si la app vuelve al foreground desde background o inactive
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          console.log("App volvió al foreground, restaurando sesión...");
          
          // Restaurar sesión
          const restored = await restoreSession();
          
          if (restored) {
            // Verificar que la sesión restaurada tenga un usuario
            const {
              data: { session },
            } = await supabase.auth.getSession();
            
            if (session?.user?.id) {
              console.log("Sesión restaurada correctamente, usuario:", session.user.id);
              
              // Reconfigurar Realtime si no está configurado
              if (!realtimeChannel.current) {
                realtimeChannel.current = setupRealtimeNotifications(session.user.id);
              }
              
              // Reinicializar notificaciones
              await initializeNotifications(session.user.id);
            }
          } else {
            console.log("No se pudo restaurar la sesión");
          }
        }

        appState.current = nextAppState;
      }
    );

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
      appStateSubscription.remove();
    };
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <AuthNavigator />
    </>
  );
}
