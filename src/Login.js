// src/Login.js
import React, { useState } from "react";

function Login({ onLogin, onGoRegister }) {
  const [nombre, setNombre] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return alert("Debes ingresar un nombre");
    onLogin(nombre);
  };

  return (
    <div className="p-4 max-w-md mx-auto mt-20">
      <h1 className="text-2xl font-bold text-center mb-4">Login de Usuario</h1>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
        <input
          type="text"
          placeholder="Nombre de usuario"
          className="w-full p-2 border rounded"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded-xl">
          Ingresar
        </button>
        <button
          type="button"
          onClick={onGoRegister}
          className="bg-green-500 text-white p-2 rounded-xl"
        >
          Registrarse
        </button>
      </form>
    </div>
  );
}

export default Login;
