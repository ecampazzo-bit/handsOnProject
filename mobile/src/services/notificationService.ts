import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Verificar si estamos en Expo Go o en un development build
// En Expo Go, executionEnvironment es 'storeClient'
// En development builds, es 'standalone' o 'bare'
const isExpoGo = 
  Constants.executionEnvironment === 'storeClient' ||
  (Constants.appOwnership === 'expo' && !Constants.isDevice);

const EXPO_PUSH_TOKEN_KEY = '@handson_expo_push_token';
const NOTIFICATION_PERMISSION_KEY = '@handson_notification_permission';

// Configurar cómo se manejan las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Solicita permisos de notificaciones al usuario
 * Nota: El sistema mostrará automáticamente un diálogo explicando que ofiSi necesita
 * acceso a las notificaciones para informarte sobre nuevas solicitudes de servicio,
 * actualizaciones de tus trabajos, mensajes de clientes y recordatorios importantes.
 * 
 * IMPORTANTE: En Android, esta función debe llamarse cuando la app está completamente
 * cargada y en primer plano para evitar que la app se cierre.
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    // En Android, asegurarse de que la app esté lista antes de solicitar permisos
    if (Platform.OS === 'android') {
      // Pequeña pausa para asegurar que la actividad esté completamente lista
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Verificar permisos actuales primero
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    
    // Si ya tiene permisos, retornar true inmediatamente
    if (existingStatus === 'granted') {
      console.log('Permisos de notificaciones ya otorgados');
      return true;
    }

    // Si el permiso fue denegado permanentemente, no intentar solicitar de nuevo
    if (existingStatus === 'denied') {
      console.log('Permisos de notificaciones denegados permanentemente');
      await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'denied');
      return false;
    }

    // Solicitar permisos solo si no están otorgados y no fueron denegados permanentemente
    try {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: false,
        },
      });
      
      // Guardar que se solicitó el permiso
      await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, status);

      if (status !== 'granted') {
        console.log('Permisos de notificaciones no otorgados:', status);
        return false;
      }

      console.log('Permisos de notificaciones otorgados');
      return true;
    } catch (requestError: any) {
      // En Android, si hay un error al solicitar permisos, puede ser porque
      // la actividad no está lista. Retornar false sin lanzar error.
      console.error('Error al solicitar permisos de notificaciones:', requestError);
      
      // Guardar que hubo un error
      await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'error');
      
      // No lanzar el error para evitar que la app se cierre
      return false;
    }
  } catch (error) {
    console.error('Error al verificar/solicitar permisos de notificaciones:', error);
    // No lanzar el error para evitar que la app se cierre
    return false;
  }
};

/**
 * Obtiene el token de notificaciones push de Expo
 * Nota: Las notificaciones push remotas no están disponibles en Expo Go (SDK 53+)
 * Solo funcionan en development builds o builds de producción
 * 
 * IMPORTANTE: Esta función nunca debe llamarse en Expo Go
 */
export const getExpoPushToken = async (): Promise<string | null> => {
  // Verificar ANTES de hacer cualquier cosa si estamos en Expo Go
  const isExpoGoCheck = 
    Constants.executionEnvironment === 'storeClient' ||
    (Constants.appOwnership === 'expo' && !Constants.isDevice);
  
  if (isExpoGoCheck) {
    // No intentar obtener token en Expo Go - retornar null silenciosamente
    return null;
  }

  try {
    // Verificar permisos primero
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.log('No hay permisos de notificaciones');
      return null;
    }

    // Obtener el token (solo en development builds o producción)
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '6654f1d9-c2cb-4de2-973a-85f786d03a5f', // EAS Project ID
    });

    const token = tokenData.data;
    console.log('Token de notificaciones obtenido:', token);

    // Guardar el token localmente
    await AsyncStorage.setItem(EXPO_PUSH_TOKEN_KEY, token);

    return token;
  } catch (error: any) {
    // Si el error es sobre Expo Go, ignorarlo silenciosamente
    if (
      error?.message?.includes('Expo Go') ||
      error?.message?.includes('development build') ||
      error?.message?.includes('removed from Expo Go')
    ) {
      console.log('Notificaciones push remotas no disponibles. Usando notificaciones locales.');
      return null;
    }
    console.error('Error al obtener token de notificaciones:', error);
    return null;
  }
};

/**
 * Registra el token de notificaciones en Supabase
 */
export const registerPushToken = async (userId: string, token: string): Promise<boolean> => {
  try {
    // Aquí puedes guardar el token en Supabase si tienes una tabla para tokens
    // Por ahora, solo lo guardamos localmente
    console.log('Token registrado para usuario:', userId);
    return true;
  } catch (error) {
    console.error('Error al registrar token:', error);
    return false;
  }
};

