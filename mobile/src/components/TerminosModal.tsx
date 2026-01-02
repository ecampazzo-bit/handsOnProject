import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
  Alert,
} from "react-native";
import { colors } from "../constants/colors";

interface TerminosModalProps {
  visible: boolean;
  onClose: () => void;
}

export const TerminosModal: React.FC<TerminosModalProps> = ({
  visible,
  onClose,
}) => {
  const handleOpenTerms = async () => {
    const url = "https://ofisi.ar/terminos";
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "No se puede abrir el enlace");
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo abrir los términos y condiciones");
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Términos y Condiciones</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Para leer los Términos y Condiciones completos, haz clic en el botón
              de abajo para abrirlos en tu navegador.
            </Text>
            <TouchableOpacity
              style={styles.openButton}
              onPress={handleOpenTerms}
            >
              <Text style={styles.openButtonText}>
                Abrir Términos y Condiciones
              </Text>
            </TouchableOpacity>
            <Text style={styles.noteText}>
              Al continuar con el registro, aceptas los Términos y Condiciones
              de uso de ofiSi.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "ios" ? 50 : 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  infoContainer: {
    alignItems: "center",
  },
  infoText: {
    fontSize: 16,
    color: colors.text,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  openButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 24,
  },
  openButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  noteText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
  },
});

