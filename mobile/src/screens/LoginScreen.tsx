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
  Modal,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signIn, resendVerificationEmail } from "../services/authService";
import { loginSchema } from "../utils/validation";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { colors } from "../constants/colors";
import { RootStackParamList } from "../types/navigation";
import { supabase } from "../services/supabaseClient";

type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Login"
>;

interface LoginFormData {
  email: string;
  password: string;
}

const WELCOME_MESSAGE_KEY = "@ofisi_welcome_shown";

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [loading, setLoading] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [sendingResetEmail, setSendingResetEmail] = useState(false);

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

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail.trim()) {
      Alert.alert(
        "Email requerido",
        "Por favor, ingresa tu email para recibir las instrucciones de reset."
      );
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotPasswordEmail.trim())) {
      Alert.alert("Email inválido", "Por favor, ingresa un email válido.");
      return;
    }

    setSendingResetEmail(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        forgotPasswordEmail.trim(),
        {
          redirectTo: "https://localhost:3000/auth/reset-password",
        }
      );

      if (error) {
        Alert.alert(
          "Error",
          error.message ||
            "No se pudo enviar el email de reset. Por favor, intenta nuevamente."
        );
        return;
      }

      Alert.alert(
        "Email enviado",
        `Se ha enviado un email a ${forgotPasswordEmail.trim()} con las instrucciones para restablecer tu contraseña. Por favor, revisa tu bandeja de entrada (y la carpeta de spam).`,
        [
          {
            text: "OK",
            onPress: () => {
              setShowForgotPasswordModal(false);
              setForgotPasswordEmail("");
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message ||
          "Ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente."
      );
    } finally {
      setSendingResetEmail(false);
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

        // Verificar si el email está verificado y mostrar mensaje de bienvenida
        const checkEmailVerification = async () => {
          try {
            const {
              data: { user: authUser },
            } = await supabase.auth.getUser();

            if (authUser?.email_confirmed_at) {
              // Verificar si ya mostramos el mensaje de bienvenida para este usuario
              const welcomeShown = await AsyncStorage.getItem(
                `${WELCOME_MESSAGE_KEY}_${authUser.id}`
              );

              // Obtener nombre del usuario para el mensaje de bienvenida
              const { data: userData } = await supabase
                .from("users")
                .select("nombre")
                .eq("id", authUser.id)
                .single();

              const name = userData?.nombre || "";
              setUserName(name);

              // Verificar si el email fue confirmado recientemente (últimas 24 horas)
              const confirmedAt = new Date(authUser.email_confirmed_at);
              const now = new Date();
              const hoursSinceConfirmation =
                (now.getTime() - confirmedAt.getTime()) / (1000 * 60 * 60);

              // Mostrar mensaje si fue confirmado recientemente y no lo hemos mostrado antes
              if (hoursSinceConfirmation < 24 && !welcomeShown) {
                setShowWelcomeModal(true);
                // Marcar como mostrado para no volver a mostrarlo
                await AsyncStorage.setItem(
                  `${WELCOME_MESSAGE_KEY}_${authUser.id}`,
                  "true"
                );
              } else {
                // Si ya lo mostramos o no es reciente, navegar directamente
                navigation.replace("Home");
              }
            } else {
              // Email no verificado, navegar normalmente
              navigation.replace("Home");
            }
          } catch (error) {
            console.error("Error al verificar email:", error);
            // En caso de error, navegar normalmente
            navigation.replace("Home");
          }
        };

        await checkEmailVerification();
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
            source={require("../../assets/logocolor.png")}
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
              onPress={() => setShowForgotPasswordModal(true)}
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

      {/* Modal de Bienvenida */}
      <Modal
        visible={showWelcomeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowWelcomeModal(false);
          navigation.replace("Home");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.welcomeIconContainer}>
              <Text style={styles.welcomeIcon}>🎉</Text>
            </View>
            <Text style={styles.welcomeTitle}>
              ¡Bienvenido{userName ? ` ${userName}` : ""}!
            </Text>
            <Text style={styles.welcomeMessage}>
              Tu email ha sido verificado exitosamente.{"\n\n"}
              Estamos felices de tenerte en ofiSí. Ahora puedes disfrutar de
              todas las funcionalidades de la app.
            </Text>
            <Button
              title="¡Empezar!"
              onPress={() => {
                setShowWelcomeModal(false);
                navigation.replace("Home");
              }}
              style={styles.welcomeButton}
            />
          </View>
        </View>
      </Modal>

      {/* Modal de Olvidaste tu Contraseña */}
      <Modal
        visible={showForgotPasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowForgotPasswordModal(false);
          setForgotPasswordEmail("");
        }}
      >
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, styles.forgotPasswordModal]}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowForgotPasswordModal(false);
                  setForgotPasswordEmail("");
                }}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>

              <Text style={styles.modalTitle}>Restablecer Contraseña</Text>
              <Text style={styles.modalSubtitle}>
                Ingresa tu email y te enviaremos un enlace para restablecer tu
                contraseña.
              </Text>

              <View style={styles.forgotPasswordForm}>
                <Input
                  placeholder="Correo electrónico"
                  value={forgotPasswordEmail}
                  onChangeText={setForgotPasswordEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  icon={<Text style={styles.icon}>📧</Text>}
                />
              </View>

              <View style={styles.forgotPasswordButtons}>
                <Button
                  title="Cancelar"
                  onPress={() => {
                    setShowForgotPasswordModal(false);
                    setForgotPasswordEmail("");
                  }}
                  disabled={sendingResetEmail}
                  style={styles.cancelButton}
                />
                <Button
                  title={sendingResetEmail ? "Enviando..." : "Enviar"}
                  onPress={handleForgotPassword}
                  disabled={sendingResetEmail}
                  style={styles.sendButton}
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    width: 400,
    height: 240,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  icon: {
    fontSize: 18,
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
    fontSize: 12,
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
    fontSize: 12,
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
    fontSize: 12,
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
    fontSize: 12,
  },
  registerLinkButton: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  welcomeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight + "20",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  welcomeIcon: {
    fontSize: 42,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  welcomeMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  welcomeButton: {
    width: "100%",
  },
  forgotPasswordModal: {
    maxHeight: "80%",
    justifyContent: "flex-start",
    marginTop: 60,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 12,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: "center",
  },
  forgotPasswordForm: {
    width: "100%",
    marginBottom: 24,
  },
  forgotPasswordButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  sendButton: {
    flex: 1,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.errorLight,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  closeButtonText: {
    color: colors.error,
    fontSize: 18,
    fontWeight: "bold",
  },
});
