import { supabase } from "./supabaseClient";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import { Platform } from "react-native";

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
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
  };

/**
 * Toma una foto con la cámara
 * En Android, habilita allowsEditing para forzar copia a ubicación segura
 */
export const takePhotoWithCamera =
  async (): Promise<ImagePicker.ImagePickerResult> => {
    const hasPermission = await requestImagePermissions();
    if (!hasPermission) {
      throw new Error("No se otorgaron permisos para acceder a la cámara");
    }

    return await ImagePicker.launchCameraAsync({
      allowsEditing: Platform.OS === "android",
      aspect: [1, 1],
      quality: 0.8,
      exif: false,
    });
  };

/**
 * Convierte una imagen a formato JPG
 */
const convertToJPG = async (uri: string): Promise<string> => {
  try {
    const manipResult = await ImageManipulator.manipulateAsync(uri, [], {
      compress: 0.8,
      format: ImageManipulator.SaveFormat.JPEG,
    });

    const newUri = manipResult.uri;
    console.log(`✅ Avatar convertido a JPG: ${newUri.substring(0, 40)}...`);

    // ⚠️ IMPORTANTE: Esperar un poco para que el archivo se escriba completamente
    // Android necesita más tiempo que iOS
    const waitTime = Platform.OS === "android" ? 500 : 300;
    console.log(`⏳ Esperando ${waitTime}ms para que el archivo se escriba...`);
    await new Promise((resolve) => setTimeout(resolve, waitTime));

    // Verificar que el archivo exista
    const fileInfo = await FileSystem.getInfoAsync(newUri);
    if (!fileInfo.exists) {
      console.warn(`⚠️ Archivo temporal no existe: ${newUri}`);
      return uri;
    }

    return newUri;
  } catch (error) {
    console.error("Error al convertir imagen a JPG:", error);
    return uri;
  }
};

/**
 * Convierte una URI de imagen a ArrayBuffer para React Native
 * Con reintentos inteligentes para Android
 */
const uriToArrayBuffer = async (
  uri: string,
  maxRetries: number = Platform.OS === "android" ? 5 : 3
): Promise<ArrayBuffer> => {
  const tryRead = async (attempt: number): Promise<ArrayBuffer> => {
    try {
      console.log(
        `📤 Leyendo archivo de avatar (intento ${attempt}/${maxRetries}): ${uri.substring(
          0,
          50
        )}...`
      );

      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error(`El archivo no existe: ${uri}`);
      }

      console.log(`📁 Archivo encontrado: ${fileInfo.size} bytes`);

      // Si el archivo está vacío, reintentar
      if (fileInfo.size === 0 && attempt < maxRetries) {
        const waitMs = Platform.OS === "android" ? 800 : 500;
        console.warn(
          `⚠️ Archivo vacío (0 bytes), esperando ${waitMs}ms e intentando de nuevo...`
        );
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        return tryRead(attempt + 1);
      }

      if (fileInfo.size === 0) {
        throw new Error(
          `El archivo está vacío (0 bytes) después de ${maxRetries} intentos`
        );
      }

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64" as any,
      });

      if (!base64 || base64.length === 0) {
        if (attempt < maxRetries) {
          const waitMs = Platform.OS === "android" ? 800 : 500;
          console.warn(
            `⚠️ Base64 vacío, esperando ${waitMs}ms e intentando de nuevo...`
          );
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          return tryRead(attempt + 1);
        }
        throw new Error(
          `El archivo está vacío o no se pudo leer después de ${maxRetries} intentos`
        );
      }

      console.log(`✅ Archivo leído: ${base64.length} caracteres base64`);

      // Convertir base64 a ArrayBuffer
      const binaryString =
        typeof atob !== "undefined"
          ? atob(base64)
          : (() => {
              const chars =
                "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
              let output = "";
              let i = 0;
              const cleanBase64 = base64.replace(/[^A-Za-z0-9\+\/\=]/g, "");
              while (i < cleanBase64.length) {
                const enc1 = chars.indexOf(cleanBase64.charAt(i++));
                const enc2 = chars.indexOf(cleanBase64.charAt(i++));
                const enc3 = chars.indexOf(cleanBase64.charAt(i++));
                const enc4 = chars.indexOf(cleanBase64.charAt(i++));
                const chr1 = (enc1 << 2) | (enc2 >> 4);
                const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                const chr3 = ((enc3 & 3) << 6) | enc4;
                output += String.fromCharCode(chr1);
                if (enc3 !== 64) output += String.fromCharCode(chr2);
                if (enc4 !== 64) output += String.fromCharCode(chr3);
              }
              return output;
            })();

      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      console.log(`✅ ArrayBuffer creado: ${bytes.buffer.byteLength} bytes`);
      return bytes.buffer;
    } catch (error) {
      if (attempt < maxRetries) {
        console.warn(
          `⚠️ Error al leer (intento ${attempt}/${maxRetries}):`,
          error instanceof Error ? error.message : error
        );
        const waitMs = Platform.OS === "android" ? 800 : 500;
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        return tryRead(attempt + 1);
      }
      console.error(
        `❌ Error al leer archivo de avatar después de ${maxRetries} intentos:`,
        error
      );
      throw error;
    }
  };

  return tryRead(1);
};

