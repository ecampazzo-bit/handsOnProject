import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { RootStackParamList } from "../types/navigation";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { ServiceSelectionScreen } from "../screens/ServiceSelectionScreen";
import { HomeScreen } from "../screens/HomeScreen";

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
      </Stack.Navigator>
    </NavigationContainer>
  );
};
