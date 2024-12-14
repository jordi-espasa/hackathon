// static/script.js
document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById('webcam');
    const canvas = document.getElementById('canvas');
    const startBtn = document.getElementById('startBtn');
    const switchBtn = document.getElementById('switchBtn');
    let currentStream = null;
    let usingFront = false;

    // Función para dibujar puntos en el video
    function drawPoints(ctx, width, height) {
        const numPoints = 10;
        const spacing = width / (numPoints + 1);
        const y = height / 2;

        ctx.fillStyle = 'red';
        for (let i = 0; i < numPoints; i++) {
            const x = spacing * (i + 1);
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    // Función para calcular dimensiones manteniendo aspect ratio
    function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {
        const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
        return {
            width: srcWidth * ratio,
            height: srcHeight * ratio,
            x: (maxWidth - srcWidth * ratio) / 2,
            y: (maxHeight - srcHeight * ratio) / 2
        };
    }

    // Función para procesar el frame de video
    function processVideo() {
        const ctx = canvas.getContext('2d');
        
        // Ajustar el canvas al tamaño de la ventana
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Limpiar el canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Calcular dimensiones manteniendo aspect ratio
        const dimensions = calculateAspectRatioFit(
            video.videoWidth,
            video.videoHeight,
            canvas.width,
            canvas.height
        );
        
        // Dibujar el video centrado
        ctx.drawImage(
            video,
            dimensions.x,
            dimensions.y,
            dimensions.width,
            dimensions.height
        );
        
        // Dibujar los puntos
        drawPoints(ctx, canvas.width, canvas.height);
        
        requestAnimationFrame(processVideo);
    }

    // Iniciar la cámara
    async function startCamera(facingMode = 'environment') {
        try {
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
            }

            const constraints = {
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject = stream;
            currentStream = stream;

            // Esperar a que el video esté listo
            video.onloadedmetadata = () => {
                video.play();
                processVideo();
            };
        } catch (err) {
            console.error('Error accessing camera:', err);
            alert('Error al acceder a la cámara: ' + err.message);
        }
    }

    // Event Listeners
    startBtn.addEventListener('click', async () => {
        startCamera(usingFront ? 'user' : 'environment');
    });

    switchBtn.addEventListener('click', () => {
        usingFront = !usingFront;
        startCamera(usingFront ? 'user' : 'environment');
    });

    // Manejar cambios de tamaño de ventana
    window.addEventListener('resize', () => {
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    });
});