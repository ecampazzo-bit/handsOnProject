import { supabase } from "./supabaseClient";
import * as ImagePicker from "expo-image-picker";

export interface ProfilePictureResult {
  url: string | null;
  error: { message: string } | null;
}

/**
 * Solicita permisos para acceder a la galería o cámara
 */
export const requestImagePermissions = async (): Promise<boolean> => {
  const { status: cameraStatus } =
    await ImagePicker.requestCameraPermissionsAsync();
  const { status: mediaLibraryStatus } =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  return cameraStatus === "granted" || mediaLibraryStatus === "granted";
};

/**
 * Selecciona una imagen de la galería
 */
export const pickImageFromGallery =
  async (): Promise<ImagePicker.ImagePickerResult> => {
    const hasPermission = await requestImagePermissions();
    if (!hasPermission) {
      throw new Error("No se otorgaron permisos para acceder a la galería");
    }

    return await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
  };

/**
 * Toma una foto con la cámara
 */
export const takePhotoWithCamera =
  async (): Promise<ImagePicker.ImagePickerResult> => {
    const hasPermission = await requestImagePermissions();
    if (!hasPermission) {
      throw new Error("No se otorgaron permisos para acceder a la cámara");
    }

    return await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
  };

/**
 * Convierte una URI de imagen a un objeto File/Blob para subir
 */
const uriToBlob = async (uri: string): Promise<Blob> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  return blob;
};

/**
 * Sube la foto de perfil a Supabase Storage y actualiza el usuario
 */
export const uploadProfilePicture = async (
  userId: string,
  imageUri: string
): Promise<ProfilePictureResult> => {
  try {
    // Convertir URI a Blob
    const blob = await uriToBlob(imageUri);

    // Determinar extensión del archivo
    const fileExt = imageUri.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${userId}/avatar.${fileExt}`;

    // Subir a Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, blob, {
        cacheControl: "3600",
        upsert: true,
        contentType: `image/${fileExt === "jpg" ? "jpeg" : fileExt}`,
      });

    if (uploadError) {
      console.error("Error al subir imagen:", uploadError);
      return {
        url: null,
        error: { message: "Error al subir la imagen: " + uploadError.message },
      };
    }

    // Obtener URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(fileName);

    // Actualizar directamente en la tabla users
    const { error: updateError } = await supabase
      .from("users")
      .update({ foto_perfil_url: publicUrl })
      .eq("id", userId);

    if (updateError) {
      console.error("Error al actualizar foto de perfil:", updateError);
      return {
        url: null,
        error: updateError,
      };
    }

    return {
      url: publicUrl,
      error: null,
    };
  } catch (error) {
    console.error("Error en uploadProfilePicture:", error);
    return {
      url: null,
      error: {
        message:
          error instanceof Error
            ? error.message
            : "Error desconocido al subir foto",
      },
    };
  }
};

/**
 * Elimina la foto de perfil
 */
export const deleteProfilePicture = async (
  userId: string
): Promise<{ error: { message: string } | null }> => {
  try {
    // Obtener el nombre del archivo
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      return { error: { message: "No autorizado" } };
    }

    // Listar archivos en la carpeta del usuario
    const { data: files, error: listError } = await supabase.storage
      .from("avatars")
      .list(userId);

    if (listError) {
      return {
        error: { message: "Error al listar archivos: " + listError.message },
      };
    }

    // Eliminar archivos de avatar
    if (files && files.length > 0) {
      const fileNames = files.map((f) => `${userId}/${f.name}`);
      const { error: deleteError } = await supabase.storage
        .from("avatars")
        .remove(fileNames);

      if (deleteError) {
        return {
          error: {
            message: "Error al eliminar archivos: " + deleteError.message,
          },
        };
      }
    }

    // Actualizar directamente en la tabla users (poner null)
    const { error: updateError } = await supabase
      .from("users")
      .update({ foto_perfil_url: null })
      .eq("id", userId);

    if (updateError) {
      return { error: updateError };
    }

    return { error: null };
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : "Error desconocido",
      },
    };
  }
};

/**
 * Obtiene la URL de la foto de perfil de un usuario
 */
export const getProfilePictureUrl = async (
  userId: string
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from("users_public")
      .select("foto_perfil_url")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error al obtener foto de perfil:", error);
      return null;
    }

    return data?.foto_perfil_url || null;
  } catch (error) {
    console.error("Error en getProfilePictureUrl:", error);
    return null;
  }
};
