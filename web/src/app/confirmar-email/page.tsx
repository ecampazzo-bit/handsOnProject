"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";

type VerificationStatus = "loading" | "success" | "error" | "idle";

function ConfirmarEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [message, setMessage] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Extraer parámetros de la URL (tanto query params como hash)
        // Supabase puede enviar los parámetros en el hash (#) o en query params (?)
        const hash = typeof window !== "undefined" ? window.location.hash : "";
        const hashParams = new URLSearchParams(hash.substring(1));
        
        const tokenHash = searchParams.get("token_hash") || hashParams.get("token_hash");
        const type = searchParams.get("type") || hashParams.get("type");
        const accessToken = searchParams.get("access_token") || hashParams.get("access_token");
        const refreshToken = searchParams.get("refresh_token") || hashParams.get("refresh_token");

        console.log("Parámetros de confirmación:", {
          tokenHash: tokenHash ? "presente" : "ausente",
          type,
          accessToken: accessToken ? "presente" : "ausente",
        });

        // Si hay access_token, Supabase ya procesó la confirmación
        if (accessToken && refreshToken) {
          console.log("Estableciendo sesión con tokens...");
          
          const { data: { session }, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error("Error al establecer sesión:", sessionError);
            setStatus("error");
            setMessage(
              `No se pudo verificar tu email: ${sessionError.message}. El enlace puede haber expirado. Por favor, solicita un nuevo enlace de verificación.`
            );
            return;
          }

          if (session?.user) {
            setUserEmail(session.user.email || null);
            setStatus("success");
            setMessage("Tu email ha sido verificado correctamente.");
            return;
          }
        }

        // Si hay token_hash, verificar con verifyOtp
        if (tokenHash && type === "email") {
          console.log("Verificando email con token_hash...");

          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "email",
          });

          if (error) {
            console.error("Error al verificar email:", error);
            setStatus("error");
            setMessage(
              `No se pudo verificar tu email: ${error.message}. El enlace puede haber expirado. Por favor, solicita un nuevo enlace de verificación.`
            );
            return;
          }

          if (data?.user) {
            setUserEmail(data.user.email || null);
            setStatus("success");
            setMessage("Tu email ha sido verificado correctamente.");
            return;
          }
        }

        // Si no hay parámetros válidos
        if (!tokenHash && !accessToken) {
          setStatus("error");
          setMessage(
            "No se encontraron parámetros de verificación en la URL. Por favor, usa el enlace completo que recibiste por email."
          );
          return;
        }
      } catch (error: any) {
        console.error("Error al procesar verificación:", error);
        setStatus("error");
        setMessage(
          `Hubo un problema al procesar la verificación: ${error.message || "Error desconocido"}. Por favor, intenta nuevamente.`
        );
      }
    };

    verifyEmail();
  }, [searchParams]);

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
            Confirmación de Email
          </h1>
        </div>

        {status === "loading" && (
          <div className="space-y-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
            <p className="text-center text-gray-600">
              Verificando tu email...
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <svg
                  className="w-12 h-12 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="font-semibold text-center text-lg">
                ¡Email verificado!
              </p>
              <p className="text-sm mt-2 text-center">
                {message}
              </p>
              {userEmail && (
                <p className="text-sm mt-2 text-center">
                  Email verificado: <strong>{userEmail}</strong>
                </p>
              )}
            </div>
            <div className="space-y-3">
              <Link
                href="/"
                className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Ir al inicio
              </Link>
              <Link
                href="/admin/login"
                className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <svg
                  className="w-12 h-12 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="font-semibold text-center text-lg">Error</p>
              <p className="text-sm mt-2 text-center">{message}</p>
            </div>
            <div className="space-y-3">
              <Link
                href="/recuperar-contrasena"
                className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Solicitar nuevo enlace
              </Link>
              <Link
                href="/"
                className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Volver al inicio
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConfirmarEmail() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
            <p className="text-center text-gray-600 mt-4">Cargando...</p>
          </div>
        </div>
      }
    >
      <ConfirmarEmailContent />
    </Suspense>
  );
}
