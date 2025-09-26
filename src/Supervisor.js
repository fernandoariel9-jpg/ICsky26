// Supervisor.js
import React, { useState } from "react";
import PanelPendientes from "./PanelPendientes";

export default function SupervisionWrapper() {
  const [auth, setAuth] = useState(false);
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (password === "admin123") {
      setAuth(true);
    } else {
      alert("Contraseña incorrecta ❌");
    }
  };

  if (!auth) {
    return (
      <div className="p-4 max-w-md mx-auto mt-10 bg-gray-100 rounded-xl">
        <h2 className="text-xl font-bold mb-2">🔐 Panel de Supervisor</h2>
        <input
          type="password"
          placeholder="Contraseña"
          className="w-full p-2 border rounded mb-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          onClick={handleLogin}
          className="bg-purple-500 text-white px-3 py-2 rounded-xl w-full"
        >
          Acceder
        </button>
      </div>
    );
  }

  return <PanelPendientes />;
}
