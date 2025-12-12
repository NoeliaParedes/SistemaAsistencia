// Inicializar la cámara - misma función que en registro.js
async function inicializarCamara() {
    try {
        const video = document.getElementById('videoAsistencia');
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: 640, 
                height: 480,
                facingMode: 'user'
            } 
        });
        video.srcObject = stream;
        console.log('✅ Cámara inicializada para asistencia');
    } catch (error) {
        console.error('❌ Error accediendo a la cámara:', error);
        alert('No se pudo acceder a la cámara. Asegúrate de permitir el acceso.');
    }
}
// AGREGAR ESTA FUNCIÓN NUEVA
function verificarElementos() {
    console.log('🔍 Verificando elementos HTML...');
    
    const elementosRequeridos = [
        'videoAsistencia',      // El video de la cámara
        'cursoAsistencia',      // El selector de curso
        'iniciarAsistencia',    // Botón iniciar
        'detenerAsistencia',    // Botón detener
        'detectionInfo',        // Área de información
        'listaAsistencia'       // Lista de asistencias
    ];
    
    elementosRequeridos.forEach(id => {
        const elemento = document.getElementById(id);
        if (!elemento) {
            console.error(`❌ Elemento faltante: #${id}`);
        } else {
            console.log(`✅ Elemento encontrado: #${id}`);
        }
    });
    
    console.log('🔍 Verificación de elementos completada');
}


// Variables globales
let videoStreamAsistencia = null;
let intervaloDeteccion = null;
let estudiantesRegistrados = [];
let asistenciasHoy = [];

// Inicializar la aplicación cuando se carga la página
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔧 asistencia.js cargado - iniciando...');
    
    // PASO 4: Verificar elementos PRIMERO
    verificarElementos();
    
    // Inicializar cámara
    await inicializarCamara();
    cargarEstudiantes();
    cargarAsistenciasHoy();
    
    // Cargar modelos de face-api.js
    await cargarModelos();
    
    // Configurar eventos SOLO si los elementos existen
    const iniciarBtn = document.getElementById('iniciarAsistencia');
    const detenerBtn = document.getElementById('detenerAsistencia');
    const cursoSelect = document.getElementById('cursoAsistencia');
    
    if (iniciarBtn) {
        iniciarBtn.addEventListener('click', iniciarAsistencia);
        console.log('✅ Botón iniciar configurado');
    } else {
        console.error('❌ No se encontró el botón iniciarAsistencia');
    }
    
    if (detenerBtn) {
        detenerBtn.addEventListener('click', detenerAsistencia);
        console.log('✅ Botón detener configurado');
    } else {
        console.error('❌ No se encontró el botón detenerAsistencia');
    }
    
    if (cursoSelect) {
        cursoSelect.addEventListener('change', actualizarListaAsistencia);
        console.log('✅ Selector de curso configurado');
    } else {
        console.error('❌ No se encontró el selector cursoAsistencia');
    }
    
    console.log('✅ Sistema de asistencia completamente inicializado');
});

async function cargarModelos() {
    try {
        console.log('🔄 Cargando modelos desde CDN actualizado...');
        
        // Usar CDN ACTUALIZADO - @vladmandic/face-api
        const cdnPath = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.14/model/';
        
        console.log('📦 Cargando TinyFaceDetector...');
        await faceapi.nets.tinyFaceDetector.loadFromUri(cdnPath);
        console.log('✅ TinyFaceDetector cargado');
        
        console.log('📦 Cargando FaceLandmark68...');
        await faceapi.nets.faceLandmark68Net.loadFromUri(cdnPath);
        console.log('✅ FaceLandmark68 cargado');
        
        console.log('📦 Cargando FaceRecognition...');
        await faceapi.nets.faceRecognitionNet.loadFromUri(cdnPath);
        console.log('✅ FaceRecognition cargado');
        
        console.log('🎉 TODOS los modelos cargados correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error cargando modelos:', error);
        alert('Error cargando modelos. Recarga la página o verifica tu conexión.');
        return false;
    }
}

// Cargar estudiantes desde localStorage
function cargarEstudiantes() {
    estudiantesRegistrados = JSON.parse(localStorage.getItem('estudiantes')) || [];
}

// Cargar asistencias del día actual
function cargarAsistenciasHoy() {
    const asistencias = JSON.parse(localStorage.getItem('asistencias')) || [];
    const hoy = new Date().toISOString().split('T')[0]; // Fecha en formato YYYY-MM-DD
    
    asistenciasHoy = asistencias.filter(asist => 
        asist.fecha.split('T')[0] === hoy
    );
    
    actualizarListaAsistencia();
}

