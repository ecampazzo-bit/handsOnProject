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
      const selectedImages = await pickMultipleImages();
      if (selectedImages.length > 0) {
        setFotos([...fotos, ...selectedImages]);
      }
    } catch (error) {
      Alert.alert("Error", "No se pudieron seleccionar las imágenes");
      console.error(error);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const photo = await takePhoto();
      if (photo) {
        setFotos([...fotos, photo]);
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo tomar la foto");
      console.error(error);
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
      // Obtener el usuario actual
      const {
        data: { user },
      } = await (
        await import("../services/supabaseClient")
      ).supabase.auth.getUser();
      if (!user) {
        Alert.alert("Error", "No se pudo identificar al usuario");
        setLoading(false);
        return;
      }

      // Crear la solicitud primero (sin fotos)
      const { solicitudId, error: createError } = await createSolicitud(
        user.id,
        servicioId,
        descripcion,
        prestadorIds,
        []
      );

      if (createError || !solicitudId) {
        Alert.alert(
          "Error",
          createError?.message || "No se pudo crear la solicitud"
        );
        setLoading(false);
        return;
      }

      // Si hay fotos, subirlas
      let fotosUrls: string[] = [];
      if (fotos.length > 0) {
        const { urls, error: uploadError } = await uploadSolicitudImages(
          solicitudId,
          fotos
        );

        if (uploadError) {
          console.error("Error al subir fotos:", uploadError);
          // Continuar aunque falle la subida de fotos
        } else {
          fotosUrls = urls;

          // Actualizar la solicitud con las URLs de las fotos
          const { error: updateError } = await (
            await import("../services/supabaseClient")
          ).supabase
            .from("solicitudes_servicio")
            .update({ fotos_urls: fotosUrls })
            .eq("id", solicitudId);

          if (updateError) {
            console.error(
              "Error al actualizar solicitud con fotos:",
              updateError
            );
          }
        }
      }

      Alert.alert(
        "¡Solicitud enviada!",
        `Se envió la solicitud de presupuesto a ${prestadorIds.length} prestador(es).`,
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
      console.error("Error al enviar solicitud:", error);
      Alert.alert("Error", "Ocurrió un error al enviar la solicitud");
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
