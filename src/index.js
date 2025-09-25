import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import RegistroUsuario from "./RegistroUsuario";

function Main() {
  const [registrado, setRegistrado] = useState(false);
  const [usuario, setUsuario] = useState(localStorage.getItem("usuario") || "");

  if (!registrado && !usuario) {
    return <RegistroUsuario onRegistrado={(nombre) => {
      localStorage.setItem("usuario", nombre);
      setUsuario(nombre);
      setRegistrado(true);
    }} />;
  }

  return <App />;
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Main />);
