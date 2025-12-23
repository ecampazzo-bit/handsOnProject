import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
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
  Image,
} from "react-native";
import { supabase } from "../services/supabaseClient";
import { getCurrentUser, getCurrentUserId } from "../services/authService";
import { colors } from "../constants/colors";
import { Button } from "./Button";
import {
  uploadProfilePicture,
  pickImageFromGallery,
  takePhotoWithCamera,
} from "../services/profileService";
import * as ImageManipulator from "expo-image-manipulator";
import { RootStackParamList } from "../types/navigation";
import { isPhoneVerified } from "../services/phoneVerificationService";
import { resendVerificationEmail } from "../services/authService";
import { formatArgentinePhone, phoneSchema } from "../utils/validation";

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

interface GestionCuentaProps {
  onConvertirseEnPrestador?: () => void;
}

type GestionCuentaNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Home"
>;

export const GestionCuenta: React.FC<GestionCuentaProps> = ({
  onConvertirseEnPrestador,
}) => {
  const navigation = useNavigation<GestionCuentaNavigationProp>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [prestadorId, setPrestadorId] = useState<number | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(
    null
  );
  const [telefonoVerificado, setTelefonoVerificado] = useState<boolean>(false);
  const [emailVerificado, setEmailVerificado] = useState<boolean>(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState("");
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
    loadUserData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Recargar datos cuando se enfoca la pantalla (incluyendo estado de verificación)
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    setLoading(true);
    try {
      const { user, error: userError } = await getCurrentUser();
      if (userError || !user) {
        Alert.alert("Error", "No se pudo obtener la información del usuario");
        return;
      }

      setUserData(user);
      // Agregar timestamp para evitar caché de imágenes
      const photoUrl = user.foto_perfil_url
        ? `${user.foto_perfil_url}?t=${Date.now()}`
        : null;
      setProfilePictureUrl(photoUrl);

      // Verificar si el teléfono está verificado
      const phoneVerified = await isPhoneVerified(user.id);
      setTelefonoVerificado(phoneVerified);

      // Verificar si el email está confirmado
      const { data: authUser } = await supabase.auth.getUser();
      setEmailVerificado(!!authUser?.user?.email_confirmed_at);

      // Si el usuario es prestador o ambos, cargar datos del prestador
      if (user.tipo_usuario === "prestador" || user.tipo_usuario === "ambos") {
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
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
      Alert.alert("Error", "Ocurrió un error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfilePicture = () => {
    Alert.alert("Editar Foto de Perfil", "¿Cómo deseas agregar tu foto?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Galería",
        onPress: async () => {
          try {
            const result = await pickImageFromGallery();
            if (!result.canceled && result.assets && result.assets[0]) {
              await uploadPhoto(result.assets[0].uri);
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
              await uploadPhoto(result.assets[0].uri);
            }
          } catch (error: any) {
            Alert.alert("Error", error.message || "No se pudo tomar la foto");
          }
        },
      },
    ]);
  };

  const uploadPhoto = async (imageUri: string) => {
    setUploadingPhoto(true);
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        Alert.alert("Error", "No se pudo obtener el ID del usuario");
        return;
      }

      // Convertir a JPG si es necesario
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      const result = await uploadProfilePicture(userId, manipulatedImage.uri);

      if (result.error) {
        Alert.alert("Error", result.error.message);
        return;
      }

      if (result.url) {
        // Agregar timestamp para evitar caché
        const urlWithTimestamp = `${result.url}?t=${Date.now()}`;
        setProfilePictureUrl(urlWithTimestamp);
        // Actualizar userData local
        setUserData({ ...userData, foto_perfil_url: result.url });
        Alert.alert("Éxito", "Foto de perfil actualizada correctamente");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo subir la foto");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleConvertirseEnCliente = async () => {
    Alert.alert(
      "Convertirse en Cliente",
      "¿Deseas también poder buscar servicios como cliente? Esto te permitirá solicitar presupuestos a otros prestadores.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, convertirme",
          onPress: async () => {
            setSaving(true);
            try {
              const userId = await getCurrentUserId();
              if (!userId) {
                Alert.alert("Error", "No se pudo obtener el ID del usuario");
                return;
              }

              // Actualizar tipo_usuario de "prestador" a "ambos"
              const { error: updateError } = await supabase
                .from("users")
                .update({ tipo_usuario: "ambos" })
                .eq("id", userId);

              if (updateError) {
                console.error("Error al actualizar tipo_usuario:", updateError);
                Alert.alert(
                  "Error",
                  "No se pudo actualizar el tipo de usuario"
                );
                return;
              }

              Alert.alert(
                "¡Éxito!",
                "Ahora también puedes buscar servicios como cliente. Puedes solicitar presupuestos a otros prestadores.",
                [
                  {
                    text: "OK",
                    onPress: () => {
                      // Recargar datos para reflejar los cambios
                      loadUserData();
                      // Llamar al callback para cambiar el tab en HomeScreen si existe
                      if (onConvertirseEnPrestador) {
                        // Este callback también funciona para cambiar a cliente
                        onConvertirseEnPrestador();
                      }
                    },
                  },
                ]
              );
            } catch (error) {
              console.error("Error inesperado:", error);
              Alert.alert("Error", "Ocurrió un error inesperado");
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleConvertirseEnPrestador = async () => {
    Alert.alert(
      "Convertirse en Prestador",
      "¿Deseas convertirte en prestador de servicios? Esto te permitirá ofrecer servicios y recibir solicitudes de presupuesto.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, convertirme",
          onPress: async () => {
            setSaving(true);
            try {
              const userId = await getCurrentUserId();
              if (!userId) {
                Alert.alert("Error", "No se pudo obtener el ID del usuario");
                return;
              }

              // 1. Actualizar tipo_usuario de "cliente" a "ambos"
              const { error: updateError } = await supabase
                .from("users")
                .update({ tipo_usuario: "ambos" })
                .eq("id", userId);

              if (updateError) {
                console.error("Error al actualizar tipo_usuario:", updateError);
                Alert.alert(
                  "Error",
                  "No se pudo actualizar el tipo de usuario"
                );
                return;
              }

              // 2. Crear registro en prestadores usando RPC
              const { data: prestadorResult, error: prestadorError } =
                await supabase.rpc("insert_prestador", {
                  p_usuario_id: userId,
                });

              if (prestadorError) {
                console.error("Error al crear prestador:", prestadorError);
                // Si falla crear prestador, revertir el cambio de tipo_usuario
                await supabase
                  .from("users")
                  .update({ tipo_usuario: "cliente" })
                  .eq("id", userId);
                Alert.alert(
                  "Error",
                  "No se pudo crear el perfil de prestador. Por favor, intenta nuevamente."
                );
                return;
              }

              Alert.alert(
                "¡Éxito!",
                "Ahora eres prestador de servicios. Debes agregar los servicios que ofreces para que los clientes puedan encontrarte.",
                [
                  {
                    text: "Agregar Servicios",
                    onPress: () => {
                      // Recargar datos para reflejar los cambios
                      loadUserData();
                      // Llamar al callback para cambiar el tab en HomeScreen
                      if (onConvertirseEnPrestador) {
                        onConvertirseEnPrestador();
                      }
                    },
                  },
                ]
              );
            } catch (error) {
              console.error("Error inesperado:", error);
              Alert.alert("Error", "Ocurrió un error inesperado");
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
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

  const isPrestador =
    userData?.tipo_usuario === "prestador" ||
    userData?.tipo_usuario === "ambos";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={true}
    >
      {/* Sección de Foto de Perfil - Para todos los usuarios */}
      <View style={styles.profileSection}>
        <Text style={styles.sectionTitle}>Foto de Perfil</Text>
        <View style={styles.profilePictureContainer}>
          <TouchableOpacity
            onPress={handleEditProfilePicture}
            disabled={uploadingPhoto}
            style={styles.profilePictureWrapper}
          >
            {profilePictureUrl ? (
              <Image
                source={{ uri: profilePictureUrl }}
                style={styles.profilePicture}
              />
            ) : (
              <View style={styles.profilePicturePlaceholder}>
                <Text style={styles.profilePictureText}>
                  {userData?.nombre?.[0] || "U"}
                  {userData?.apellido?.[0] || ""}
                </Text>
              </View>
            )}
            {uploadingPhoto && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="small" color={colors.white} />
              </View>
            )}
            <View style={styles.editBadge}>
              <Text style={styles.editBadgeText}>✏️</Text>
            </View>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={handleEditProfilePicture}
          style={styles.editPhotoButton}
        >
          <Text style={styles.editPhotoButtonText}>
            {profilePictureUrl ? "Cambiar Foto" : "Agregar Foto"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Información Básica del Usuario - Para todos los usuarios */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información Personal</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Nombre:</Text>
          <Text style={styles.infoValue}>
            {userData?.nombre} {userData?.apellido}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email:</Text>
          <View style={styles.phoneRow}>
            <Text 
              style={styles.infoValue} 
              numberOfLines={1} 
              ellipsizeMode="tail"
            >
              {userData?.email}
            </Text>
            {emailVerificado ? (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Verificado</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.verifyButton}
                onPress={async () => {
                  if (userData?.email) {
                    setSaving(true);
                    try {
                      const { error } = await resendVerificationEmail(
                        userData.email
                      );
                      if (error) {
                        Alert.alert(
                          "Error",
                          error.message ||
                            "No se pudo enviar el email de verificación"
                        );
                      } else {
                        Alert.alert(
                          "Email enviado",
                          "Hemos enviado un email de verificación a tu correo. Por favor, revisa tu bandeja de entrada."
                        );
                      }
                    } catch (error: any) {
                      Alert.alert(
                        "Error",
                        error.message || "Error al enviar email"
                      );
                    } finally {
                      setSaving(false);
                    }
                  }
                }}
              >
                <Text style={styles.verifyButtonText}>Verificar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Teléfono:</Text>
          <View style={styles.phoneRow}>
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
                      setNewPhone(userData?.telefono || "");
                      setEditingPhone(false);
                    }}
                    disabled={saving}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.editPhoneButton, styles.saveButton]}
                    onPress={async () => {
                      // Validar teléfono
                      try {
                        await phoneSchema.validate(newPhone);
                      } catch (error: any) {
                        Alert.alert(
                          "Error",
                          error.message || "Formato de teléfono inválido"
                        );
                        return;
                      }

                      const formattedPhone = formatArgentinePhone(newPhone);

                      if (formattedPhone === userData?.telefono) {
                        Alert.alert("Info", "El teléfono es el mismo");
                        setEditingPhone(false);
                        return;
                      }

                      setSaving(true);
                      try {
                        const { user } = await getCurrentUser();
                        if (!user) {
                          Alert.alert(
                            "Error",
                            "No se pudo identificar al usuario"
                          );
                          return;
                        }

                        // Actualizar teléfono en la base de datos
                        const { error: updateError } = await supabase
                          .from("users")
                          .update({
                            telefono: formattedPhone,
                            telefono_verificado: false,
                          })
                          .eq("id", user.id);

                        if (updateError) {
                          Alert.alert(
                            "Error",
                            updateError.message ||
                              "No se pudo actualizar el teléfono"
                          );
                          return;
                        }

                        // Recargar datos del usuario
                        await loadUserData();
                        setEditingPhone(false);

                        Alert.alert(
                          "Teléfono actualizado",
                          "Tu teléfono ha sido actualizado. Ahora puedes verificarlo.",
                          [
                            {
                              text: "Verificar ahora",
                              onPress: () => {
                                navigation.navigate("PhoneVerification", {
                                  telefono: formattedPhone,
                                });
                              },
                            },
                            { text: "Después", style: "cancel" },
                          ]
                        );
                      } catch (error: any) {
                        Alert.alert(
                          "Error",
                          error.message || "Error al actualizar teléfono"
                        );
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <Text style={styles.saveButtonText}>Guardar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <Text style={styles.infoValue}>{userData?.telefono}</Text>
                {telefonoVerificado ? (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedText}>✓ Verificado</Text>
                  </View>
                ) : (
                  <View style={styles.phoneActions}>
                    <TouchableOpacity
                      style={styles.editPhoneLink}
                      onPress={() => {
                        setNewPhone(userData?.telefono || "");
                        setEditingPhone(true);
                      }}
                    >
                      <Text style={styles.editPhoneLinkText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.verifyButton}
                      onPress={() => {
                        if (userData?.telefono) {
                          navigation.navigate("PhoneVerification", {
                            telefono: userData.telefono,
                          });
                        }
                      }}
                    >
                      <Text style={styles.verifyButtonText}>Verificar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tipo de Usuario:</Text>
          <Text style={styles.infoValue}>
            {userData?.tipo_usuario === "cliente"
              ? "Cliente"
              : userData?.tipo_usuario === "prestador"
              ? "Prestador"
              : "Cliente y Prestador"}
          </Text>
        </View>
      </View>

      {/* Sección para convertir cliente en prestador */}
      {userData?.tipo_usuario === "cliente" && (
        <View style={styles.section}>
          <View style={styles.convertSection}>
            <Text style={styles.convertTitle}>¿Quieres ofrecer servicios?</Text>
            <Text style={styles.convertDescription}>
              Conviértete en prestador de servicios para poder ofrecer tus
              servicios y recibir solicitudes de presupuesto de clientes.
            </Text>
            <Button
              title="Convertirme en Prestador"
              onPress={handleConvertirseEnPrestador}
              loading={saving}
              style={styles.convertButton}
            />
          </View>
        </View>
      )}

      {/* Sección para convertir prestador en cliente */}
      {userData?.tipo_usuario === "prestador" && (
        <View style={styles.section}>
          <View style={styles.convertSection}>
            <Text style={styles.convertTitle}>
              ¿Quieres también buscar servicios?
            </Text>
            <Text style={styles.convertDescription}>
              Conviértete también en cliente para poder buscar servicios y
              solicitar presupuestos a otros prestadores.
            </Text>
            <Button
              title="Convertirme también en Cliente"
              onPress={handleConvertirseEnCliente}
              loading={saving}
              style={styles.convertButton}
            />
          </View>
        </View>
      )}

      {/* Información de Prestador - Solo para prestadores */}
      {isPrestador && (
        <>
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
                  formData.acepta_transferencia
                    ? colors.primary
                    : colors.textLight
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
            <Button
              title="Guardar Cambios"
              onPress={handleSave}
              loading={saving}
            />
          </View>
        </>
      )}
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
  profileSection: {
    alignItems: "center",
    marginBottom: 32,
    paddingVertical: 20,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 16,
  },
  profilePictureContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  profilePictureWrapper: {
    position: "relative",
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  profilePicturePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: colors.primary,
  },
  profilePictureText: {
    color: colors.primary,
    fontSize: 36,
    fontWeight: "bold",
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: colors.white,
  },
  editBadgeText: {
    fontSize: 16,
  },
  editPhotoButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  editPhotoButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
    textAlign: "right",
    flexShrink: 1,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    justifyContent: "flex-end",
  },
  verifiedBadge: {
    backgroundColor: "#10B981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  verifyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  verifyButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  phoneActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editPhoneLink: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  editPhoneLinkText: {
    fontSize: 12,
    color: colors.primary,
    textDecorationLine: "underline",
  },
  editPhoneContainer: {
    flex: 1,
    marginTop: 8,
  },
  phoneInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  editPhoneButtons: {
    flexDirection: "row",
    gap: 8,
  },
  editPhoneButton: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
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
    fontSize: 12,
    fontWeight: "600",
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
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
  convertSection: {
    backgroundColor: colors.backgroundSecondary,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  convertTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 8,
  },
  convertDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  convertButton: {
    marginTop: 8,
  },
});