// Iniciar toma de asistencia
async function iniciarAsistencia() {
    const curso = document.getElementById('cursoAsistencia').value;
    
    if (!curso) {
        alert('Por favor, selecciona un curso antes de iniciar la asistencia.');
        return;
    }
    
    try {
        const video = document.getElementById('videoAsistencia');
        videoStreamAsistencia = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: 640, 
                height: 480,
                facingMode: 'user'
            } 
        });
        video.srcObject = videoStreamAsistencia;
        
        // Habilitar/deshabilitar botones
        document.getElementById('iniciarAsistencia').disabled = true;
        document.getElementById('detenerAsistencia').disabled = false;
        
        // Iniciar detección cada 2 segundos
        intervaloDeteccion = setInterval(detectarYReconocer, 2000);
        
        document.getElementById('detectionInfo').innerHTML = '<p class="estado-presente">Detección facial activa. Buscando rostros...</p>';
        
    } catch (error) {
        console.error('Error accediendo a la cámara:', error);
        alert('No se pudo acceder a la cámara. Asegúrate de permitir el acceso a la cámara.');
    }
}

// Detener toma de asistencia
function detenerAsistencia() {
    if (videoStreamAsistencia) {
        videoStreamAsistencia.getTracks().forEach(track => track.stop());
        videoStreamAsistencia = null;
    }
    
    if (intervaloDeteccion) {
        clearInterval(intervaloDeteccion);
        intervaloDeteccion = null;
    }
    
    // Habilitar/deshabilitar botones
    document.getElementById('iniciarAsistencia').disabled = false;
    document.getElementById('detenerAsistencia').disabled = true;
    
    document.getElementById('detectionInfo').innerHTML = '<p>Detección facial detenida.</p>';
}

// Detectar y reconocer rostros
async function detectarYReconocer() {
    const video = document.getElementById('videoAsistencia');
    const curso = document.getElementById('cursoAsistencia').value;
    
    // Detectar rostros
    const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();
    
    if (detections.length === 0) {
        document.getElementById('detectionInfo').innerHTML = '<p>No se detectaron rostros.</p>';
        return;
    }
    
    document.getElementById('detectionInfo').innerHTML = `<p>Se detectaron ${detections.length} rostro(s).</p>`;
    
    // Para cada rostro detectado, intentar reconocerlo
    for (const detection of detections) {
        const descriptor = detection.descriptor;
        
        // Buscar el estudiante más similar
        let mejorEstudiante = null;
        let mejorDistancia = Infinity;
        
        for (const estudiante of estudiantesRegistrados) {
            // Solo considerar estudiantes del curso seleccionado
            if (estudiante.curso !== curso) continue;
            
            const descriptorRegistrado = new Float32Array(estudiante.descriptorFacial);
            const distancia = faceapi.euclideanDistance(descriptor, descriptorRegistrado);
            
            // Umbral de reconocimiento (ajustable)
            if (distancia < 0.6 && distancia < mejorDistancia) {
                mejorDistancia = distancia;
                mejorEstudiante = estudiante;
            }
        }
        
        if (mejorEstudiante) {
            // Registrar asistencia si no está ya registrada hoy
            const yaRegistrado = asistenciasHoy.some(asist => 
                asist.codigo === mejorEstudiante.codigo
            );
            
            if (!yaRegistrado) {
                registrarAsistencia(mejorEstudiante);
                document.getElementById('detectionInfo').innerHTML += 
                    `<p class="estado-presente">✅ Asistencia registrada: ${mejorEstudiante.nombre}</p>`;
            } else {
                document.getElementById('detectionInfo').innerHTML += 
                    `<p>${mejorEstudiante.nombre} ya tiene asistencia registrada hoy.</p>`;
            }
        } else {
            document.getElementById('detectionInfo').innerHTML += '<p>Rostro no reconocido.</p>';
        }
    }
}

// Registrar asistencia
function registrarAsistencia(estudiante) {
    const nuevaAsistencia = {
        codigo: estudiante.codigo,
        nombre: estudiante.nombre,
        curso: estudiante.curso,
        fecha: new Date().toISOString(),
        tipo: 'presencial'
    };
    
    // Agregar a asistencias de hoy
    asistenciasHoy.push(nuevaAsistencia);
    
    // Guardar en localStorage
    const todasAsistencias = JSON.parse(localStorage.getItem('asistencias')) || [];
    todasAsistencias.push(nuevaAsistencia);
    localStorage.setItem('asistencias', JSON.stringify(todasAsistencias));
    
    // Actualizar lista
    actualizarListaAsistencia();
}

// Actualizar lista de asistencia
function actualizarListaAsistencia() {
    const curso = document.getElementById('cursoAsistencia').value;
    const lista = document.getElementById('listaAsistencia');
    
    // Filtrar por curso si está seleccionado
    let asistenciasMostrar = asistenciasHoy;
    if (curso) {
        asistenciasMostrar = asistenciasHoy.filter(asist => asist.curso === curso);
    }
    
    if (asistenciasMostrar.length === 0) {
        lista.innerHTML = '<p>No hay asistencias registradas para hoy.</p>';
        return;
    }
    
    // Ordenar por fecha (más reciente primero)
    asistenciasMostrar.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    lista.innerHTML = asistenciasMostrar.map(asist => {
        const fecha = new Date(asist.fecha);
        const hora = fecha.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        return `
            <div class="asistencia-item">
                <div class="asistencia-info">
                    <div class="asistencia-codigo">${asist.codigo} - ${asist.nombre}</div>
                    <div class="asistencia-fecha">${asist.curso} | ${hora}</div>
                </div>
                <span class="estado-presente">Presente</span>
            </div>
        `;
    }).join('');
}