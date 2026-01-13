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
      // Verificar que el usuario esté autenticado
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        throw new Error("No se pudo obtener la información del usuario");
      }

      // Llamar a la función RPC que crea la solicitud de eliminación
      const { data, error: rpcError } = await supabase.rpc('solicitar_eliminacion_cuenta', {
        p_motivo: null
      });

      if (rpcError) {
        console.error("Error en función RPC solicitar_eliminacion_cuenta:", rpcError);
        throw new Error(rpcError.message || "Error al solicitar la eliminación de la cuenta");
      }

      // Verificar la respuesta de la función RPC
      if (!data || !data.success) {
        const errorMessage = data?.error || "Error al solicitar la eliminación de la cuenta";
        throw new Error(errorMessage);
      }

      // No cerramos la sesión, el usuario puede seguir usando la cuenta hasta la fecha de eliminación
      // Mostrar mensaje de éxito antes de redirigir
      setSuccess(true);
      
      // Redirigir a la página principal después de 3 segundos
      setTimeout(() => {
        router.push("/?solicitud-eliminacion-enviada=true");
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
              href="/eliminar-cuenta/login"
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
          <p className="font-semibold mb-2">⚠️ Información importante sobre la eliminación de cuenta</p>
          <p className="text-sm mb-2">
            Al solicitar la eliminación de tu cuenta:
          </p>
          <ul className="text-sm mt-2 list-disc list-inside space-y-1 mb-3">
            <li>Tu solicitud será enviada al equipo de administración</li>
            <li>La eliminación se procesará en <strong>60 días</strong> desde la fecha de solicitud</li>
            <li>Durante este período puedes cancelar tu solicitud si cambias de opinión</li>
            <li>Después de 60 días se eliminarán permanentemente: tu perfil, historial de trabajos, mensajes, calificaciones y todos los datos relacionados</li>
          </ul>
          <p className="text-sm mt-2 font-semibold bg-yellow-100 p-2 rounded">
            ⏰ Período de gracia: La eliminación se procesará 60 días después de tu solicitud por cuestiones legales y de seguridad. Puedes cancelar la solicitud antes de esta fecha desde tu perfil.
          </p>
          <p className="text-sm mt-2">
            Esta acción, una vez procesada, es permanente e irreversible.
          </p>
        </div>

        {success ? (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg">
              <p className="font-semibold">✓ Solicitud de eliminación enviada</p>
              <p className="text-sm mt-2">
                Tu solicitud de eliminación de cuenta ha sido enviada al equipo de administración.
              </p>
              <p className="text-sm mt-2">
                <strong>Fecha programada de eliminación:</strong> 60 días a partir de ahora.
              </p>
              <p className="text-sm mt-2">
                Recibirás un correo electrónico de confirmación y podrás cancelar tu solicitud antes de la fecha programada.
              </p>
            </div>
            <Link
              href="/"
              className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Continuar al inicio
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
              Verificaremos tu contraseña antes de enviar la solicitud de eliminación
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
            {loading ? "Enviando solicitud..." : "Solicitar eliminación de cuenta"}
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

