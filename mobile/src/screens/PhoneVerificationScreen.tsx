import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/navigation";
import { colors } from "../constants/colors";
import {
  sendVerificationCode,
  verifyCode,
} from "../services/phoneVerificationService";
import { getCurrentUser } from "../services/authService";
import { supabase } from "../services/supabaseClient";
import { formatArgentinePhone, phoneSchema } from "../utils/validation";

type PhoneVerificationScreenRouteProp = RouteProp<
  RootStackParamList,
  "PhoneVerification"
>;

type PhoneVerificationScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "PhoneVerification"
>;

export const PhoneVerificationScreen: React.FC = () => {
  const navigation = useNavigation<PhoneVerificationScreenNavigationProp>();
  const route = useRoute<PhoneVerificationScreenRouteProp>();
  const { telefono: initialTelefono } = route.params;

  const [telefono, setTelefono] = useState(initialTelefono);
  const [editingPhone, setEditingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState(initialTelefono);
  const [codigo, setCodigo] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [updatingPhone, setUpdatingPhone] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    handleSendCode();
  }, [telefono]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    setSendingCode(true);
    try {
      const result = await sendVerificationCode(telefono);
      if (result.success) {
        Alert.alert(
          "Código enviado",
          `Hemos enviado un código de verificación a tu WhatsApp: ${telefono}`
        );
        setCountdown(60);
      } else {
        Alert.alert("Error", result.error || "No se pudo enviar el código");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Error al enviar código");
    } finally {
      setSendingCode(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newCodigo = [...codigo];
    newCodigo[index] = value;
    setCodigo(newCodigo);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCodigo.every((digit) => digit !== "") && newCodigo.join("").length === 6) {
      handleVerifyCode(newCodigo.join(""));
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !codigo[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleUpdatePhone = async () => {
    // Validar el nuevo teléfono
    try {
      await phoneSchema.validate(newPhone);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Formato de teléfono inválido");
      return;
    }

    const formattedPhone = formatArgentinePhone(newPhone);
    
    if (formattedPhone === telefono) {
      Alert.alert("Info", "El teléfono es el mismo");
      setEditingPhone(false);
      return;
    }

    setUpdatingPhone(true);
    try {
      const { user } = await getCurrentUser();
      if (!user) {
        Alert.alert("Error", "No se pudo identificar al usuario");
        return;
      }

      // Actualizar teléfono en la base de datos
      const { error: updateError } = await supabase
        .from("users")
        .update({ telefono: formattedPhone, telefono_verificado: false })
        .eq("id", user.id);

      if (updateError) {
        Alert.alert("Error", updateError.message || "No se pudo actualizar el teléfono");
        return;
      }

      // Actualizar el estado local
      setTelefono(formattedPhone);
      setEditingPhone(false);
      
      // Limpiar código anterior
      setCodigo(["", "", "", "", "", ""]);
      
      // Enviar nuevo código
      const result = await sendVerificationCode(formattedPhone);
      if (result.success) {
        Alert.alert(
          "Teléfono actualizado",
          `Hemos enviado un código de verificación a tu nuevo WhatsApp: ${formattedPhone}`
        );
        setCountdown(60);
      } else {
        Alert.alert("Advertencia", "Teléfono actualizado pero no se pudo enviar el código");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Error al actualizar teléfono");
    } finally {
      setUpdatingPhone(false);
    }
  };

  const handleVerifyCode = async (codeToVerify?: string) => {
    const code = codeToVerify || codigo.join("");
    
    if (code.length !== 6) {
      Alert.alert("Error", "Por favor ingresa el código completo de 6 dígitos");
      return;
    }

    setLoading(true);
    try {
      const verifyResult = await verifyCode(telefono, code);
      
      if (verifyResult.success) {
        const { user } = await getCurrentUser();
        if (user) {
          // Marcar teléfono como verificado
          const { error: updateError } = await supabase
            .from("users")
            .update({ telefono_verificado: true })
            .eq("id", user.id);

          if (updateError) {
            console.error("Error al actualizar:", updateError);
          }

          Alert.alert(
            "¡Teléfono verificado!",
            "Tu número de teléfono ha sido verificado exitosamente.",
            [
              {
                text: "Continuar",
                onPress: () => {
                  navigation.goBack();
                },
              },
            ]
          );
        }
      } else {
        Alert.alert("Código inválido", verifyResult.error || "El código ingresado no es correcto");
        setCodigo(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Error al verificar código");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        {/* Botón Volver */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Verificar Teléfono</Text>
          <Text style={styles.subtitle}>
            Ingresa el código de 6 dígitos que enviamos a tu WhatsApp
          </Text>
          
          {editingPhone ? (
            <View style={styles.editPhoneContainer}>
              <TextInput
                style={styles.phoneInput}
                value={newPhone}
                onChangeText={setNewPhone}
                placeholder="Ingresa tu teléfono"
                keyboardType="phone-pad"
                autoFocus
                placeholderTextColor={colors.textLight}
              />
              <View style={styles.editPhoneButtons}>
                <TouchableOpacity
                  style={[styles.editPhoneButton, styles.cancelButton]}
                  onPress={() => {
                    setNewPhone(telefono);
                    setEditingPhone(false);
                  }}
                  disabled={updatingPhone}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editPhoneButton, styles.saveButton]}
                  onPress={handleUpdatePhone}
                  disabled={updatingPhone}
                >
                  {updatingPhone ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.saveButtonText}>Guardar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.phoneDisplayContainer}>
              <Text style={styles.phoneNumber}>📱 {telefono}</Text>
              <TouchableOpacity
                style={styles.editPhoneLink}
                onPress={() => setEditingPhone(true)}
              >
                <Text style={styles.editPhoneLinkText}>Editar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.codeContainer}>
          {codigo.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.codeInput,
                digit !== "" && styles.codeInputFilled,
              ]}
              value={digit}
              onChangeText={(value) => handleCodeChange(index, value)}
              onKeyPress={({ nativeEvent }) =>
                handleKeyPress(index, nativeEvent.key)
              }
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              editable={!loading}
            />
          ))}
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Verificando código...</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.verifyButton,
            (loading || codigo.some((d) => d === "")) && styles.verifyButtonDisabled,
          ]}
          onPress={() => handleVerifyCode()}
          disabled={loading || codigo.some((d) => d === "")}
        >
          <Text style={styles.verifyButtonText}>Verificar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.resendButton,
            (sendingCode || countdown > 0) && styles.resendButtonDisabled,
          ]}
          onPress={handleSendCode}
          disabled={sendingCode || countdown > 0}
        >
          {sendingCode ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.resendButtonText}>
              {countdown > 0
                ? `Reenviar código en ${countdown}s`
                : "Reenviar código"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "600",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: "center",
    marginBottom: 20,
  },
  phoneDisplayContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
  },
  phoneNumber: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.primary,
  },
  editPhoneLink: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  editPhoneLinkText: {
    fontSize: 14,
    color: colors.primary,
    textDecorationLine: "underline",
  },
  editPhoneContainer: {
    width: "100%",
    marginTop: 10,
  },
  phoneInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  editPhoneButtons: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },
  editPhoneButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  codeInput: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    backgroundColor: colors.surface,
  },
  codeInputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  loadingContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 10,
    color: colors.textLight,
    fontSize: 14,
  },
  verifyButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  verifyButtonDisabled: {
    backgroundColor: colors.border,
    opacity: 0.5,
  },
  verifyButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  resendButton: {
    alignItems: "center",
    padding: 12,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "500",
  },
});

