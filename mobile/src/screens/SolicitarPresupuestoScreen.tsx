import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/navigation";
import { colors } from "../constants/colors";
import {
  createSolicitud,
  uploadSolicitudImages,
  pickMultipleImages,
  takePhoto,
} from "../services/solicitudService";

type SolicitarPresupuestoScreenRouteProp = RouteProp<
  RootStackParamList,
  "SolicitarPresupuesto"
>;
type SolicitarPresupuestoScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "SolicitarPresupuesto"
>;

export const SolicitarPresupuestoScreen: React.FC = () => {
  const navigation = useNavigation<SolicitarPresupuestoScreenNavigationProp>();
  const route = useRoute<SolicitarPresupuestoScreenRouteProp>();
  const { servicioId, prestadorIds } = route.params;

  const [descripcion, setDescripcion] = useState("");
  const [fotos, setFotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handlePickImages = async () => {
    try {
      console.log("📷 Abriendo galería de imágenes...");
      const selectedImages = await pickMultipleImages();

      if (selectedImages.length > 0) {
        console.log(`✅ Se seleccionaron ${selectedImages.length} imagen(es)`);
        setFotos([...fotos, ...selectedImages]);
        Alert.alert(
          "Éxito",
          `Se agregaron ${selectedImages.length} imagen(es)`
        );
      } else {
        console.log("ℹ️ Usuario canceló la selección de imágenes");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("❌ Error al seleccionar imágenes:", errorMessage);

      // Mostrar mensaje específico según el tipo de error
      if (errorMessage.includes("permisos")) {
        Alert.alert(
          "Permisos requeridos",
          "La app necesita acceso a tu galería. Por favor, habilita los permisos en Ajustes.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "Error",
          `No se pudieron seleccionar las imágenes: ${errorMessage}`
        );
      }
    }
  };

  const handleTakePhoto = async () => {
    try {
      console.log("📸 Abriendo cámara...");
      const photo = await takePhoto();

      if (photo) {
        console.log("✅ Foto capturada exitosamente");
        setFotos([...fotos, photo]);
        Alert.alert("Éxito", "Foto agregada a la solicitud");
      } else {
        console.log("ℹ️ Usuario canceló la captura de foto");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("❌ Error al tomar foto:", errorMessage);

      // Mostrar mensaje específico según el tipo de error
      if (errorMessage.includes("permisos")) {
        Alert.alert(
          "Permisos requeridos",
          "La app necesita acceso a tu cámara. Por favor, habilita los permisos en Ajustes.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("Error", `No se pudo tomar la foto: ${errorMessage}`);
      }
    }
  };

  const removePhoto = (index: number) => {
    setFotos(fotos.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!descripcion.trim()) {
      Alert.alert(
        "Campo requerido",
        "Por favor describe el trabajo a realizar"
      );
      return;
    }

    setLoading(true);
    try {
      console.log("=== Iniciando envío de solicitud ===");

      // Obtener el usuario actual
      const {
        data: { user },
      } = await (
        await import("../services/supabaseClient")
      ).supabase.auth.getUser();

      if (!user) {
        console.error("❌ No se pudo obtener el usuario");
        Alert.alert(
          "Error de autenticación",
          "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("Login"),
            },
          ]
        );
        setLoading(false);
        return;
      }

      console.log(`✅ Usuario obtenido: ${user.id}`);

      // Crear la solicitud primero (sin fotos)
      console.log("📝 Creando solicitud en base de datos...");
      const { solicitudId, error: createError } = await createSolicitud(
        user.id,
        servicioId,
        descripcion,
        prestadorIds,
        []
      );

      if (createError || !solicitudId) {
        console.error("❌ Error al crear solicitud:", createError);
        Alert.alert(
          "Error al crear solicitud",
          createError?.message ||
            "No se pudo crear la solicitud. Intenta nuevamente."
        );
        setLoading(false);
        return;
      }

      console.log(`✅ Solicitud creada con ID: ${solicitudId}`);

      // Si hay fotos, subirlas
      let fotosUrls: string[] = [];
      if (fotos.length > 0) {
        console.log(`📸 Iniciando carga de ${fotos.length} imagen(es)...`);
        const { urls, error: uploadError } = await uploadSolicitudImages(
          solicitudId,
          fotos
        );

        if (uploadError) {
          console.error("⚠️ Error al subir fotos:", uploadError.message);

          // Mostrar alerta pero permitir continuar si al menos la solicitud se creó
          Alert.alert(
            "Aviso",
            `La solicitud se creó, pero hubo un problema al subir las fotos: ${uploadError.message}\n\nPuedes intentar agregarlas después.`,
            [{ text: "Continuar" }]
          );

          // Continuar de todas formas
          fotosUrls = [];
        } else {
          fotosUrls = urls;
          console.log(`✅ Se subieron ${urls.length} imagen(es)`);

          // Actualizar la solicitud con las URLs de las fotos
          if (fotosUrls.length > 0) {
            console.log("🔄 Actualizando solicitud con URLs de fotos...");
            const { error: updateError } = await (
              await import("../services/supabaseClient")
            ).supabase
              .from("solicitudes_servicio")
              .update({ fotos_urls: fotosUrls })
              .eq("id", solicitudId);

            if (updateError) {
              console.error(
                "⚠️ Error al actualizar solicitud con fotos:",
                updateError
              );
              // No es crítico, continuar de todas formas
            } else {
              console.log("✅ Solicitud actualizada con fotos");
            }
          }
        }
      }

      console.log("✅ ¡Solicitud enviada exitosamente!");
      Alert.alert(
        "¡Solicitud enviada!",
        `Se envió la solicitud de presupuesto a ${
          prestadorIds.length
        } prestador${prestadorIds.length > 1 ? "es" : ""}${
          fotosUrls.length > 0
            ? ` con ${fotosUrls.length} foto${fotosUrls.length > 1 ? "s" : ""}`
            : ""
        }.`,
        [
          {
            text: "OK",
            onPress: () => {
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("❌ CRÍTICO - Error al enviar solicitud:", errorMessage);

      Alert.alert(
        "Error inesperado",
        `Ocurrió un error: ${errorMessage}\n\nSi el problema persiste, intenta iniciar sesión nuevamente.`
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
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Solicitar Presupuesto</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.section}>
          <Text style={styles.label}>Descripción del trabajo *</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe el trabajo que necesitas realizar..."
            placeholderTextColor={colors.textLight}
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Fotos (opcional)</Text>
          <Text style={styles.hint}>
            Puedes agregar fotos que ayuden a describir el trabajo. Las imágenes
            se convertirán automáticamente a formato JPG para mejor
            compatibilidad.
          </Text>

          <View style={styles.photoButtons}>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={handlePickImages}
            >
              <Text style={styles.photoButtonText}>📷 Galería</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={handleTakePhoto}
            >
              <Text style={styles.photoButtonText}>📸 Cámara</Text>
            </TouchableOpacity>
          </View>

          {fotos.length > 0 && (
            <View style={styles.photosContainer}>
              {fotos.map((foto, index) => (
                <View key={index} style={styles.photoWrapper}>
                  <Image source={{ uri: foto }} style={styles.photo} />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => removePhoto(index)}
                  >
                    <Text style={styles.removePhotoText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>
              Enviar solicitud ({prestadorIds.length} prestador
              {prestadorIds.length > 1 ? "es" : ""})
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
  header: {
    backgroundColor: colors.white,
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  textArea: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 120,
  },
  photoButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  photoButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  photoButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  photosContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  photoWrapper: {
    width: 100,
    height: 100,
    position: "relative",
  },
  photo: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  removePhotoButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: colors.error,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  removePhotoText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "bold",
  },
  footer: {
    backgroundColor: colors.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
});
