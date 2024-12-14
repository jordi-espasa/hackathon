// static/script.js
document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById('webcam');
    const canvas = document.getElementById('canvas');
    const startBtn = document.getElementById('startBtn');
    const switchBtn = document.getElementById('switchBtn');
    let currentStream = null;
    let usingFront = false;
    let animationFrameId = null;
    let lastPoints = null; // Almacenar los últimos puntos recibidos

    // Función para obtener los puntos desde el backend
    async function getPoint() {
        try {
            const response = await fetch('/get_point');
            const data = await response.json();
            
            if (data.error) {
                console.error('Error:', data.error);
                return null;
            }

            lastPoints = data.points; // Guardar los puntos
            return data.points;
        } catch (error) {
            console.error('Error al obtener los puntos:', error);
            return null;
        }
    }

    // Función para dibujar los puntos
    function drawPoints(ctx, dimensions, points) {
        if (!points) return;

        points.forEach((point, index) => {
            // Calcular el punto escalado según las dimensiones
            const scaledX = dimensions.x + point.x;
            const scaledY = dimensions.y + point.y;

            // Dibujar el punto con diferentes colores según el índice
            const colors = ['#00FF00', '#FF0000', '#0000FF']; // Verde, Rojo, Azul
            ctx.fillStyle = colors[index];
            ctx.beginPath();
            ctx.arc(scaledX, scaledY, 15, 0, 2 * Math.PI);
            ctx.fill();

            // Log de las coordenadas del punto
            console.log(`Punto ${index + 1} dibujado:`, {
                original: point,
                scaled: { x: scaledX, y: scaledY }
            });
        });
    }

    // Función para calcular dimensiones manteniendo aspect ratio
    function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {
        const ratio = Math.max(maxWidth / srcWidth, maxHeight / srcHeight);
        return {
            width: srcWidth * ratio,
            height: srcHeight * ratio,
            x: (maxWidth - srcWidth * ratio) / 2,
            y: (maxHeight - srcHeight * ratio) / 2
        };
    }

    // Función para procesar el frame de video
    function processVideo() {
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.zIndex = '1';
        
        const ctx = canvas.getContext('2d');
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const dimensions = calculateAspectRatioFit(
            video.videoWidth,
            video.videoHeight,
            canvas.width,
            canvas.height
        );
        
        ctx.drawImage(
            video,
            dimensions.x,
            dimensions.y,
            dimensions.width,
            dimensions.height
        );

        // Dibujar los últimos puntos conocidos mientras se obtienen nuevos
        drawPoints(ctx, dimensions, lastPoints);
        
        // Obtener nuevos puntos de forma asíncrona
        getPoint();
        
        animationFrameId = requestAnimationFrame(processVideo);
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
                // Enviar dimensiones al backend
                fetch('/set_dimensions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        width: video.videoWidth,
                        height: video.videoHeight
                    })
                })
                .then(response => response.json())
                .then(data => console.log('Dimensiones enviadas:', data))
                .catch(error => console.error('Error:', error));
                
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

    // Limpiar al cerrar
    window.addEventListener('beforeunload', () => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }
    });

    // Manejar cambios de tamaño de ventana
    window.addEventListener('resize', () => {
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    });
});