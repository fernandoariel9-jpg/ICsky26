import React, { useState } from "react";
import { toast } from "react-toastify";

export default function RecuperarPassword({ switchToLogin, switchToMenu }) {
  const [mail, setMail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRecuperar = async (e) => {
    e.preventDefault();
    if (!mail.trim()) {
      toast.error("Por favor, ingresa tu correo electrónico 📧");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("https://sky26.onrender.com/usuarios/recuperar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mail }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.mensaje || "Se ha enviado un enlace de recuperación ✅");
      } else {
        const err = await res.json();
        toast.error(err.error || "No se pudo procesar la solicitud ❌");
      }
    } catch {
      toast.error("Error de conexión con el servidor ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto mt-20 relative">
      <img
        src="/logosmall.png"
        alt="Logo"
        className="mx-auto mb-4 w-24 h-auto"
      />
      <h1 className="text-2xl font-bold text-center mb-4">🔄 Recuperar Contraseña</h1>
      <p className="text-center text-gray-600 mb-4">
        Ingresá tu correo electrónico para restablecer tu contraseña.
      </p>

      <form onSubmit={handleRecuperar} className="flex flex-col space-y-3">
        <input
          type="email"
          placeholder="Correo electrónico"
          className="w-full p-2 border rounded"
          value={mail}
          onChange={(e) => setMail(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white p-2 rounded-xl disabled:opacity-70"
        >
          Enviar enlace
        </button>

        {/* 🔹 Botones de navegación */}
        <button
          type="button"
          onClick={switchToLogin}
          className="text-blue-600 underline text-sm"
        >
          ← Volver al login
        </button>

        <button
          type="button"
          onClick={switchToMenu}
          className="bg-gray-400 text-white p-2 rounded-xl mt-2"
        >
          Volver al menú
        </button>
      </form>

      {/* 🔹 Overlay de carga */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
