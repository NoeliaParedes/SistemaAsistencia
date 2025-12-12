// Código JavaScript para la página principal
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sistema de Asistencia cargado correctamente');
    
    // Verificar si hay datos en localStorage
    if (!localStorage.getItem('estudiantes')) {
        localStorage.setItem('estudiantes', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('asistencias')) {
        localStorage.setItem('asistencias', JSON.stringify([]));
    }
});