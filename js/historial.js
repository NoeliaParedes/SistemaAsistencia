// Inicializar la aplicación cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    cargarHistorial();
    
    // Configurar eventos
    document.getElementById('aplicarFiltros').addEventListener('click', aplicarFiltros);
    document.getElementById('exportarBtn').addEventListener('click', exportarCSV);
});

// Cargar historial de asistencias
function cargarHistorial(filtros = {}) {
    const asistencias = JSON.parse(localStorage.getItem('asistencias')) || [];
    const tabla = document.getElementById('tablaHistorial');
    
    // Aplicar filtros
    let asistenciasFiltradas = asistencias;
    
    if (filtros.curso) {
        asistenciasFiltradas = asistenciasFiltradas.filter(asist => 
            asist.curso === filtros.curso
        );
    }
    
    if (filtros.fecha) {
        asistenciasFiltradas = asistenciasFiltradas.filter(asist => 
            asist.fecha.split('T')[0] === filtros.fecha
        );
    }
    
    if (filtros.estudiante) {
        const termino = filtros.estudiante.toLowerCase();
        asistenciasFiltradas = asistenciasFiltradas.filter(asist => 
            asist.codigo.toLowerCase().includes(termino) ||
            asist.nombre.toLowerCase().includes(termino)
        );
    }
    
    // Ordenar por fecha (más reciente primero)
    asistenciasFiltradas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    if (asistenciasFiltradas.length === 0) {
        tabla.innerHTML = '<p>No hay registros de asistencia que coincidan con los filtros.</p>';
        return;
    }
    
    // Crear tabla
    tabla.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Curso</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
                ${asistenciasFiltradas.map(asist => {
                    const fecha = new Date(asist.fecha);
                    const fechaStr = fecha.toLocaleDateString('es-ES');
                    const horaStr = fecha.toLocaleTimeString('es-ES', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    });
                    
                    return `
                        <tr>
                            <td>${fechaStr}</td>
                            <td>${horaStr}</td>
                            <td>${asist.codigo}</td>
                            <td>${asist.nombre}</td>
                            <td>${asist.curso}</td>
                            <td class="estado-presente">Presente</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

// Aplicar filtros
function aplicarFiltros() {
    const filtros = {
        curso: document.getElementById('filtroCurso').value,
        fecha: document.getElementById('filtroFecha').value,
        estudiante: document.getElementById('filtroEstudiante').value
    };
    
    cargarHistorial(filtros);
}

// Exportar a CSV
function exportarCSV() {
    const asistencias = JSON.parse(localStorage.getItem('asistencias')) || [];
    
    if (asistencias.length === 0) {
        alert('No hay datos para exportar.');
        return;
    }
    
    // Crear contenido CSV
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Fecha,Hora,Código,Nombre,Curso,Estado\n";
    
    asistencias.forEach(asist => {
        const fecha = new Date(asist.fecha);
        const fechaStr = fecha.toLocaleDateString('es-ES');
        const horaStr = fecha.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        csvContent += `${fechaStr},${horaStr},${asist.codigo},${asist.nombre},${asist.curso},Presente\n`;
    });
    
    // Crear enlace de descarga
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "asistencia.csv");
    document.body.appendChild(link);
    
    // Descargar archivo
    link.click();
    document.body.removeChild(link);
}