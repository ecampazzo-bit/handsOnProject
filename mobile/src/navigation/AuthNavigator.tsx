import React from "react";
import { NavigationContainer } from "@react-navigation/native";
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

const Stack = createStackNavigator<RootStackParamList>();

export const AuthNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
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
      </Stack.Navigator>
    </NavigationContainer>
  );
};
