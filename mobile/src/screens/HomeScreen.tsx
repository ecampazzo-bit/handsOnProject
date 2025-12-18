import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { getCurrentUser, signOut } from "../services/authService";
import { User, RootStackParamList } from "../types/navigation";
import { colors } from "../constants/colors";
import { BuscarServicios } from "../components/BuscarServicios";
import { OfrezcoServicios } from "../components/OfrezcoServicios";
import { GestionCuenta } from "../components/GestionCuenta";

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, "Home">;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"buscar" | "ofrecer" | "gestion">(
    "buscar"
  );

  useEffect(() => {
    loadUser();
  }, []);

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
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.welcomeText}>
          Bienvenido, {user.nombre} {user.apellido}
        </Text>
      </View>

      {/* Tabs para usuarios "prestador" y "ambos" */}
      {(isPrestador || isAmbos) && (
        <View style={styles.tabsContainer}>
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
        </View>
      )}

      {/* Contenido según tipo de usuario */}
      <View style={styles.content}>
        {isCliente && <BuscarServicios />}

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
  logo: {
    width: 120,
    height: 60,
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
    borderRadius: 8,
  },
  logoutText: {
    color: colors.primary,
    fontSize: 14,
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
});
