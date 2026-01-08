import React, { useState, useEffect, useRef } from "react";
import { NavigationContainer, NavigationContainerRef } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { RootStackParamList } from "../types/navigation";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { ServiceSelectionScreen } from "../screens/ServiceSelectionScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { SolicitarPresupuestoScreen } from "../screens/SolicitarPresupuestoScreen";
import { SolicitudesPendientesScreen } from "../screens/SolicitudesPendientesScreen";
import { ResponderSolicitudScreen } from "../screens/ResponderSolicitudScreen";
import { MisPresupuestosScreen } from "../screens/MisPresupuestosScreen";
import { MisTrabajosScreen } from "../screens/MisTrabajosScreen";
import { MisCotizacionesScreen } from "../screens/MisCotizacionesScreen";
import { NotificacionesScreen } from "../screens/NotificacionesScreen";
import { PhoneVerificationScreen } from "../screens/PhoneVerificationScreen";
import { PromocionesScreen } from "../screens/PromocionesScreen";
import { supabase } from "../services/supabaseClient";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { colors } from "../constants/colors";

const Stack = createStackNavigator<RootStackParamList>();

export const AuthNavigator: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  useEffect(() => {
    let mounted = true;

    // Verificar sesión al iniciar
    const checkSession = async () => {
      try {
        console.log("=== Verificando sesión en AuthNavigator ===");
        
        // Dar tiempo a Supabase para restaurar la sesión desde AsyncStorage
        // Esto es importante porque Supabase necesita tiempo para leer AsyncStorage
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Obtener sesión actual
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error("Error al obtener sesión:", error);
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          console.log("Sesión activa encontrada:", session.user.id);
          setIsAuthenticated(true);
        } else {
          console.log("No hay sesión activa");
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error al verificar sesión:", error);
        if (mounted) {
          setIsAuthenticated(false);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    checkSession();

    // Escuchar cambios en el estado de autenticación
    // Esto también se dispara cuando Supabase restaura la sesión desde AsyncStorage
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("AuthNavigator - Cambio de estado:", event, session?.user?.id);
      
      if (!mounted) return;

      if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session?.user) {
          console.log("Sesión restaurada/iniciada, navegando a Home");
          setIsAuthenticated(true);
          setIsLoading(false);
          // Navegar a Home cuando hay sesión
          if (navigationRef.current?.isReady()) {
            navigationRef.current.reset({
              index: 0,
              routes: [{ name: "Home" }],
            });
          }
        }
      } else if (event === "SIGNED_OUT") {
        console.log("Usuario cerró sesión, navegando a Login");
        setIsAuthenticated(false);
        setIsLoading(false);
        // Navegar a Login cuando el usuario cierra sesión
        if (navigationRef.current?.isReady()) {
          navigationRef.current.reset({
            index: 0,
            routes: [{ name: "Login" }],
          });
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Mostrar loading mientras se verifica la sesión
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName={isAuthenticated ? "Home" : "Login"}
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: "#FFFFFF" },
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen
          name="ServiceSelection"
          component={ServiceSelectionScreen}
        />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="SolicitarPresupuesto"
          component={SolicitarPresupuestoScreen}
        />
        <Stack.Screen
          name="SolicitudesPendientes"
          component={SolicitudesPendientesScreen}
        />
        <Stack.Screen
          name="ResponderSolicitud"
          component={ResponderSolicitudScreen}
        />
        <Stack.Screen
          name="MisPresupuestos"
          component={MisPresupuestosScreen}
        />
        <Stack.Screen name="MisTrabajos" component={MisTrabajosScreen} />
        <Stack.Screen
          name="MisCotizaciones"
          component={MisCotizacionesScreen}
        />
        <Stack.Screen name="Notificaciones" component={NotificacionesScreen} />
        <Stack.Screen
          name="PhoneVerification"
          component={PhoneVerificationScreen}
        />
        <Stack.Screen name="Promociones" component={PromocionesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
});
