import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { supabase } from "../services/supabaseClient";
import { getCurrentUser } from "../services/authService";
import { colors } from "../constants/colors";
import { Button } from "./Button";

interface PrestadorData {
  descripcion_profesional: string | null;
  años_experiencia: number | null;
  tiene_matricula: boolean;
  numero_matricula: string | null;
  documentos_verificados: boolean;
  radio_cobertura_km: number | null;
  disponibilidad_inmediata: boolean;
  precio_minimo: number | null;
  acepta_efectivo: boolean;
  acepta_transferencia: boolean;
  acepta_tarjeta: boolean;
}

export const GestionCuenta: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [prestadorId, setPrestadorId] = useState<number | null>(null);
  const [formData, setFormData] = useState<PrestadorData>({
    descripcion_profesional: null,
    años_experiencia: null,
    tiene_matricula: false,
    numero_matricula: null,
    documentos_verificados: false,
    radio_cobertura_km: null,
    disponibilidad_inmediata: false,
    precio_minimo: null,
    acepta_efectivo: true,
    acepta_transferencia: false,
    acepta_tarjeta: false,
  });

  useEffect(() => {
    loadPrestadorData();
  }, []);

  const loadPrestadorData = async () => {
    setLoading(true);
    try {
      const { user, error: userError } = await getCurrentUser();
      if (userError || !user) {
        Alert.alert("Error", "No se pudo obtener la información del usuario");
        return;
      }

      const { data: prestador, error: prestadorError } = await supabase
        .from("prestadores")
        .select("*")
        .eq("usuario_id", user.id)
        .single();

      if (prestadorError || !prestador) {
        Alert.alert(
          "Error",
          "No se encontró tu perfil de prestador. Por favor, completa tu registro."
        );
        return;
      }

      setPrestadorId(prestador.id);
      setFormData({
        descripcion_profesional: prestador.descripcion_profesional || null,
        años_experiencia: prestador.años_experiencia || null,
        tiene_matricula: prestador.tiene_matricula || false,
        numero_matricula: prestador.numero_matricula || null,
        documentos_verificados: prestador.documentos_verificados || false,
        radio_cobertura_km: prestador.radio_cobertura_km || null,
        disponibilidad_inmediata: prestador.disponibilidad_inmediata || false,
        precio_minimo: prestador.precio_minimo || null,
        acepta_efectivo: prestador.acepta_efectivo ?? true,
        acepta_transferencia: prestador.acepta_transferencia || false,
        acepta_tarjeta: prestador.acepta_tarjeta || false,
      });
    } catch (error) {
      console.error("Error al cargar datos:", error);
      Alert.alert("Error", "Ocurrió un error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!prestadorId) {
      Alert.alert("Error", "No se encontró tu perfil de prestador");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("prestadores")
        .update({
          descripcion_profesional: formData.descripcion_profesional || null,
          años_experiencia: formData.años_experiencia
            ? parseInt(String(formData.años_experiencia))
            : null,
          tiene_matricula: formData.tiene_matricula,
          numero_matricula: formData.numero_matricula || null,
          documentos_verificados: formData.documentos_verificados,
          radio_cobertura_km: formData.radio_cobertura_km
            ? parseInt(String(formData.radio_cobertura_km))
            : null,
          disponibilidad_inmediata: formData.disponibilidad_inmediata,
          precio_minimo: formData.precio_minimo
            ? parseFloat(String(formData.precio_minimo))
            : null,
          acepta_efectivo: formData.acepta_efectivo,
          acepta_transferencia: formData.acepta_transferencia,
          acepta_tarjeta: formData.acepta_tarjeta,
        })
        .eq("id", prestadorId);

      if (error) {
        console.error("Error al guardar:", error);
        Alert.alert("Error", "No se pudieron guardar los cambios");
        return;
      }

      Alert.alert("Éxito", "Cambios guardados correctamente");
    } catch (error) {
      console.error("Error inesperado:", error);
      Alert.alert("Error", "Ocurrió un error inesperado");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={true}
    >
      <View style={styles.section}>
        <Text style={styles.label}>Descripción Profesional</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe tu experiencia y especialidades..."
          value={formData.descripcion_profesional || ""}
          onChangeText={(text) =>
            setFormData({ ...formData, descripcion_profesional: text })
          }
          multiline
          numberOfLines={4}
          placeholderTextColor={colors.textLight}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Años de Experiencia</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: 5"
          value={formData.años_experiencia?.toString() || ""}
          onChangeText={(text) =>
            setFormData({
              ...formData,
              años_experiencia: text ? parseInt(text) : null,
            })
          }
          keyboardType="numeric"
          placeholderTextColor={colors.textLight}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.switchRow}>
          <Text style={styles.label}>Tengo Matrícula Profesional</Text>
          <Switch
            value={formData.tiene_matricula}
            onValueChange={(value) =>
              setFormData({ ...formData, tiene_matricula: value })
            }
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={
              formData.tiene_matricula ? colors.primary : colors.textLight
            }
          />
        </View>
        {formData.tiene_matricula && (
          <TextInput
            style={styles.input}
            placeholder="Número de matrícula"
            value={formData.numero_matricula || ""}
            onChangeText={(text) =>
              setFormData({ ...formData, numero_matricula: text })
            }
            placeholderTextColor={colors.textLight}
          />
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.switchRow}>
          <Text style={styles.label}>Documentos Verificados</Text>
          <Switch
            value={formData.documentos_verificados}
            onValueChange={(value) =>
              setFormData({ ...formData, documentos_verificados: value })
            }
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={
              formData.documentos_verificados
                ? colors.primary
                : colors.textLight
            }
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Radio de Cobertura (km)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: 10"
          value={formData.radio_cobertura_km?.toString() || ""}
          onChangeText={(text) =>
            setFormData({
              ...formData,
              radio_cobertura_km: text ? parseInt(text) : null,
            })
          }
          keyboardType="numeric"
          placeholderTextColor={colors.textLight}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Precio Mínimo</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: 5000"
          value={formData.precio_minimo?.toString() || ""}
          onChangeText={(text) =>
            setFormData({
              ...formData,
              precio_minimo: text ? parseFloat(text) : null,
            })
          }
          keyboardType="numeric"
          placeholderTextColor={colors.textLight}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.switchRow}>
          <Text style={styles.label}>Disponibilidad Inmediata</Text>
          <Switch
            value={formData.disponibilidad_inmediata}
            onValueChange={(value) =>
              setFormData({ ...formData, disponibilidad_inmediata: value })
            }
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={
              formData.disponibilidad_inmediata
                ? colors.primary
                : colors.textLight
            }
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Métodos de Pago Aceptados</Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Efectivo</Text>
          <Switch
            value={formData.acepta_efectivo}
            onValueChange={(value) =>
              setFormData({ ...formData, acepta_efectivo: value })
            }
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={
              formData.acepta_efectivo ? colors.primary : colors.textLight
            }
          />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Transferencia</Text>
          <Switch
            value={formData.acepta_transferencia}
            onValueChange={(value) =>
              setFormData({ ...formData, acepta_transferencia: value })
            }
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={
              formData.acepta_transferencia ? colors.primary : colors.textLight
            }
          />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Tarjeta</Text>
          <Switch
            value={formData.acepta_tarjeta}
            onValueChange={(value) =>
              setFormData({ ...formData, acepta_tarjeta: value })
            }
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={
              formData.acepta_tarjeta ? colors.primary : colors.textLight
            }
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Guardar Cambios" onPress={handleSave} loading={saving} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
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
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: colors.text,
  },
  buttonContainer: {
    marginTop: 16,
    marginBottom: 32,
  },
});
