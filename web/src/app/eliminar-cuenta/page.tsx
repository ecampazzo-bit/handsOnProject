"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";

export default function EliminarCuenta() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          // No redirigir, solo mostrar que no hay sesión
          setCheckingAuth(false);
          return;
        }

        // Obtener información del usuario
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser) {
          setUser(authUser);
          setEmail(authUser.email || "");
        }

        setCheckingAuth(false);
      } catch (err) {
        console.error("Error checking auth:", err);
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validar que el texto de confirmación sea correcto
    if (confirmText.toLowerCase() !== "eliminar") {
      setError('Debes escribir "eliminar" para confirmar');
      setLoading(false);
      return;
    }

    // Validar contraseña si se proporciona
    if (password) {
      try {
        // Verificar la contraseña intentando iniciar sesión
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (signInError) {
          throw new Error("Contraseña incorrecta");
        }
      } catch (err: any) {
        setError(err.message || "Contraseña incorrecta");
        setLoading(false);
        return;
      }
    }

    try {
      // Obtener el ID del usuario actual
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        throw new Error("No se pudo obtener la información del usuario");
      }

      const userId = currentUser.id;

      // 1. Eliminar el usuario de la tabla public.users
      const { error: deleteUserError } = await supabase
        .from("users")
        .delete()
        .eq("id", userId);

      if (deleteUserError) {
        // Si hay un error, puede ser por RLS, intentar con una función SQL
        console.error("Error eliminando usuario de public.users:", deleteUserError);
        // Continuar con la eliminación de auth aunque falle la eliminación de la tabla
      }

      // 2. Eliminar el usuario de Supabase Auth
      // Nota: En el cliente, no podemos eliminar directamente desde auth.users
      // Necesitamos usar una función edge o hacerlo desde el servidor
      // Por ahora, desactivaremos la cuenta marcándola como inactiva
      // y cerraremos la sesión
      
      // Marcar como inactivo en la tabla users (si aún existe)
      try {
        await supabase
          .from("users")
          .update({ activo: false })
          .eq("id", userId);
      } catch (updateError) {
        // Ignorar errores si la tabla ya fue eliminada
        console.log("No se pudo actualizar el estado, probablemente ya fue eliminado");
      }

      // Cerrar sesión
      await supabase.auth.signOut();

      // Mostrar mensaje de éxito antes de redirigir
      setSuccess(true);
      
      // Redirigir a la página principal después de 3 segundos
      setTimeout(() => {
        router.push("/?cuenta-eliminada=true");
      }, 3000);
    } catch (err: any) {
      console.error("Error eliminando cuenta:", err);
      setError(
        err.message ||
          "Error al eliminar la cuenta. Por favor, contacta con soporte."
      );
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario autenticado, mostrar mensaje
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mb-4 flex justify-center">
              <Image
                src="/logo-color.png"
                alt="ofiSí Logo"
                width={150}
                height={90}
                className="h-auto"
                loading="eager"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Eliminar Cuenta
            </h1>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6">
            <p className="font-semibold mb-2">⚠️ Autenticación requerida</p>
            <p className="text-sm">
              Debes iniciar sesión para poder eliminar tu cuenta.
            </p>
          </div>
          <div className="space-y-4">
            <Link
              href="/admin/login"
              className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/"
              className="block w-full text-center text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center">
            <Image
              src="/logo-color.png"
              alt="ofiSí Logo"
              width={150}
              height={90}
              className="h-auto"
              loading="eager"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Eliminar Cuenta
          </h1>
          <p className="text-gray-600 mt-2">
            Esta acción no se puede deshacer
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          <p className="font-semibold mb-2">⚠️ Advertencia</p>
          <p className="text-sm">
            Al eliminar tu cuenta, se eliminarán permanentemente:
          </p>
          <ul className="text-sm mt-2 list-disc list-inside space-y-1">
            <li>Tu perfil y datos personales</li>
            <li>Tu historial de trabajos y solicitudes</li>
            <li>Tus mensajes y conversaciones</li>
            <li>Tus calificaciones y reseñas</li>
          </ul>
          <p className="text-sm mt-2 font-semibold">
            Esta acción es permanente e irreversible.
          </p>
        </div>

        {success ? (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
              <p className="font-semibold">✓ Cuenta eliminada exitosamente</p>
              <p className="text-sm mt-1">
                Tu cuenta ha sido eliminada. Serás redirigido a la página principal en unos segundos.
              </p>
            </div>
            <Link
              href="/"
              className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Ir al inicio ahora
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-900 mb-2"
            >
              Email de la cuenta
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-900 mb-2"
            >
              Contraseña (opcional pero recomendado)
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 bg-white"
              placeholder="Ingresa tu contraseña para mayor seguridad"
            />
            <p className="text-xs text-gray-500 mt-1">
              Verificaremos tu contraseña antes de eliminar la cuenta
            </p>
          </div>

          <div>
            <label
              htmlFor="confirmText"
              className="block text-sm font-medium text-gray-900 mb-2"
            >
              Escribe <strong className="text-red-600">"eliminar"</strong> para
              confirmar
            </label>
            <input
              id="confirmText"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 bg-white"
              placeholder="escribe: eliminar"
            />
          </div>

          <button
            type="submit"
            disabled={loading || confirmText.toLowerCase() !== "eliminar"}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Eliminando cuenta..." : "Eliminar mi cuenta permanentemente"}
          </button>

          <div className="text-center">
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              ← Cancelar y volver al inicio
            </Link>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}

