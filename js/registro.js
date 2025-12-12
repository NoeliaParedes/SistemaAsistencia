console.log('🔧 registro.js cargado - iniciando modelos...');
// Variables globales
let videoStream = null;
let capturedFaceDescriptor = null;

document.addEventListener('DOMContentLoaded', async function() {
    inicializarCamara();
    cargarEstudiantes();
    
    // Cargar modelos y VERIFICAR que se cargaron
    const modelosCargados = await cargarModelos();
    
    if (!modelosCargados) {
        alert('❌ No se pudieron cargar los modelos de IA. El sistema no funcionará correctamente.');
        return;
    }
    
    // Configurar eventos SOLO si los modelos se cargaron
    document.getElementById('capturarBtn').addEventListener('click', capturarRostro);
    document.getElementById('reiniciarBtn').addEventListener('click', reiniciarCaptura);
    document.getElementById('registroForm').addEventListener('submit', registrarEstudiante);
    
    console.log('✅ Sistema completamente inicializado y listo');
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

// Inicializar la cámara
async function inicializarCamara() {
    try {
        const video = document.getElementById('video');
        videoStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: 640, 
                height: 480,
                facingMode: 'user'
            } 
        });
        video.srcObject = videoStream;
    } catch (error) {
        console.error('Error accediendo a la cámara:', error);
        alert('No se pudo acceder a la cámara. Asegúrate de permitir el acceso a la cámara.');
    }
}

// Capturar rostro
async function capturarRostro() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    
    // Configurar canvas con las dimensiones del video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Dibujar el frame actual en el canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Detectar rostros
    const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();
    
    if (detections.length === 0) {
        alert('No se detectó ningún rostro. Por favor, intenta de nuevo.');
        return;
    }
    
    if (detections.length > 1) {
        alert('Se detectó más de un rostro. Por favor, asegúrate de que solo haya una persona en la cámara.');
        return;
    }
    
    // Guardar el descriptor facial
    capturedFaceDescriptor = detections[0].descriptor;
    
    // Mostrar preview de la captura
    const preview = document.getElementById('capturaPreview');
    preview.innerHTML = `
        <p>Rostro capturado correctamente</p>
        <img src="${canvas.toDataURL()}" alt="Captura facial">
    `;
    
    alert('Rostro capturado correctamente. Ahora puedes registrar al estudiante.');
}

// Reiniciar captura
function reiniciarCaptura() {
    capturedFaceDescriptor = null;
    document.getElementById('capturaPreview').innerHTML = '';
}

// Registrar estudiante
function registrarEstudiante(event) {
    event.preventDefault();
    
    if (!capturedFaceDescriptor) {
        alert('Por favor, captura el rostro del estudiante antes de registrarlo.');
        return;
    }
    
    const codigo = document.getElementById('codigo').value;
    const nombre = document.getElementById('nombre').value;
    const email = document.getElementById('email').value;
    const curso = document.getElementById('curso').value;
    
    // Verificar si el código ya existe
    const estudiantes = JSON.parse(localStorage.getItem('estudiantes'));
    if (estudiantes.some(est => est.codigo === codigo)) {
        alert('Ya existe un estudiante con ese código.');
        return;
    }
    
    // Crear nuevo estudiante
    const nuevoEstudiante = {
        codigo,
        nombre,
        email,
        curso,
        descriptorFacial: Array.from(capturedFaceDescriptor), // Convertir Float32Array a Array normal
        fechaRegistro: new Date().toISOString()
    };
    
    // Guardar en localStorage
    estudiantes.push(nuevoEstudiante);
    localStorage.setItem('estudiantes', JSON.stringify(estudiantes));
    
    alert(`Estudiante ${nombre} registrado correctamente.`);
    
    // Limpiar formulario
    document.getElementById('registroForm').reset();
    reiniciarCaptura();
    
    // Actualizar lista de estudiantes
    cargarEstudiantes();
}

// Cargar lista de estudiantes
function cargarEstudiantes() {
    const estudiantes = JSON.parse(localStorage.getItem('estudiantes'));
    const lista = document.getElementById('listaEstudiantes');
    
    if (estudiantes.length === 0) {
        lista.innerHTML = '<p>No hay estudiantes registrados.</p>';
        return;
    }
    
    lista.innerHTML = estudiantes.map(est => `
        <div class="estudiante-item">
            <div class="estudiante-info">
                <div class="estudiante-codigo">${est.codigo} - ${est.nombre}</div>
                <div class="estudiante-curso">${est.curso} | ${est.email}</div>
            </div>
            <button onclick="eliminarEstudiante('${est.codigo}')" class="btn-secondary">Eliminar</button>
        </div>
    `).join('');
}

// Eliminar estudiante
function eliminarEstudiante(codigo) {
    if (confirm('¿Estás seguro de que quieres eliminar este estudiante?')) {
        let estudiantes = JSON.parse(localStorage.getItem('estudiantes'));
        estudiantes = estudiantes.filter(est => est.codigo !== codigo);
        localStorage.setItem('estudiantes', JSON.stringify(estudiantes));
        cargarEstudiantes();
    }
}