import React, { useState } from "react";
import { toast } from "react-toastify";

export default function LoginPersonal({ onLogin, switchToRegister }) {
  const [mail, setMail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); // 🔹 estado de carga

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); // 🔹 activar spinner
    try {
      const res = await fetch("https://sky26.onrender.com/personal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mail, password }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Bienvenido ${data.nombre} ✅`);
        onLogin(data);
      } else {
        toast.error("Correo o contraseña incorrectos ❌");
      }
    } catch {
      toast.error("Error de conexión ❌");
    } finally {
      setLoading(false); // 🔹 desactivar spinner
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto mt-20 relative">
      {/* Overlay de carga */}
      {loading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <img
        src="/logosmall.png"
        alt="Logo"
        className="mx-auto mb-4 w-24 h-auto"
      />
      <h1 className="text-2xl font-bold text-center mb-4">🔑 Login de Personal</h1>
      <form onSubmit={handleLogin} className="flex flex-col space-y-3">
        <input
          type="email"
          placeholder="Correo"
          className="w-full p-2 border rounded"
          value={mail}
          onChange={(e) => setMail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Contraseña"
          className="w-full p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded-xl"
          disabled={loading} // 🔹 deshabilitar mientras carga
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      <p className="text-center mt-4 text-sm">
        ¿No tienes cuenta?{" "}
        <button
          className="text-green-600 underline"
          onClick={switchToRegister}
        >
          Registrarse
        </button>
      </p>
    </div>
  );
}