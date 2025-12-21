import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { supabase } from "../services/supabaseClient";
import { colors } from "../constants/colors";
import { getCurrentUserId, getCurrentUser } from "../services/authService";
import { RootStackParamList } from "../types/navigation";

type NotificacionesNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Notificaciones"
>;

interface Notificacion {
  id: number;
  tipo: string;
  titulo: string;
  contenido: string | null;
  referencia_id: number | null;
  referencia_tipo: string | null;
  leida: boolean;
  created_at: string;
}

export const NotificacionesScreen: React.FC = () => {
  const navigation = useNavigation<NotificacionesNavigationProp>();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userType, setUserType] = useState<
    "cliente" | "prestador" | "ambos" | null
  >(null);

  useFocusEffect(
    useCallback(() => {
      loadNotificaciones();
    }, [])
  );

  const loadNotificaciones = async () => {
    try {
      setLoading(true);
      const userId = await getCurrentUserId();
      if (!userId) return;

      // Obtener el tipo de usuario
      const { user } = await getCurrentUser();
      if (!user) return;

      const isCliente = user.tipo_usuario === "cliente";
      const isPrestador = user.tipo_usuario === "prestador";
      const isAmbos = user.tipo_usuario === "ambos";
      setUserType(user.tipo_usuario);

      // Tipos de notificaciones según el tipo de usuario
      let tiposNotificacion: string[];
      if (isCliente) {
        tiposNotificacion = ["nueva_cotizacion", "sistema"];
      } else if (isPrestador) {
        tiposNotificacion = [
          "nueva_solicitud",
          "trabajo_aceptado",
          "sistema",
          "calificacion",
        ];
      } else if (isAmbos) {
        // Usuario tipo "ambos" - debe recibir ambos tipos de notificaciones
        tiposNotificacion = [
          "nueva_cotizacion",
          "nueva_solicitud",
          "trabajo_aceptado",
          "sistema",
          "calificacion",
        ];
      } else {
        tiposNotificacion = ["sistema"];
      }

      // Obtener todas las notificaciones del usuario
      const { data, error } = await supabase
        .from("notificaciones")
        .select(
          "id, tipo, titulo, contenido, referencia_id, referencia_tipo, leida, created_at"
        )
        .eq("usuario_id", userId)
        .in("tipo", tiposNotificacion)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error al cargar notificaciones:", error);
        return;
      }

      setNotificaciones(data || []);
    } catch (error) {
      console.error("Error inesperado:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotificaciones();
  };

  const handleNotificationPress = async (notificacion: Notificacion) => {
    // Marcar como leída si no lo está
    if (!notificacion.leida) {
      await supabase
        .from("notificaciones")
        .update({ leida: true })
        .eq("id", notificacion.id);

      // Actualizar el estado local
      setNotificaciones((prev) =>
        prev.map((n) => (n.id === notificacion.id ? { ...n, leida: true } : n))
      );
    }

    const isCliente = userType === "cliente";

    // Navegar según el tipo de notificación y el tipo de usuario
    switch (notificacion.tipo) {
      case "nueva_solicitud":
        // Solo para prestadores: navegar a solicitudes pendientes
        if (!isCliente) {
          navigation.navigate("SolicitudesPendientes");
        }
        break;
      case "nueva_cotizacion":
        // Solo para clientes: navegar a Mis Presupuestos con la solicitud específica
        if (isCliente || userType === "ambos") {
          // Si la notificación tiene referencia a una solicitud, navegar directamente a ella
          if (
            notificacion.referencia_tipo === "solicitud_servicio" &&
            notificacion.referencia_id
          ) {
            navigation.navigate("MisPresupuestos", {
              solicitudId: notificacion.referencia_id,
              tab: "pendientes",
            });
          } else {
            navigation.navigate("MisPresupuestos", {
              tab: "pendientes",
            });
          }
        }
        break;
      case "trabajo_aceptado":
      case "sistema":
        // Navegar según la referencia
        if (
          notificacion.referencia_tipo === "trabajo" &&
          notificacion.referencia_id
        ) {
          navigation.navigate("MisTrabajos");
        } else if (notificacion.referencia_tipo === "cotizacion") {
          // Si es prestador y es sobre cotización, ir a Mis Cotizaciones
          if (!isCliente) {
            navigation.navigate("MisCotizaciones");
          } else {
            // Si es cliente, ir a Mis Presupuestos
            navigation.navigate("MisPresupuestos");
          }
        } else if (notificacion.referencia_tipo === "solicitud_servicio") {
          // Si es sobre una solicitud, clientes van a Mis Presupuestos
          if (isCliente) {
            navigation.navigate("MisPresupuestos");
          } else {
            navigation.navigate("SolicitudesPendientes");
          }
        } else {
          navigation.navigate("MisTrabajos");
        }
        break;
      case "calificacion":
        // Ir a Mis Trabajos para ver la calificación
        navigation.navigate("MisTrabajos");
        break;
      default:
        // Por defecto según el tipo de usuario
        if (isCliente) {
          navigation.navigate("MisPresupuestos");
        } else {
          navigation.navigate("MisTrabajos");
        }
    }
  };

  const getNotificationIcon = (tipo: string) => {
    switch (tipo) {
      case "nueva_solicitud":
        return "📋";
      case "nueva_cotizacion":
        return "💰";
      case "trabajo_aceptado":
        return "✅";
      case "calificacion":
        return "⭐";
      case "sistema":
        return "🔔";
      default:
        return "📢";
    }
  };

  const getNotificationColor = (tipo: string) => {
    switch (tipo) {
      case "nueva_solicitud":
        return colors.primary;
      case "nueva_cotizacion":
        return colors.success;
      case "trabajo_aceptado":
        return colors.success;
      case "calificacion":
        return colors.warning;
      case "sistema":
        return colors.primary;
      default:
        return colors.textSecondary;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Notificaciones</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notificaciones</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {notificaciones.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>No tienes notificaciones</Text>
          </View>
        ) : (
          notificaciones.map((notificacion) => (
            <TouchableOpacity
              key={notificacion.id}
              style={[
                styles.notificationCard,
                !notificacion.leida && styles.notificationCardUnread,
              ]}
              onPress={() => handleNotificationPress(notificacion)}
            >
              <View style={styles.notificationContent}>
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor:
                        getNotificationColor(notificacion.tipo) + "20",
                    },
                  ]}
                >
                  <Text style={styles.icon}>
                    {getNotificationIcon(notificacion.tipo)}
                  </Text>
                </View>
                <View style={styles.textContainer}>
                  <View style={styles.titleRow}>
                    <Text style={styles.notificationTitle}>
                      {notificacion.titulo}
                    </Text>
                    {!notificacion.leida && <View style={styles.unreadDot} />}
                  </View>
                  {notificacion.contenido && (
                    <Text style={styles.notificationText} numberOfLines={2}>
                      {notificacion.contenido}
                    </Text>
                  )}
                  <Text style={styles.notificationDate}>
                    {new Date(notificacion.created_at).toLocaleString("es-AR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    fontSize: 16,
    color: colors.primary,
    marginRight: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
  },
  notificationCard: {
    backgroundColor: colors.white,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notificationCardUnread: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primaryLight + "10",
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 8,
  },
  notificationText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationDate: {
    fontSize: 12,
    color: colors.textLight,
  },
});
