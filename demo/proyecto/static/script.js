// static/script.js
// Añade esta función al inicio
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

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
            const scaledX = point.x;
            const scaledY = point.y;

            // Reducir el radio para un gradiente más concentrado
            const gradient = ctx.createRadialGradient(
                scaledX, scaledY, 0,    // Centro interno
                scaledX, scaledY, 1000    // Radio exterior reducido (antes 300)
            );

            // Aumentar la opacidad inicial (0.2 -> 0.5)
            const colors = [
                ['rgba(0, 255, 0, 0.5)', 'rgba(0, 255, 0, 0)'],  // Verde
                ['rgba(255, 0, 0, 0.5)', 'rgba(255, 0, 0, 0)'],  // Rojo
                ['rgba(0, 0, 255, 0.5)', 'rgba(0, 0, 255, 0)']   // Azul
            ];

            gradient.addColorStop(0, colors[index][0]);
            gradient.addColorStop(1, colors[index][1]);

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Punto central más visible
            ctx.fillStyle = colors[index][0].replace('0.5', '1');
            ctx.beginPath();
            ctx.arc(scaledX, scaledY, 15, 0, 2 * Math.PI);
            ctx.fill();
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
        
        // Throttle la llamada a getPoint cada 100ms
        throttledGetPoint();
        
        animationFrameId = requestAnimationFrame(processVideo);
    }

    // Crea la versión throttled de getPoint
    const throttledGetPoint = throttle(getPoint, 1000); // 100ms entre llamadas

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