/**
 * Espera y verifica que la sesión esté establecida
 */
const ensureSession = async (
  maxRetries = 10,
  delayMs = 500
): Promise<boolean> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (session && !error) {
        console.log(`✅ Sesión establecida después de ${i + 1} intentos`);
        return true;
      }
      if (i < maxRetries - 1) {
        console.log(`⏳ Esperando sesión... (intento ${i + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error("Error al verificar sesión:", error);
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  console.warn("⚠️ No se pudo establecer sesión después de múltiples intentos");
  return false;
};

/**
 * Sube la foto de perfil a Supabase Storage y actualiza el usuario
 */
export const uploadProfilePicture = async (
  userId: string,
  imageUri: string,
  waitForSession: boolean = false
): Promise<ProfilePictureResult> => {
  try {
    // Si waitForSession es true, esperar a que la sesión esté establecida
    if (waitForSession) {
      console.log("⏳ Esperando a que la sesión esté establecida...");
      const sessionReady = await ensureSession();
      if (!sessionReady) {
        console.warn(
          "⚠️ Continuando sin sesión establecida, puede fallar por RLS"
        );
      }
    }

    // Verificar sesión actual
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      console.warn("⚠️ No hay sesión activa, la subida puede fallar por RLS");
    } else {
      console.log("✅ Sesión activa encontrada:", session.user.id);
    }

    // Convertir a JPG primero
    console.log("🔄 Convirtiendo avatar a JPG...");
    const jpgUri = await convertToJPG(imageUri);
    console.log("✅ Avatar convertido a JPG");

    // Convertir URI a ArrayBuffer
    const arrayBuffer = await uriToArrayBuffer(jpgUri);

    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error("El archivo está vacío");
    }

    console.log(`✅ ArrayBuffer validado: ${arrayBuffer.byteLength} bytes`);

    // Siempre usar .jpg ya que convertimos a JPEG
    const fileName = `${userId}/avatar.jpg`;

    console.log(`📤 Subiendo avatar a: ${fileName}`);

    // Subir a Storage usando ArrayBuffer
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, arrayBuffer, {
        cacheControl: "3600",
        upsert: true,
        contentType: "image/jpeg",
      });

    if (uploadError) {
      console.error("Error al subir imagen:", uploadError);

      // Si el error es de RLS y no hay sesión, intentar esperar y reintentar
      if (
        uploadError.message?.includes("row-level security") &&
        !session &&
        !waitForSession
      ) {
        console.log(
          "🔄 Error de RLS detectado, reintentando con espera de sesión..."
        );
        return uploadProfilePicture(userId, imageUri, true);
      }

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
