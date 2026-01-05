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
 */
/**
 * Solicita permisos de notificaciones al usuario
 * Nota: El sistema mostrará automáticamente un diálogo explicando que ofiSi necesita
 * acceso a las notificaciones para informarte sobre nuevas solicitudes de servicio,
 * actualizaciones de tus trabajos, mensajes de clientes y recordatorios importantes.
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    // Verificar si ya se solicitó antes
    const permissionAsked = await AsyncStorage.getItem(NOTIFICATION_PERMISSION_KEY);
    
    // Solicitar permisos
    // Nota: El sistema operativo mostrará automáticamente un diálogo con la explicación
    // configurada en app.json (iOS) o strings.xml (Android)
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Guardar que se solicitó el permiso
    await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'true');

    if (finalStatus !== 'granted') {
      console.log('Permisos de notificaciones no otorgados');
      return false;
    }

    console.log('Permisos de notificaciones otorgados');
    return true;
  } catch (error) {
    console.error('Error al solicitar permisos de notificaciones:', error);
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
 */
export const initializeNotifications = async (userId?: string): Promise<void> => {
  try {
    // Solicitar permisos
    const hasPermission = await requestNotificationPermissions();
    
    if (!hasPermission) {
      console.log('No se otorgaron permisos de notificaciones');
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
 */
export const scheduleLocalNotification = async (
  title: string,
  body: string,
  data?: any
): Promise<string> => {
  try {
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
    throw error;
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