/**
 * Inicializa el sistema de notificaciones
 * @param userId - ID del usuario (opcional)
 * @param requestPermissionsNow - Si es true, solicita permisos inmediatamente. 
 *                                 Si es false, solo verifica permisos existentes.
 *                                 Por defecto es false para evitar cerrar la app en Android.
 */
export const initializeNotifications = async (
  userId?: string,
  requestPermissionsNow: boolean = false
): Promise<void> => {
  try {
    let hasPermission = false;

    if (requestPermissionsNow) {
      // Solicitar permisos solo si se solicita explícitamente
      hasPermission = await requestNotificationPermissions();
    } else {
      // Solo verificar permisos existentes sin solicitarlos
      try {
        const { status } = await Notifications.getPermissionsAsync();
        hasPermission = status === 'granted';
        
        if (!hasPermission) {
          console.log('Permisos de notificaciones no otorgados. Se pueden solicitar más tarde.');
        }
      } catch (error) {
        console.error('Error al verificar permisos de notificaciones:', error);
        hasPermission = false;
      }
    }
    
    if (!hasPermission) {
      console.log('No se pueden inicializar notificaciones sin permisos');
      return;
    }

    // Solo intentar obtener token push si NO estamos en Expo Go
    if (!isExpoGo) {
      try {
        const token = await getExpoPushToken();
        if (token && userId) {
          // Registrar token en Supabase
          await registerPushToken(userId, token);
        }
      } catch (tokenError: any) {
        // Si el error es sobre Expo Go, ignorarlo
        if (
          tokenError?.message?.includes('Expo Go') ||
          tokenError?.message?.includes('development build') ||
          tokenError?.message?.includes('removed from Expo Go')
        ) {
          console.log('Modo Expo Go: Las notificaciones locales funcionarán, pero las push remotas requieren un development build.');
        } else {
          console.error('Error al obtener token push:', tokenError);
        }
      }
    } else {
      console.log('Modo Expo Go: Las notificaciones locales funcionarán, pero las push remotas requieren un development build.');
    }
  } catch (error) {
    console.error('Error al inicializar notificaciones:', error);
    // No lanzar el error para evitar que la app se cierre
  }
};

/**
 * Configura los listeners de notificaciones
 */
export const setupNotificationListeners = (
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void
) => {
  // Listener para cuando se recibe una notificación mientras la app está en primer plano
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('Notificación recibida:', notification);
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    }
  );

  // Listener para cuando el usuario toca una notificación
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log('Notificación tocada:', response);
      if (onNotificationTapped) {
        onNotificationTapped(response);
      }
    }
  );

  return {
    receivedSubscription,
    responseSubscription,
    remove: () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    },
  };
};

/**
 * Programa una notificación local
 * IMPORTANTE: Esta función NO solicita permisos automáticamente.
 * Asegúrate de que los permisos estén otorgados antes de llamar esta función.
 */
export const scheduleLocalNotification = async (
  title: string,
  body: string,
  data?: any
): Promise<string | null> => {
  try {
    // Verificar permisos antes de programar la notificación
    const { status } = await Notifications.getPermissionsAsync();
    
    if (status !== 'granted') {
      console.log('No se puede programar notificación: permisos no otorgados');
      return null;
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
      },
      trigger: null, // Se muestra inmediatamente
    });

    return identifier;
  } catch (error) {
    console.error('Error al programar notificación local:', error);
    // No lanzar el error para evitar que la app se cierre
    return null;
  }
};

/**
 * Cancela todas las notificaciones programadas
 */
export const cancelAllNotifications = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error al cancelar notificaciones:', error);
  }
};

/**
 * Obtiene el token guardado localmente
 */
export const getStoredPushToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(EXPO_PUSH_TOKEN_KEY);
  } catch (error) {
    console.error('Error al obtener token guardado:', error);
    return null;
  }
};

/**
 * Solicita permisos de notificaciones de manera segura
 * Esta función debe llamarse cuando el usuario explícitamente quiere habilitar notificaciones
 * (por ejemplo, desde un botón en la UI)
 * 
 * @returns Promise<boolean> - true si los permisos fueron otorgados, false en caso contrario
 */
export const safelyRequestNotificationPermissions = async (): Promise<boolean> => {
  try {
    // En Android, asegurarse de que la app esté completamente lista
    if (Platform.OS === 'android') {
      // Esperar un poco más para asegurar que la actividad esté lista
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return await requestNotificationPermissions();
  } catch (error) {
    console.error('Error al solicitar permisos de notificaciones de manera segura:', error);
    return false;
  }
};

