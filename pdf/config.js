const path = require("path");

const logoPath = path.join(__dirname, "../public/logo.png");

const colores = {
  encabezado: "#0F4C81",
  titulo: "#1F2937",

  correctivo: "#FEE2E2",
  preventivo: "#DCFCE7",
  calibracion: "#FEF9C3",
  instalacion: "#DBEAFE",

  gris: "#F3F4F6",

  texto: "#111827"
};

const hospital = {
  nombre: "HOSPITAL XXXXXXX",
  sistema: "Sistema de Ingeniería Clínica"
};

module.exports = {
  logoPath,
  colores,
  hospital
};
