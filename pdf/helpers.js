function formatFecha(fecha) {

    if (!fecha)
        return "-";

    const d = new Date(fecha);

    return d.toLocaleString("es-AR", {

        day: "2-digit",
        month: "2-digit",
        year: "numeric",

        hour: "2-digit",
        minute: "2-digit"

    });

}

function colorMantenimiento(tipo) {

    if (!tipo)
        return "#F3F4F6";

    switch (tipo.toLowerCase()) {

        case "correctivo":
            return "#FEE2E2";

        case "preventivo":
            return "#DCFCE7";

        case "verificacion":
        case "verificacion":
            return "#FEF9C3";

        case "instalación":
        case "instalacion":
            return "#DBEAFE";

        default:
            return "#F3F4F6";

    }

}

function iconoFinalizado(fin){

    return fin ? "✅" : "🟡";

}

module.exports = {

    formatFecha,
    colorMantenimiento,
    iconoFinalizado

};
