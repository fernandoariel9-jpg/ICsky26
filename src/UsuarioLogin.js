import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

export default function UsuarioLogin({ onLogin, switchToRegister, switchToMenu }) {
  const [mail, setMail] = useState("");
  const [password, setPassword] = useState("");
  const [recordar, setRecordar] = useState(false);
  const [loading, setLoading] = useState(false); // 🔹 Spinner + overlay

  useEffect(() => {
    const savedMail = localStorage.getItem("usuarioRecordado");
    const savedPassword = sessionStorage.getItem("passwordRecordado");
    if (savedMail) {
      setMail(savedMail);
      setRecordar(true);
    }
    if (savedPassword) {
      setPassword(savedPassword);
    }
  }, []);

  const handleRecordarChange = (checked) => {
    setRecordar(checked);
    if (!checked) {
      localStorage.removeItem("usuarioRecordado");
      sessionStorage.removeItem("passwordRecordado");
      setPassword("");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); // 🔹 activar overlay

    try {
      const res = await fetch("https://sky26.onrender.com/usuarios/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mail, password }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Bienvenido ${data.nombre} ✅`);
        onLogin(data.nombre);

        if (recordar) {
          localStorage.setItem("usuarioRecordado", mail);
          sessionStorage.setItem("passwordRecordado", password);
        }
      } else {
        toast.error("Usuario o contraseña incorrectos ❌");
      }
    } catch {
      toast.error("Error de conexión ❌");
    } finally {
      setLoading(false); // 🔹 desactivar overlay
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto mt-20 relative">
      <img
        src="/logosmall.png"
        alt="Logo"
        className="mx-auto mb-4 w-24 h-auto"
      />
      <h1 className="text-2xl font-bold text-center mb-4">🔑 Ingreso de Usuario</h1>

      <form onSubmit={handleLogin} className="flex flex-col space-y-3">
        <input
          type="text"
          placeholder="Mail"
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

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={recordar}
            onChange={(e) => handleRecordarChange(e.target.checked)}
          />
          <span>Recordar usuario</span>
        </label>

        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded-xl"
        >
          Ingresar
        </button>
            {/* 🔹 Botón volver al menú */}
        <button
          type="button"
          onClick={switchToMenu}
          className="bg-gray-400 text-white p-2 rounded-xl mt-2"
        >
          Volver
        </button>
      </form>

      {/* 🔹 Overlay con spinner mientras carga */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}


