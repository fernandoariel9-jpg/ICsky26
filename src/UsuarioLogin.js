import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

export default function UsuarioLogin({ onLogin, switchToRegister }) {
  const [mail, setMail] = useState("");
  const [password, setPassword] = useState("");
  const [recordar, setRecordar] = useState(false);

  // Cargar mail y password guardados
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

  // Manejar cambio de la casilla "Recordar usuario"
  const handleRecordarChange = (checked) => {
    setRecordar(checked);
    if (!checked) {
      localStorage.removeItem("usuarioRecordado");
      sessionStorage.removeItem("passwordRecordado");
      setPassword(""); // Limpiar la contraseña en el formulario
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
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
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto mt-20">
      <img
        src="/logosmall.png"
        alt="Logo"
        className="mx-auto mb-4 w-24 h-auto"
      />
      <h1 className="text-2xl font-bold text-center mb-4">🔑 Login de Usuario</h1>

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
