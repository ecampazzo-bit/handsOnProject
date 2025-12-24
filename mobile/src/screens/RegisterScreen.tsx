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
  ActivityIndicator,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Location from "expo-location";
import { signUp, getCurrentUser } from "../services/authService";
import {
  registerStep1Schema,
  registerStep2Schema,
  registerStep3Schema,
  formatArgentinePhone,
  RegisterStep1FormData,
  RegisterStep2FormData,
  RegisterStep3FormData,
} from "../utils/validation";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { colors } from "../constants/colors";
import {
  pickImageFromGallery,
  takePhotoWithCamera,
  uploadProfilePicture,
} from "../services/profileService";
import * as ImageManipulator from "expo-image-manipulator";
import { RootStackParamList, RegisterFormData } from "../types/navigation";

type RegisterScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Register"
>;

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [formData, setFormData] = useState<Partial<RegisterFormData>>({});
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const step1Form = useForm<RegisterStep1FormData>({
    resolver: yupResolver(registerStep1Schema),
    defaultValues: {
      nombre: "",
      apellido: "",
      email: "",
      telefono: "",
      password: "",
      confirmPassword: "",
    },
  });

  const step2Form = useForm<RegisterStep2FormData>({
    resolver: yupResolver(registerStep2Schema),
    defaultValues: {
      tipoUsuario: "cliente" as "cliente" | "prestador" | "ambos",
    },
  });

  const step3Form = useForm<RegisterStep3FormData>({
    resolver: yupResolver(registerStep3Schema),
    defaultValues: {
      direccion: "",
      latitud: null,
      longitud: null,
    },
  });

  const handleEditProfilePicture = () => {
    Alert.alert("Seleccionar Foto", "Elige una opción", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Galería",
        onPress: async () => {
          try {
            const result = await pickImageFromGallery();
            if (!result.canceled && result.assets && result.assets[0]) {
              await processImage(result.assets[0].uri);
            }
          } catch (error: any) {
            Alert.alert(
              "Error",
              error.message || "No se pudo seleccionar la imagen"
            );
          }
        },
      },
      {
        text: "Cámara",
        onPress: async () => {
          try {
            const result = await takePhotoWithCamera();
            if (!result.canceled && result.assets && result.assets[0]) {
              await processImage(result.assets[0].uri);
            }
          } catch (error: any) {
            Alert.alert("Error", error.message || "No se pudo tomar la foto");
          }
        },
      },
    ]);
  };

  const processImage = async (imageUri: string) => {
    setUploadingPhoto(true);
    try {
      // Convertir a JPG
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      setProfileImageUri(manipulatedImage.uri);
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo procesar la imagen");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleStep1Next = async (data: RegisterStep1FormData) => {
    try {
      console.log("Step 1 data recibida:", data);
      // Usar la función de actualización de estado para asegurar que tenemos el estado más reciente
      setFormData((prevFormData) => {
        const newFormData = { ...prevFormData, ...data };
        console.log("Guardando formData:", newFormData);
        return newFormData;
      });
      setStep(2);
    } catch (error) {
      console.error("Error en handleStep1Next:", error);
      Alert.alert("Error", "Ocurrió un error al guardar los datos");
    }
  };

  const handleStep2Next = async (data: RegisterStep2FormData) => {
    try {
      // Obtener los datos del paso 1 directamente del formulario
      const step1Data = step1Form.getValues();

      // Combinar los datos de ambos pasos
      const updatedData = { ...step1Data, ...data };

      console.log("Step 2 data:", data);
      console.log("Step 1 data del formulario:", step1Data);
      console.log("UpdatedData combinado:", updatedData);

      // Actualizar el estado
      setFormData(updatedData);

      if (data.tipoUsuario === "cliente") {
        // Validar que tenemos todos los datos del paso 1 antes de continuar
        if (
          !updatedData.email ||
          !updatedData.password ||
          !updatedData.nombre ||
          !updatedData.apellido ||
          !updatedData.telefono
        ) {
          console.error("Datos faltantes:", {
            email: !!updatedData.email,
            password: !!updatedData.password,
            nombre: !!updatedData.nombre,
            apellido: !!updatedData.apellido,
            telefono: !!updatedData.telefono,
          });
          Alert.alert(
            "Error",
            "Faltan datos del paso anterior. Por favor, vuelve al paso 1."
          );
          setStep(1);
          return;
        }
        // Llamar a handleFinalSubmit con los datos actualizados
        await handleFinalSubmit(updatedData as RegisterFormData);
      } else {
        // Si es prestador o ambos, ir al paso 3 para obtener dirección y ubicación
        setStep(3);
      }
    } catch (error) {
      console.error("Error en handleStep2Next:", error);
      Alert.alert("Error", "Ocurrió un error al procesar los datos");
    }
  };

  const handleGetLocation = async () => {
    setGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permisos de ubicación",
          "Necesitamos permisos de ubicación para usar esta función."
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      step3Form.setValue("latitud", location.coords.latitude);
      step3Form.setValue("longitud", location.coords.longitude);
      Alert.alert("Éxito", "Ubicación obtenida correctamente");
    } catch (error) {
      Alert.alert("Error", "No se pudo obtener la ubicación");
    } finally {
      setGettingLocation(false);
    }
  };

  const handleStep3Next = async (data: RegisterStep3FormData) => {
    try {
      // Obtener los datos de los pasos anteriores directamente de los formularios
      const step1Data = step1Form.getValues();
      const step2Data = step2Form.getValues();

      // Combinar todos los datos
      const updatedData = { ...step1Data, ...step2Data, ...data };

      console.log("Step 3 data:", data);
      console.log("Datos combinados:", updatedData);

      // Actualizar el estado
      setFormData(updatedData);

      await handleFinalSubmit(updatedData as RegisterFormData);
    } catch (error) {
      console.error("Error en handleStep3Next:", error);
      Alert.alert("Error", "Ocurrió un error al procesar los datos");
    }
  };

  const handleFinalSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    try {
      console.log("=== handleFinalSubmit INICIO ===");
      console.log("data recibido:", data);
      console.log("Tipo de data:", typeof data);
      console.log("data es null?", data === null);
      console.log("data es undefined?", data === undefined);
      console.log(
        "Keys de data:",
        data ? Object.keys(data) : "data es null/undefined"
      );

      // Validar que data existe
      if (!data) {
        console.error("ERROR: data es null o undefined");
        Alert.alert(
          "Error",
          "No se recibieron datos. Por favor, intenta nuevamente."
        );
        setLoading(false);
        return;
      }

      // Validar que todos los campos requeridos estén presentes
      if (
        !data.email ||
        !data.password ||
        !data.nombre ||
        !data.apellido ||
        !data.telefono ||
        !data.tipoUsuario
      ) {
        console.error("Datos faltantes en handleFinalSubmit:", {
          email: data.email || "FALTANTE",
          password: data.password ? "***" : "FALTANTE",
          nombre: data.nombre || "FALTANTE",
          apellido: data.apellido || "FALTANTE",
          telefono: data.telefono || "FALTANTE",
          tipoUsuario: data.tipoUsuario || "FALTANTE",
          dataCompleto: JSON.stringify(data, null, 2),
        });
        Alert.alert(
          "Error",
          "Faltan datos requeridos. Por favor, completa todos los campos."
        );
        setLoading(false);
        return;
      }

      // Validar que los datos necesarios estén presentes antes de procesarlos
      if (
        !data.nombre ||
        !data.apellido ||
        !data.telefono ||
        !data.tipoUsuario
      ) {
        console.error("Datos incompletos antes de crear userDataToSend:", {
          nombre: data.nombre,
          apellido: data.apellido,
          telefono: data.telefono,
          tipoUsuario: data.tipoUsuario,
          dataCompleto: data,
        });
        Alert.alert(
          "Error",
          "Faltan datos requeridos. Por favor, completa todos los campos."
        );
        setLoading(false);
        return;
      }

      const formattedPhone = formatArgentinePhone(data.telefono);

      if (!formattedPhone) {
        console.error("Error al formatear el teléfono:", data.telefono);
        Alert.alert("Error", "El formato del teléfono es inválido");
        setLoading(false);
        return;
      }

      const userDataToSend = {
        nombre: (data.nombre || "").trim(),
        apellido: (data.apellido || "").trim(),
        telefono: formattedPhone.trim(),
        direccion: data.direccion ? data.direccion.trim() : undefined,
        latitud: data.latitud || undefined,
        longitud: data.longitud || undefined,
        tipoUsuario: data.tipoUsuario,
      };

      console.log("Datos originales recibidos:", {
        nombre: data.nombre,
        apellido: data.apellido,
        telefono: data.telefono,
        tipoUsuario: data.tipoUsuario,
      });
      console.log("userDataToSend creado:", userDataToSend);
      console.log("Email y password:", {
        email: data.email,
        password: data.password ? "***" : "undefined",
      });

      // Validar que userDataToSend se creó correctamente
      if (
        !userDataToSend ||
        !userDataToSend.nombre ||
        !userDataToSend.apellido ||
        !userDataToSend.telefono ||
        !userDataToSend.tipoUsuario
      ) {
        console.error("userDataToSend inválido:", userDataToSend);
        Alert.alert(
          "Error",
          "Error al preparar los datos. Por favor, intenta nuevamente."
        );
        setLoading(false);
        return;
      }

      console.log("=== ANTES DE LLAMAR A signUp ===");
      console.log("email:", data.email);
      console.log("password:", data.password ? "***" : "undefined");
      console.log("userDataToSend:", JSON.stringify(userDataToSend, null, 2));
      console.log("userDataToSend es null?", userDataToSend === null);
      console.log("userDataToSend es undefined?", userDataToSend === undefined);
      console.log("Tipo de userDataToSend:", typeof userDataToSend);

      // Asegurarse de que todos los parámetros estén definidos antes de llamar
      if (!data.email || !data.password || !userDataToSend) {
        console.error("ERROR: Parámetros inválidos antes de llamar a signUp:", {
          email: !!data.email,
          password: !!data.password,
          userDataToSend: !!userDataToSend,
        });
        Alert.alert("Error", "Error al preparar los datos para el registro");
        setLoading(false);
        return;
      }

      // Llamar a signUp con los parámetros explícitos
      const emailParam = String(data.email);
      const passwordParam = String(data.password);
      const userDataParam = { ...userDataToSend }; // Crear una copia para asegurar que sea un objeto válido

      console.log("Llamando a signUp con:", {
        email: emailParam,
        password: "***",
        userData: userDataParam,
      });

      // Llamar a signUp con un objeto único para evitar problemas con Metro
      const { user, error } = await signUp({
        email: emailParam,
        password: passwordParam,
        userData: userDataParam,
      });

      if (error) {
        console.error(
          "Error completo en registro:",
          JSON.stringify(error, null, 2)
        );

        // Mensaje de error más descriptivo según el tipo de error
        let errorMessage = error.message || "No se pudo crear la cuenta";

        if (
          error.code === "NETWORK_ERROR" ||
          error.message?.includes("network") ||
          error.message?.includes("Network")
        ) {
          errorMessage =
            "Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.";
        } else if (error.status === 502 || error.message?.includes("502")) {
          errorMessage =
            "El servidor no está disponible temporalmente. Por favor, espera unos segundos e intenta nuevamente.";
        } else if (error.message?.includes("Supabase no está disponible")) {
          errorMessage = error.message;
        } else if (error.message?.includes("email")) {
          errorMessage =
            "El email ya está registrado o es inválido. Por favor, verifica tu email.";
        }

        Alert.alert("Error de registro", errorMessage);
        setLoading(false);
        return;
      }

      if (user) {
        console.log("Usuario creado exitosamente:", user.id);

        // Esperar un momento para que la sesión se establezca completamente
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Subir foto de perfil si existe
        if (profileImageUri) {
          console.log("Subiendo foto de perfil...");
          try {
            // Pasar waitForSession=true para esperar a que la sesión esté lista
            const photoResult = await uploadProfilePicture(
              user.id,
              profileImageUri,
              true // Esperar a que la sesión esté establecida
            );
            if (photoResult.error) {
              console.error(
                "Error subiendo foto de perfil:",
                photoResult.error
              );
              // No detener el proceso por error en la foto
              // La foto se puede subir más tarde desde el perfil
            } else {
              console.log("Foto de perfil subida exitosamente");
            }
          } catch (photoError) {
            console.error("Error al procesar foto de perfil:", photoError);
            // Continuar con el registro aunque falle la foto
          }
        }

        // Si el usuario es prestador o ambos, debe seleccionar servicios
        if (
          user.tipo_usuario === "prestador" ||
          user.tipo_usuario === "ambos"
        ) {
          // Esperar para asegurar que la sesión esté completamente establecida
          console.log(
            "Registro exitoso, esperando antes de navegar a ServiceSelection..."
          );
          await new Promise((resolve) => setTimeout(resolve, 1500));

          console.log("Navegando a ServiceSelection");
          navigation.navigate("ServiceSelection", { userId: user.id });
        } else {
          Alert.alert("Éxito", "Cuenta creada exitosamente", [
            {
              text: "OK",
              onPress: () => {
                // Navegar a HomeScreen después de registro exitoso
                navigation.navigate("Home");
              },
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Error en handleFinalSubmit:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Ocurrió un error inesperado"
      );
    } finally {
      setLoading(false);
    }
  };

  const renderProgressIndicator = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3].map((s) => (
        <View
          key={s}
          style={[
            styles.progressDot,
            s === step && styles.progressDotActive,
            s < step && styles.progressDotCompleted,
          ]}
        />
      ))}
      <Text style={styles.progressText}>Paso {step} de 3</Text>
    </View>
  );

  const renderStep1 = () => (
    <View>
      <Text style={styles.stepTitle}>Información Personal</Text>

      {/* Foto de Perfil (Opcional) */}
      <View style={styles.profilePhotoSection}>
        <Text style={styles.photoLabel}>Foto de Perfil (Opcional)</Text>
        <View style={styles.profilePhotoWrapper}>
          <TouchableOpacity
            onPress={handleEditProfilePicture}
            disabled={uploadingPhoto}
            style={styles.profilePhotoContainer}
          >
            {profileImageUri ? (
              <Image
                source={{ uri: profileImageUri }}
                style={styles.profilePhoto}
              />
            ) : (
              <View style={styles.profilePhotoPlaceholder}>
                <Text style={styles.photoPlaceholderText}>📷</Text>
                <Text style={styles.photoPlaceholderSubtext}>Agregar foto</Text>
              </View>
            )}
            {uploadingPhoto && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="small" color={colors.white} />
              </View>
            )}
          </TouchableOpacity>
          {profileImageUri && !uploadingPhoto && (
            <TouchableOpacity
              onPress={() => {
                setProfileImageUri(null);
              }}
              style={styles.removePhotoButton}
            >
              <Text style={styles.removePhotoButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        {profileImageUri && (
          <Text style={styles.photoHintText}>
            ✓ Foto seleccionada. Puedes cambiarla tocando la imagen.
          </Text>
        )}
      </View>

      <Controller
        control={step1Form.control}
        name="nombre"
        render={({ field: { onChange, value } }) => (
          <Input
            value={value}
            onChangeText={onChange}
            placeholder="Nombre"
            error={step1Form.formState.errors.nombre?.message}
            autoCapitalize="words"
          />
        )}
      />

      <Controller
        control={step1Form.control}
        name="apellido"
        render={({ field: { onChange, value } }) => (
          <Input
            value={value}
            onChangeText={onChange}
            placeholder="Apellido"
            error={step1Form.formState.errors.apellido?.message}
            autoCapitalize="words"
          />
        )}
      />

      <Controller
        control={step1Form.control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <Input
            value={value}
            onChangeText={onChange}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            error={step1Form.formState.errors.email?.message}
          />
        )}
      />

      <Controller
        control={step1Form.control}
        name="telefono"
        render={({ field: { onChange, value } }) => (
          <Input
            value={value}
            onChangeText={onChange}
            placeholder="Teléfono (+54 9 11 12345678)"
            keyboardType="phone-pad"
            error={step1Form.formState.errors.telefono?.message}
          />
        )}
      />

      <Controller
        control={step1Form.control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <Input
            value={value}
            onChangeText={onChange}
            placeholder="Contraseña"
            secureTextEntry
            error={step1Form.formState.errors.password?.message}
          />
        )}
      />

      <Controller
        control={step1Form.control}
        name="confirmPassword"
        render={({ field: { onChange, value } }) => (
          <Input
            value={value}
            onChangeText={onChange}
            placeholder="Confirmar contraseña"
            secureTextEntry
            error={step1Form.formState.errors.confirmPassword?.message}
          />
        )}
      />

      <Button
        title="Siguiente"
        onPress={step1Form.handleSubmit(handleStep1Next)}
        loading={loading}
      />
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text style={styles.stepTitle}>Tipo de Usuario</Text>
      <Text style={styles.stepDescription}>
        Selecciona cómo quieres usar la aplicación
      </Text>

      <Controller
        control={step2Form.control}
        name="tipoUsuario"
        render={({ field: { onChange, value } }) => (
          <>
            <TouchableOpacity
              style={[
                styles.userTypeCard,
                value === "cliente" && styles.userTypeCardSelected,
              ]}
              onPress={() => onChange("cliente")}
            >
              <Text style={styles.userTypeIcon}>👤</Text>
              <Text
                style={[
                  styles.userTypeTitle,
                  value === "cliente" && styles.userTypeTitleSelected,
                ]}
              >
                Busco servicios
              </Text>
              <Text style={styles.userTypeDescription}>
                Necesito contratar profesionales
              </Text>
              {value === "cliente" && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.userTypeCard,
                value === "prestador" && styles.userTypeCardSelected,
              ]}
              onPress={() => onChange("prestador")}
            >
              <Text style={styles.userTypeIcon}>🔧</Text>
              <Text
                style={[
                  styles.userTypeTitle,
                  value === "prestador" && styles.userTypeTitleSelected,
                ]}
              >
                Ofrezco servicios
              </Text>
              <Text style={styles.userTypeDescription}>
                Soy un técnico o profesional
              </Text>
              {value === "prestador" && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.userTypeCard,
                value === "ambos" && styles.userTypeCardSelected,
              ]}
              onPress={() => onChange("ambos")}
            >
              <Text style={styles.userTypeIcon}>👥</Text>
              <Text
                style={[
                  styles.userTypeTitle,
                  value === "ambos" && styles.userTypeTitleSelected,
                ]}
              >
                Ambos
              </Text>
              <Text style={styles.userTypeDescription}>
                Busco servicios y también ofrezco servicios
              </Text>
              {value === "ambos" && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          </>
        )}
      />

      <View style={styles.buttonRow}>
        <Button
          title="Atrás"
          onPress={() => setStep(1)}
          variant="outline"
          style={styles.backButton}
        />
        <Button
          title={
            step2Form.watch("tipoUsuario") === "cliente"
              ? "Finalizar"
              : "Continuar"
          }
          onPress={step2Form.handleSubmit(handleStep2Next)}
          loading={loading}
          style={styles.nextButton}
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View>
      <Text style={styles.stepTitle}>Información de Ubicación</Text>
      <Text style={styles.stepDescription}>
        Necesitamos tu ubicación para mostrar servicios cercanos
      </Text>

      <Controller
        control={step3Form.control}
        name="direccion"
        render={({ field: { onChange, value } }) => (
          <Input
            value={value || ""}
            onChangeText={onChange}
            placeholder="Dirección"
            error={step3Form.formState.errors.direccion?.message}
            multiline
            numberOfLines={2}
          />
        )}
      />

      <Button
        title={
          gettingLocation
            ? "Obteniendo ubicación..."
            : "Obtener ubicación actual (GPS)"
        }
        onPress={handleGetLocation}
        variant="secondary"
        loading={gettingLocation}
        disabled={gettingLocation}
        style={styles.locationButton}
      />

      {step3Form.watch("latitud") && step3Form.watch("longitud") && (
        <View style={styles.locationInfo}>
          <Text style={styles.locationInfoText}>
            ✓ Ubicación: {step3Form.watch("latitud")?.toFixed(6)},{" "}
            {step3Form.watch("longitud")?.toFixed(6)}
          </Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        <Button
          title="Atrás"
          onPress={() => setStep(2)}
          variant="outline"
          style={styles.backButton}
        />
        <Button
          title="Continuar a selección de servicios"
          onPress={step3Form.handleSubmit(handleStep3Next)}
          loading={loading}
          style={styles.nextButton}
        />
      </View>
    </View>
  );

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
          <Text style={styles.logo}>ofiSí</Text>
          {renderProgressIndicator()}
        </View>

        <View style={styles.form}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
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
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    fontSize: 36,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  progressDotCompleted: {
    backgroundColor: colors.secondary,
  },
  progressText: {
    marginLeft: 12,
    color: colors.textSecondary,
    fontSize: 14,
  },
  form: {
    width: "100%",
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  stepDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  userTypeCard: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    alignItems: "center",
    position: "relative",
  },
  userTypeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + "10",
  },
  userTypeIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  userTypeTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  userTypeTitleSelected: {
    color: colors.primary,
  },
  userTypeDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  checkmark: {
    position: "absolute",
    top: 16,
    right: 16,
    fontSize: 24,
    color: colors.primary,
  },
  locationButton: {
    marginBottom: 16,
  },
  locationInfo: {
    backgroundColor: colors.success + "20",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  locationInfoText: {
    color: colors.success,
    fontSize: 12,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
  profilePhotoSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  photoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  profilePhotoWrapper: {
    position: "relative",
    marginBottom: 8,
  },
  profilePhotoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 3,
    borderColor: colors.border,
  },
  profilePhoto: {
    width: "100%",
    height: "100%",
  },
  profilePhotoPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.backgroundSecondary,
  },
  photoPlaceholderText: {
    fontSize: 48,
    marginBottom: 4,
  },
  photoPlaceholderSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  removePhotoButton: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.error,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  removePhotoButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  photoHintText: {
    fontSize: 12,
    color: colors.success,
    marginTop: 4,
    textAlign: "center",
  },
});
