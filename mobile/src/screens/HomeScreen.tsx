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
import { PromocionesScreen } from "./PromocionesScreen";
import { supabase } from "../services/supabaseClient";

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, "Home">;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "promociones" | "buscar" | "ofrecer" | "gestion"
  >("promociones");
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
      let tiposNotificacion: string[];
      if (currentUser.tipo_usuario === "cliente") {
        tiposNotificacion = ["nueva_cotizacion", "sistema"];
      } else if (currentUser.tipo_usuario === "prestador") {
        tiposNotificacion = [
          "nueva_solicitud",
          "trabajo_aceptado",
          "sistema",
          "calificacion",
        ];
      } else {
        // Usuario tipo "ambos" - debe recibir ambos tipos de notificaciones
        tiposNotificacion = [
          "nueva_cotizacion",
          "nueva_solicitud",
          "trabajo_aceptado",
          "sistema",
          "calificacion",
        ];
      }

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

      // Establecer la pestaña inicial - siempre empezar en promociones
      setActiveTab("promociones");

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
            source={require("../../assets/logoblanco.png")}
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
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => {
                // Si es cliente o ambos, navegar a MisPresupuestos
                // Si es solo prestador, navegar a MisCotizaciones
                if (isCliente || isAmbos) {
                  navigation.navigate("MisPresupuestos");
                } else if (isPrestador) {
                  navigation.navigate("MisCotizaciones");
                }
              }}
            >
              <Text style={styles.notificationIcon}>💰</Text>
            </TouchableOpacity>
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
              <Text style={styles.logoutIcon}>⬅️</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.welcomeText}>
          Bienvenido, {user.nombre} {user.apellido}
        </Text>
      </View>

      {/* Botones de navegación para todos los usuarios */}
      <View style={styles.navigationContainer}>
        {/* Botones principales en una fila */}
        <View style={styles.buttonsContainer}>
          {isCliente && (
            <>
              <TouchableOpacity
                style={[
                  styles.navButton,
                  activeTab === "buscar" && styles.navButtonActive,
                ]}
                onPress={() => setActiveTab("buscar")}
              >
                <Text
                  style={[
                    styles.navButtonText,
                    activeTab === "buscar" && styles.navButtonTextActive,
                  ]}
                >
                  Busco Servicios
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.navButton,
                  activeTab === "gestion" && styles.navButtonActive,
                ]}
                onPress={() => setActiveTab("gestion")}
              >
                <Text
                  style={[
                    styles.navButtonText,
                    activeTab === "gestion" && styles.navButtonTextActive,
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
                  style={[
                    styles.navButton,
                    activeTab === "buscar" && styles.navButtonActive,
                  ]}
                  onPress={() => setActiveTab("buscar")}
                >
                  <Text
                    style={[
                      styles.navButtonText,
                      activeTab === "buscar" && styles.navButtonTextActive,
                    ]}
                  >
                    Busco Servicios
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.navButton,
                  activeTab === "ofrecer" && styles.navButtonActive,
                ]}
                onPress={() => setActiveTab("ofrecer")}
              >
                <Text
                  style={[
                    styles.navButtonText,
                    activeTab === "ofrecer" && styles.navButtonTextActive,
                  ]}
                >
                  Ofrezco Servicios
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.navButton,
                  activeTab === "gestion" && styles.navButtonActive,
                ]}
                onPress={() => setActiveTab("gestion")}
              >
                <Text
                  style={[
                    styles.navButtonText,
                    activeTab === "gestion" && styles.navButtonTextActive,
                  ]}
                >
                  Gestión de Cuenta
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Botón de Promociones Especiales - Debajo de los otros botones */}
        <TouchableOpacity
          style={[
            styles.promocionesButton,
            activeTab === "promociones" && styles.promocionesButtonActive,
          ]}
          onPress={() => setActiveTab("promociones")}
        >
          <Text
            style={[
              styles.promocionesButtonText,
              activeTab === "promociones" && styles.promocionesButtonTextActive,
            ]}
          >
            🎁 Promociones Especiales
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenido según tipo de usuario */}
      <View style={styles.content}>
        {/* Promociones Especiales - Visible para todos */}
        {activeTab === "promociones" && <PromocionesScreen />}

        {isCliente && (
          <>
            {activeTab === "buscar" && <BuscarServicios />}
            {activeTab === "gestion" && (
              <GestionCuenta
                onConvertirseEnPrestador={() => {
                  // Cambiar al tab "ofrecer" después de convertirse en prestador
                  setActiveTab("ofrecer");
                }}
              />
            )}
          </>
        )}

        {isPrestador && (
          <>
            {activeTab === "ofrecer" && <OfrezcoServicios />}
            {activeTab === "gestion" && (
              <GestionCuenta
                onConvertirseEnPrestador={() => {
                  // Cambiar al tab "buscar" después de convertirse también en cliente
                  setActiveTab("buscar");
                }}
              />
            )}
          </>
        )}

        {isAmbos && (
          <>
            {activeTab === "buscar" && <BuscarServicios />}
            {activeTab === "ofrecer" && <OfrezcoServicios />}
            {activeTab === "gestion" && (
              <GestionCuenta
                onConvertirseEnPrestador={() => {
                  // Cambiar al tab "ofrecer" después de convertirse en prestador
                  setActiveTab("ofrecer");
                }}
              />
            )}
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
    backgroundColor: colors.primaryLight,
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
    padding: 6,
    flexShrink: 0,
  },
  logoutIcon: {
    fontSize: 20,
  },
  welcomeText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "600",
  },
  navigationContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  buttonsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  navButton: {
    flex: 1,
    paddingVertical: 9, // Reducido 25% desde 12
    paddingHorizontal: 16,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 33, // Reducido 25% desde 44 (44 * 0.75 = 33)
  },
  navButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  navButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "600",
    textAlign: "center",
  },
  navButtonTextActive: {
    color: colors.white,
    fontWeight: "700",
  },
  promocionesButton: {
    alignSelf: "stretch",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 0, // Sin bordes redondeados para ocupar todo el ancho
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
    borderTopWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 0,
    marginBottom: 0,
    minHeight: 30, // Menor alto que los otros botones (30px vs 33px de los otros)
  },
  promocionesButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  promocionesButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "600",
    textAlign: "center",
  },
  promocionesButtonTextActive: {
    color: colors.white,
    fontWeight: "700",
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
