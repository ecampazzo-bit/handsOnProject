import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import {
  getCurrentUser,
  signOut,
  getCurrentUserId,
} from "../services/authService";
import { User, RootStackParamList } from "../types/navigation";
import { colors } from "../constants/colors";
import { BuscarServicios } from "../components/BuscarServicios";
import { OfrezcoServicios } from "../components/OfrezcoServicios";
import { GestionCuenta } from "../components/GestionCuenta";
import { supabase } from "../services/supabaseClient";

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, "Home">;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"buscar" | "ofrecer" | "gestion">(
    "buscar"
  );
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    loadUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Recargar contador y usuario cada vez que se enfoca la pantalla
      loadNotificationCount();
      loadUser();
    }, [])
  );

  const loadNotificationCount = async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        console.log("loadNotificationCount: No hay userId");
        return;
      }

      // Obtener el tipo de usuario actual
      const { user: currentUser } = await getCurrentUser();
      if (!currentUser) {
        console.log("loadNotificationCount: No hay currentUser");
        return;
      }

      // Tipos de notificaciones según el tipo de usuario
      const tiposNotificacion =
        currentUser.tipo_usuario === "cliente"
          ? ["nueva_cotizacion", "sistema"]
          : ["nueva_solicitud", "trabajo_aceptado", "sistema", "calificacion"];

      console.log(
        `loadNotificationCount: Buscando notificaciones para usuario ${userId} (tipo: ${currentUser.tipo_usuario})`
      );
      console.log("Tipos de notificación a buscar:", tiposNotificacion);

      const { data, error, count } = await supabase
        .from("notificaciones")
        .select("id, tipo, leida", { count: "exact" })
        .eq("usuario_id", userId)
        .in("tipo", tiposNotificacion)
        .eq("leida", false);

      if (error) {
        console.error("Error al cargar notificaciones:", error);
        console.error("Detalles:", JSON.stringify(error, null, 2));
        return;
      }

      // Usar count si está disponible, sino usar la longitud del array
      const notificationCountValue =
        count !== null && count !== undefined ? count : data?.length || 0;

      console.log(
        `Notificaciones no leídas encontradas: ${notificationCountValue}`
      );
      if (data && data.length > 0) {
        console.log("Notificaciones:", JSON.stringify(data, null, 2));
      } else {
        console.log("No hay notificaciones no leídas");
      }

      // Asegurar que el contador sea 0 si no hay notificaciones
      setNotificationCount(Math.max(0, notificationCountValue));
    } catch (error) {
      console.error("Error al cargar notificaciones:", error);
    }
  };

  const loadUser = async () => {
    try {
      const { user: currentUser, error } = await getCurrentUser();
      if (error || !currentUser) {
        // Si no hay usuario, volver al login
        navigation.replace("Login");
        return;
      }
      setUser(currentUser);

      // Establecer la pestaña inicial según el tipo de usuario
      if (currentUser.tipo_usuario === "cliente") {
        setActiveTab("buscar");
      } else if (currentUser.tipo_usuario === "prestador") {
        setActiveTab("ofrecer");
      } else {
        // ambos - empezar en "buscar servicios"
        setActiveTab("buscar");
      }

      // Cargar contador de notificaciones después de cargar el usuario
      loadNotificationCount();
    } catch (error) {
      console.error("Error al cargar usuario:", error);
      navigation.replace("Login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigation.replace("Login");
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  if (!user) {
    return null;
  }

  const isCliente = user.tipo_usuario === "cliente";
  const isPrestador = user.tipo_usuario === "prestador";
  const isAmbos = user.tipo_usuario === "ambos";

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Image
            source={require("../../assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.headerRight}>
            {/* Foto de perfil con icono de edición */}
            <TouchableOpacity
              onPress={() => {
                // Si es cliente, mostrar solo gestión básica, si es prestador o ambos, mostrar gestión completa
                if (isCliente) {
                  // Para clientes, podríamos crear una pantalla de perfil básico o usar gestión
                  setActiveTab("gestion");
                } else {
                  setActiveTab("gestion");
                }
              }}
              style={styles.profilePictureContainer}
            >
              {user.foto_perfil_url ? (
                <Image
                  source={{ uri: user.foto_perfil_url }}
                  style={styles.profilePicture}
                />
              ) : (
                <View style={styles.profilePicturePlaceholder}>
                  <Text style={styles.profilePictureText}>
                    {user.nombre[0]}
                    {user.apellido[0]}
                  </Text>
                </View>
              )}
              <View style={styles.editIconContainer}>
                <Text style={styles.editIcon}>✏️</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => navigation.navigate("MisTrabajos")}
            >
              <Text style={styles.notificationIcon}>💼</Text>
            </TouchableOpacity>
            {(isPrestador || isAmbos) && (
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => navigation.navigate("MisCotizaciones")}
              >
                <Text style={styles.notificationIcon}>💰</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => {
                navigation.navigate("Notificaciones");
              }}
            >
              <Text style={styles.notificationIcon}>🔔</Text>
              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleLogout}
              style={styles.logoutButton}
            >
              <Text style={styles.logoutText} numberOfLines={1}>
                Salir
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.welcomeText}>
          Bienvenido, {user.nombre} {user.apellido}
        </Text>
      </View>

      {/* Tabs para todos los usuarios */}
      <View style={styles.tabsContainer}>
        {isCliente && (
          <>
            <TouchableOpacity
              style={[styles.tab, activeTab === "buscar" && styles.tabActive]}
              onPress={() => setActiveTab("buscar")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "buscar" && styles.tabTextActive,
                ]}
              >
                Busco Servicios
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "gestion" && styles.tabActive]}
              onPress={() => setActiveTab("gestion")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "gestion" && styles.tabTextActive,
                ]}
              >
                Mi Perfil
              </Text>
            </TouchableOpacity>
          </>
        )}
        {(isPrestador || isAmbos) && (
          <>
            {isAmbos && (
              <TouchableOpacity
                style={[styles.tab, activeTab === "buscar" && styles.tabActive]}
                onPress={() => setActiveTab("buscar")}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "buscar" && styles.tabTextActive,
                  ]}
                >
                  Busco Servicios
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.tab, activeTab === "ofrecer" && styles.tabActive]}
              onPress={() => setActiveTab("ofrecer")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "ofrecer" && styles.tabTextActive,
                ]}
              >
                Ofrezco Servicios
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "gestion" && styles.tabActive]}
              onPress={() => setActiveTab("gestion")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "gestion" && styles.tabTextActive,
                ]}
              >
                Gestión de Cuenta
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Contenido según tipo de usuario */}
      <View style={styles.content}>
        {isCliente && (
          <>
            {activeTab === "buscar" && <BuscarServicios />}
            {activeTab === "gestion" && <GestionCuenta />}
          </>
        )}

        {isPrestador && (
          <>
            {activeTab === "ofrecer" && <OfrezcoServicios />}
            {activeTab === "gestion" && <GestionCuenta />}
          </>
        )}

        {isAmbos && (
          <>
            {activeTab === "buscar" && <BuscarServicios />}
            {activeTab === "ofrecer" && <OfrezcoServicios />}
            {activeTab === "gestion" && <GestionCuenta />}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 50,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
    maxWidth: "60%",
  },
  notificationButton: {
    position: "relative",
    padding: 6,
    flexShrink: 0,
  },
  notificationIcon: {
    fontSize: 20,
  },
  notificationBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "bold",
  },
  logo: {
    width: 120,
    height: 60,
    flexShrink: 0,
  },
  logoutButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: colors.white,
    borderRadius: 8,
    flexShrink: 0,
  },
  logoutText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  welcomeText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "600",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
    minWidth: 100,
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  profilePictureContainer: {
    position: "relative",
    flexShrink: 0,
  },
  profilePicture: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.white,
  },
  profilePicturePlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white + "80",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  profilePictureText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "bold",
  },
  editIconContainer: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: colors.primary,
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  editIcon: {
    fontSize: 9,
  },
});
