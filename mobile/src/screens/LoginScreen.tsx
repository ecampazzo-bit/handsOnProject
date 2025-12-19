import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { signIn, resendVerificationEmail } from "../services/authService";
import { loginSchema } from "../utils/validation";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { colors } from "../constants/colors";
import { RootStackParamList } from "../types/navigation";

type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Login"
>;

interface LoginFormData {
  email: string;
  password: string;
}

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [loading, setLoading] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleResendVerificationEmail = async () => {
    const email = getValues("email")?.trim();

    if (!email) {
      Alert.alert(
        "Email requerido",
        "Por favor, ingresa tu email para reenviar el email de verificación."
      );
      return;
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Email inválido", "Por favor, ingresa un email válido.");
      return;
    }

    setResendingEmail(true);
    try {
      const { error } = await resendVerificationEmail(email);

      if (error) {
        Alert.alert(
          "Error",
          error.message ||
            "No se pudo enviar el email de verificación. Por favor, intenta nuevamente."
        );
        return;
      }

      Alert.alert(
        "Email enviado",
        `Se ha enviado un email de verificación a ${email}. Por favor, revisa tu bandeja de entrada (y la carpeta de spam).`,
        [
          {
            text: "OK",
            onPress: () => {
              setShowResendButton(false);
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        "Error",
        "Ocurrió un error inesperado. Por favor, intenta nuevamente."
      );
    } finally {
      setResendingEmail(false);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setShowResendButton(false); // Resetear el estado del botón
    try {
      const { user, error } = await signIn(data.email, data.password);

      if (error) {
        // Detectar si el error es porque el email no está verificado
        const isEmailNotVerified = (error as any).isEmailNotVerified || false;
        const errorMessageLower = error.message?.toLowerCase() || "";
        const isEmailNotConfirmed =
          isEmailNotVerified ||
          errorMessageLower.includes("email no ha sido verificado") ||
          errorMessageLower.includes("email not confirmed") ||
          errorMessageLower.includes("email not verified") ||
          errorMessageLower.includes("verificar tu email") ||
          errorMessageLower.includes("confirma tu email");

        if (isEmailNotConfirmed) {
          // Mostrar alert con opción para reenviar el email
          Alert.alert(
            "Email no verificado",
            error.message ||
              "Tu email no ha sido verificado. ¿Deseas que te enviemos un nuevo email de verificación?",
            [
              {
                text: "Cancelar",
                style: "cancel",
                onPress: () => {
                  setShowResendButton(false);
                },
              },
              {
                text: "Reenviar email",
                onPress: () => {
                  setShowResendButton(true);
                  handleResendVerificationEmail();
                },
              },
            ]
          );
        } else {
          // Mensaje específico para otros errores
          let errorMessage =
            error.message ||
            "Credenciales inválidas. Por favor, intenta nuevamente.";

          if (
            error.status === 502 ||
            error.message?.includes("502") ||
            error.message?.includes("no está disponible")
          ) {
            errorMessage =
              "El servidor no está disponible temporalmente. Por favor, espera unos segundos e intenta nuevamente.";
          } else if (
            error.message?.includes("Network") ||
            error.message?.includes("network")
          ) {
            errorMessage =
              "Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.";
          }

          Alert.alert("Error de inicio de sesión", errorMessage);
        }
        return;
      }

      if (user) {
        setShowResendButton(false); // Ocultar el botón si el login fue exitoso
        // Navegar directamente a HomeScreen sin mostrar alert
        navigation.replace("Home");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Ocurrió un error inesperado. Por favor, intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Image
            source={require("../../assets/logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.subtitle}>
            Encuentra el profesional que necesitas
          </Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <Input
                value={value}
                onChangeText={onChange}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email?.message}
                icon={<Text style={styles.icon}>📧</Text>}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <Input
                value={value}
                onChangeText={onChange}
                placeholder="Contraseña"
                secureTextEntry
                error={errors.password?.message}
                icon={<Text style={styles.icon}>🔒</Text>}
              />
            )}
          />

          <View style={styles.helpLinks}>
            <TouchableOpacity
              style={styles.helpLink}
              onPress={() =>
                Alert.alert("Info", "Funcionalidad próximamente disponible")
              }
            >
              <Text style={styles.helpLinkText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          </View>

          {showResendButton && (
            <View style={styles.resendEmailContainer}>
              <Text style={styles.resendEmailText}>
                Tu email no ha sido verificado
              </Text>
              <TouchableOpacity
                style={styles.resendEmailButton}
                onPress={handleResendVerificationEmail}
                disabled={resendingEmail}
              >
                <Text
                  style={[
                    styles.resendEmailButtonText,
                    resendingEmail && styles.resendEmailButtonTextDisabled,
                  ]}
                >
                  {resendingEmail
                    ? "Enviando..."
                    : "Reenviar email de verificación"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <Button
            title="Iniciar Sesión"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            style={styles.loginButton}
          />

          <View style={styles.registerLink}>
            <Text style={styles.registerLinkText}>¿No tienes cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.registerLinkButton}>Regístrate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoImage: {
    width: 200,
    height: 120,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  icon: {
    fontSize: 20,
  },
  helpLinks: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 16,
    flexWrap: "wrap",
  },
  helpLink: {
    marginBottom: 8,
  },
  helpLinkText: {
    color: colors.primary,
    fontSize: 14,
  },
  helpLinkTextDisabled: {
    color: colors.textLight,
  },
  resendEmailContainer: {
    backgroundColor: colors.errorLight,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    alignItems: "center",
  },
  resendEmailText: {
    color: colors.error,
    fontSize: 14,
    marginBottom: 12,
    textAlign: "center",
    fontWeight: "500",
  },
  resendEmailButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendEmailButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  resendEmailButtonTextDisabled: {
    color: colors.textLight,
  },
  loginButton: {
    marginBottom: 24,
  },
  registerLink: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  registerLinkText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  registerLinkButton: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
});
