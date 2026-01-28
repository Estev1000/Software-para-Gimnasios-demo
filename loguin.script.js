const dniInput = document.getElementById('dniInput');
const messageContainer = document.getElementById('message-container');

// Helper to get data from localStorage
function getUsuarios() {
    return JSON.parse(localStorage.getItem('gym_usuarios') || '[]');
}

function getIngresos() {
    return JSON.parse(localStorage.getItem('gym_ingresos') || '[]');
}

function saveIngresos(ingresos) {
    localStorage.setItem('gym_ingresos', JSON.stringify(ingresos));
}

function getNextId() {
    const nextId = parseInt(localStorage.getItem('gym_next_id') || '1');
    localStorage.setItem('gym_next_id', (nextId + 1).toString());
    return nextId;
}

function appendNumber(number) {
    if (dniInput.value.length < 8) { // MAX 8 chars for DNI
        dniInput.value += number;
        clearMessage();
    }
}

function clearInput() {
    dniInput.value = '';
    clearMessage();
}

function backspace() {
    dniInput.value = dniInput.value.slice(0, -1);
    clearMessage();
}

function submitLogin() {
    const dni = dniInput.value;

    if (dni.length === 0) {
        showMessage('Por favor ingrese un DNI', 'error');
        return;
    }

    if (dni.length < 5) {
        showMessage('DNI inválido (muy corto)', 'error');
        return;
    }

    // Indicate loading
    const startBtn = document.querySelector('.submit-btn');
    const originalBtnContent = startBtn.innerHTML;

    startBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Verificando...';
    startBtn.disabled = true;

    // Simulate network delay for better UX
    setTimeout(() => {
        const usuarios = getUsuarios();
        // Find user by DNI (compare as strings)
        const user = usuarios.find(u => u.dni && u.dni.toString().trim() === dni);

        if (user) {
            // Check if membership is expired
            const fechaVencimiento = new Date(user.fecha_vencimiento);
            const hoy = new Date();
            // Reset time part for accurate date comparison
            hoy.setHours(0, 0, 0, 0);
            fechaVencimiento.setHours(0, 0, 0, 0);

            if (fechaVencimiento < hoy) {
                // EXPIRED
                showMessage(`Hola ${user.nombre}, tu cuota Venció el ${user.fecha_vencimiento}`, 'error');
                playSound('error');

                startBtn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Vencido';

            } else {
                // VALID - REGISTER ACCESS
                const ingresos = getIngresos();
                const newIngreso = {
                    id: getNextId(),
                    usuario_id: user.id,
                    fecha: new Date().toISOString()
                };
                ingresos.push(newIngreso);
                saveIngresos(ingresos);

                showMessage(`¡Bienvenido/a ${user.nombre}! Acceso Permitido.`, 'success');
                playSound('success');

                startBtn.innerHTML = '<i class="fa-solid fa-check"></i> Adelante';
            }

        } else {
            // NOT FOUND
            showMessage('DNI no encontrado en el sistema.', 'error');
            playSound('error');
            startBtn.innerHTML = '<i class="fa-solid fa-xmark"></i> No Existe';
        }

        // Reset UI after delay
        setTimeout(() => {
            clearInput();
            startBtn.innerHTML = originalBtnContent;
            startBtn.disabled = false;
            clearMessage();
        }, 3000);

    }, 600);
}

function showMessage(text, type) {
    messageContainer.textContent = text;
    messageContainer.className = `message ${type}`;
    messageContainer.classList.remove('hidden');
}

function clearMessage() {
    messageContainer.textContent = '';
    messageContainer.classList.add('hidden');
}

function playSound(type) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;

    if (type === 'success') {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, now); // A5
        oscillator.frequency.exponentialRampToValueAtTime(1760, now + 0.1); // Pequeño efecto "coin"

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        oscillator.start(now);
        oscillator.stop(now + 0.3);
    } else {
        // ALARMA DE ERROR (VENCIDO)
        // Secuencia de 3 pitidos fuertes y agresivos
        const playAlarmBeep = (startTime) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = 'square'; // Onda cuadrada = sonido más "áspero" y fuerte (tipo alarma)
            osc.frequency.setValueAtTime(600, startTime);
            osc.frequency.linearRampToValueAtTime(400, startTime + 0.15); // Efecto de caída

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            // Volumen ALTO (0.5)
            gain.gain.setValueAtTime(0.5, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

            osc.start(startTime);
            osc.stop(startTime + 0.15);
        };

        // Reproducir 3 pitidos con espacios de 0.2 segundos
        playAlarmBeep(now);
        playAlarmBeep(now + 0.25);
        playAlarmBeep(now + 0.5);
    }
}

// Keyboard support
document.addEventListener('keydown', (e) => {
    if (e.key >= '0' && e.key <= '9') {
        appendNumber(e.key);
    } else if (e.key === 'Backspace') {
        backspace();
    } else if (e.key === 'Enter') {
        submitLogin();
    } else if (e.key === 'Escape') {
        clearInput();
    }
});
