import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import DateTimePicker from "@react-native-community/datetimepicker";
import { RootStackParamList } from "../types/navigation";
import { colors } from "../constants/colors";
import { createCotizacion } from "../services/solicitudService";
import { supabase } from "../services/supabaseClient";

type ResponderSolicitudRouteProp = RouteProp<
  RootStackParamList,
  "ResponderSolicitud"
>;
type ResponderSolicitudNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ResponderSolicitud"
>;

export const ResponderSolicitudScreen: React.FC = () => {
  const navigation = useNavigation<ResponderSolicitudNavigationProp>();
  const route = useRoute<ResponderSolicitudRouteProp>();
  const { solicitudId, servicioNombre } = route.params;

  const [precio, setPrecio] = useState("");
  const [tiempo, setTiempo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaProgramada, setFechaProgramada] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [incluyeMateriales, setIncluyeMateriales] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!solicitudId) {
      Alert.alert("Error", "ID de solicitud no válido.");
      return;
    }

    if (!precio || !tiempo) {
      Alert.alert(
        "Campos requeridos",
        "Por favor ingresa precio y tiempo estimado."
      );
      return;
    }

    const precioNum = parseFloat(precio.replace(",", "."));
    const tiempoNum = parseInt(tiempo);

    if (isNaN(precioNum) || precioNum <= 0) {
      Alert.alert("Error", "Ingresa un precio válido.");
      return;
    }

    if (isNaN(tiempoNum) || tiempoNum <= 0) {
      Alert.alert("Error", "Ingresa un tiempo válido.");
      return;
    }

    setLoading(true);
    try {
      // Obtener el ID del prestador actual
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { data: prestador } = await supabase
        .from("prestadores")
        .select("id")
        .eq("usuario_id", user.id)
        .single();

      if (!prestador) throw new Error("No se encontró perfil de prestador");

      // Formatear fecha en formato YYYY-MM-DD para la base de datos
      // Usar métodos locales para evitar problemas de zona horaria
      const fechaFormateada = fechaProgramada
        ? `${fechaProgramada.getFullYear()}-${String(
            fechaProgramada.getMonth() + 1
          ).padStart(2, "0")}-${String(fechaProgramada.getDate()).padStart(
            2,
            "0"
          )}`
        : undefined;

      const { error } = await createCotizacion({
        solicitudId,
        prestadorId: prestador.id,
        precio: precioNum,
        tiempoEstimado: tiempoNum,
        descripcion,
        fechaProgramada: fechaFormateada,
        incluyeMateriales,
      });

      if (error) throw error;

      Alert.alert("Éxito", "Tu cotización ha sido enviada correctamente.", [
        { text: "OK", onPress: () => navigation.navigate("Home") },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo enviar la cotización");
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Responder Solicitud</Text>
        <Text style={styles.subtitle}>{servicioNombre}</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.formGroup}>
          <Text style={styles.label}>Precio Ofrecido ($)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 5000"
            keyboardType="numeric"
            value={precio}
            onChangeText={setPrecio}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Tiempo Estimado (horas)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 2"
            keyboardType="numeric"
            value={tiempo}
            onChangeText={setTiempo}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Fecha Programada para el Trabajo (Opcional)
          </Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowDatePicker(true)}
          >
            <Text
              style={fechaProgramada ? styles.dateText : styles.datePlaceholder}
            >
              {fechaProgramada
                ? fechaProgramada.toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                : "Seleccionar fecha"}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={fechaProgramada || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              minimumDate={new Date()}
              onChange={(event, selectedDate) => {
                if (Platform.OS === "android") {
                  setShowDatePicker(false);
                  if (event.type === "set" && selectedDate) {
                    setFechaProgramada(selectedDate);
                  }
                } else {
                  // iOS
                  if (selectedDate) {
                    setFechaProgramada(selectedDate);
                  }
                }
              }}
              locale="es-ES"
              is24Hour={true}
            />
          )}
          {Platform.OS === "ios" && showDatePicker && (
            <View style={styles.iosPickerButtons}>
              <TouchableOpacity
                style={[styles.pickerButton, styles.cancelButton]}
                onPress={() => {
                  setShowDatePicker(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pickerButton, styles.confirmButton]}
                onPress={() => {
                  setShowDatePicker(false);
                }}
              >
                <Text style={styles.confirmButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Descripción / Notas (Opcional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Detalla qué incluye el presupuesto..."
            multiline
            numberOfLines={4}
            value={descripcion}
            onChangeText={setDescripcion}
          />
        </View>

        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setIncluyeMateriales(!incluyeMateriales)}
          >
            <View
              style={[
                styles.checkboxBox,
                incluyeMateriales && styles.checkboxBoxChecked,
              ]}
            >
              {incluyeMateriales && (
                <Text style={styles.checkboxCheckmark}>✓</Text>
              )}
            </View>
            <Text style={styles.checkboxLabel}>Incluye materiales</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Enviar Cotización</Text>
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
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  dateText: {
    fontSize: 16,
    color: colors.text,
  },
  datePlaceholder: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  iosPickerButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 10,
  },
  pickerButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  cancelButton: {
    backgroundColor: colors.border,
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  checkboxContainer: {
    marginBottom: 20,
  },
  checkbox: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 4,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  checkboxBoxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxCheckmark: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  checkboxLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "500",
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
});
