import { API_URL } from "./config";
import ProtocoloChecklist from "./protocolos/ProtocoloChecklist";

const configRIC59 = {
  codigo: "RIC59",
  tituloCorto: "MP Ecógrafos",
  tituloEtapa: "1. Verificación funcional",
  defaultDescripcion: "ECOGRAFO",
  endpoint: API_URL.Ric59,
  nombreIdRespuesta: "ric59_id",
  borradorPrefijo: "preventivo:ric59",
  requiereEnUso: true,
  mensajeConforme: "Todos los puntos verificados se encuentran conformes o fueron indicados como no aplicables.",
  puntos: [
    "Limpieza exterior",
    "Teclado y trackball",
    "Plaquetas internas",
    "Coolers",
    "Rodamientos",
    "Filtros",
    "Transductores",
    "Movimientos verticales",
    "Configuración videoprinter",
    "Realización de backup",
    "Funcionamiento general"
  ]
};

export default function RIC59({ setVista, personal }) {
  return <ProtocoloChecklist config={configRIC59} setVista={setVista} personal={personal} />;
}
