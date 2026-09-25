import { normalizarTextoProtocolo } from "./ProtocoloBase";

export const PROTOCOLOS_MANTENIMIENTO = [
  {
    codigo: "RIC29",
    tipo: "preventivo",
    vista: "ric29",
    descripciones: ["cardiodesfibrilador"]
  },
  {
    codigo: "RIC39",
    tipo: "preventivo",
    vista: "ric39",
    descripciones: ["monitor multiparametrico"]
  },
  {
    codigo: "RIC48",
    tipo: "preventivo",
    vista: "ric48",
    descripciones: ["electrocardiografo"]
  },
  {
    codigo: "RIC56",
    tipo: "preventivo",
    vista: "ric56",
    descripciones: [
      "equipo de rx movil",
      "equipo rx movil",
      "rx movil",
      "rayos x movil",
      "equipo de rayos x movil",
      "equipo rayos x movil",
      "rx portatil",
      "rayos x portatil"
    ]
  },
  {
    codigo: "RIC64",
    tipo: "preventivo",
    vista: "ric64",
    descripciones: ["bano termostatico"]
  }
];

export function obtenerProtocoloMantenimiento(tipo, descripcionEquipo) {
  const tipoNormalizado = normalizarTextoProtocolo(tipo);
  const descripcionNormalizada = normalizarTextoProtocolo(descripcionEquipo);

  return PROTOCOLOS_MANTENIMIENTO.find((protocolo) => {
    if (normalizarTextoProtocolo(protocolo.tipo) !== tipoNormalizado) return false;
    return protocolo.descripciones.some((descripcion) =>
      descripcionNormalizada.includes(normalizarTextoProtocolo(descripcion))
    );
  }) || null;
}
