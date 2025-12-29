import { supabase } from "./supabaseClient";

export interface Promocion {
  id: string;
  titulo: string;
  descripcion: string | null;
  codigo_cupon: string | null;
  imagen_url: string | null;
  imagen_mobile_url: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  publico_objetivo: "general" | "clientes" | "prestadores" | "categoria_prestadores";
  categoria_id: number | null;
  servicio_id: number | null;
  estado: "borrador" | "activa" | "pausada" | "finalizada" | "cancelada";
  activa: boolean;
  orden_display: number;
  empresa_nombre: string | null;
  empresa_contacto: string | null;
  whatsapp: string | null;
  latitud: number | null;
  longitud: number | null;
  radio_cobertura_km: number | null;
}

export const getPromocionesActivas = async (
  tipoUsuario: "cliente" | "prestador" | "ambos" | null = null
): Promise<Promocion[]> => {
  try {
    const now = new Date().toISOString();

    // Construir la query base
    let query = supabase
      .from("promociones")
      .select("*")
      .eq("activa", true)
      .eq("estado", "activa")
      .lte("fecha_inicio", now)
      .gte("fecha_fin", now);

    // Si se especifica el tipo de usuario, filtrar por público objetivo
    if (tipoUsuario) {
      if (tipoUsuario === "cliente") {
        query = query.in("publico_objetivo", ["general", "clientes"]);
      } else if (tipoUsuario === "prestador") {
        query = query.in("publico_objetivo", [
          "general",
          "prestadores",
          "categoria_prestadores",
        ]);
      }
      // Si es "ambos", mostrar todas las promociones generales
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error al obtener promociones:", error);
      throw error;
    }

    // Ordenar resultados: primero por orden_display, luego por fecha_creacion descendente
    const promociones = (data || []) as Promocion[];
    promociones.sort((a, b) => {
      // Primero ordenar por orden_display (ascendente)
      if (a.orden_display !== b.orden_display) {
        return a.orden_display - b.orden_display;
      }
      // Si tienen el mismo orden_display, ordenar por fecha_creacion (descendente)
      const fechaA = new Date(a.fecha_inicio).getTime();
      const fechaB = new Date(b.fecha_inicio).getTime();
      return fechaB - fechaA;
    });

    return promociones;
  } catch (error) {
    console.error("Error en getPromocionesActivas:", error);
    throw error;
  }
};

export const registrarVistaPromocion = async (promocionId: string): Promise<void> => {
  try {
    console.log("📊 Registrando vista de promoción:", promocionId);
    const { data, error } = await supabase.rpc("incrementar_vista_promocion", {
      p_promocion_id: promocionId,
    });

    if (error) {
      console.error("❌ Error al registrar vista de promoción:", error);
      console.error("Código de error:", error.code);
      console.error("Mensaje:", error.message);
      console.error("Detalles:", JSON.stringify(error, null, 2));
      
      if (
        error.code === "PGRST202" ||
        error.message?.includes("Could not find the function")
      ) {
        console.error(
          "⚠️ Función incrementar_vista_promocion no encontrada. Ejecuta scripts/funciones_rpc_promociones.sql en Supabase SQL Editor"
        );
      }
    } else {
      console.log("✅ Vista registrada exitosamente");
    }
  } catch (error) {
    console.error("❌ Excepción en registrarVistaPromocion:", error);
  }
};

export const registrarClickPromocion = async (promocionId: string): Promise<void> => {
  try {
    console.log("🖱️ Registrando click de promoción:", promocionId);
    const { data, error } = await supabase.rpc("incrementar_click_promocion", {
      p_promocion_id: promocionId,
    });

    if (error) {
      console.error("❌ Error al registrar click de promoción:", error);
      console.error("Código de error:", error.code);
      console.error("Mensaje:", error.message);
      console.error("Detalles:", JSON.stringify(error, null, 2));
      
      if (
        error.code === "PGRST202" ||
        error.message?.includes("Could not find the function")
      ) {
        console.error(
          "⚠️ Función incrementar_click_promocion no encontrada. Ejecuta scripts/funciones_rpc_promociones.sql en Supabase SQL Editor"
        );
      }
    } else {
      console.log("✅ Click registrado exitosamente");
    }
  } catch (error) {
    console.error("❌ Excepción en registrarClickPromocion:", error);
  }
};

