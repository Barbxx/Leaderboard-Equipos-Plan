// 1. BASE DE DATOS DE EQUIPOS
const defaultEquipos = [
    { id: '1', nombre: 'VERDE', puntos: 900, color1: '#06de31ff', color2: '#02c529ff' },
    { id: '2', nombre: 'AZUL', puntos: 850, color1: '#00c3ff', color2: '#046cd3ff' },
    { id: '3', nombre: 'AMARILLO', puntos: 600, color1: '#eeff00ff', color2: '#99a308ff' },
    { id: '4', nombre: 'NARANJA', puntos: 500, color1: '#ff6a00ff', color2: '#cc2900' },
    { id: '5', nombre: 'ROJO', puntos: 350, color1: '#ff0000', color2: '#990000' },
    { id: '6', nombre: 'MORADO', puntos: 300, color1: '#8a2be2', color2: '#4b0082' },
    { id: '7', nombre: 'ROSA', puntos: 250, color1: '#ff1493', color2: '#9e0255ff' }
];

// Cargar desde localStorage si existe, si no, usar los por defecto
let equipos = JSON.parse(localStorage.getItem('cimosEquipos')) || defaultEquipos;

// Función para guardar los cambios permanentemente
function guardarDatos() {
    localStorage.setItem('cimosEquipos', JSON.stringify(equipos));
}

// Función para cargar los datos desde localStorage
function cargarDatos() {
    const guardados = localStorage.getItem('cimosEquipos');
    if (guardados) {
        equipos = JSON.parse(guardados);
    }
}


// Generador de ID único
function generarId() {
    return Math.random().toString(36).substr(2, 9);
}


// 2. REFERENCIAS AL DOM
const listaHTML = document.getElementById('lista-equipos');
let vistaActual = 'lista';

window.toggleDropdownVistas = function() {
    const menu = document.getElementById('menu-vistas');
    if (menu) menu.classList.toggle('menu-vistas-oculto');
};

window.cambiarVista = function(nuevaVista) {
    vistaActual = nuevaVista;
    
    const menu = document.getElementById('menu-vistas');
    if (menu) menu.classList.add('menu-vistas-oculto');
    
    if (vistaActual === 'lista') {
        document.getElementById('vista-lista').style.display = 'block';
        document.getElementById('vista-podio').style.display = 'none';
        
        // Mostrar botones de lista, ocultar el de podio
        const ctrlLista = document.getElementById('controles-animacion-lista');
        const ctrlPodio = document.getElementById('controles-animacion-podio');
        if (ctrlLista) ctrlLista.style.display = 'block';
        if (ctrlPodio) ctrlPodio.style.display = 'none';
    } else {
        document.getElementById('vista-lista').style.display = 'none';
        document.getElementById('vista-podio').style.display = 'flex';
        
        // Mostrar botón de podio, ocultar los de lista
        const ctrlLista = document.getElementById('controles-animacion-lista');
        const ctrlPodio = document.getElementById('controles-animacion-podio');
        if (ctrlLista) ctrlLista.style.display = 'none';
        if (ctrlPodio) ctrlPodio.style.display = 'block';
        
        // Resetear el podio para que empiece oculto
        if (typeof window.resetearPodio === 'function') window.resetearPodio();
    }
    
    actualizarPantalla();
};

// 3. ACTUALIZAR PANTALLA (PÚBLICO) - reconstruye el DOM con nuevo orden
function actualizarPantalla() {
    // Ordenar por puntos (mayor a menor)
    equipos.sort((a, b) => b.puntos - a.puntos);

    // Calcular posiciones con empates
    let posicionActual = 1;
    let puntosAnteriores = -1;
    let equiposProcesados = 0;
    equipos.forEach((equipo, index) => {
        equiposProcesados++;
        if (index > 0 && equipo.puntos < puntosAnteriores) {
            posicionActual = equiposProcesados;
        }
        equipo.posicionCalculada = posicionActual;
        puntosAnteriores = equipo.puntos;
    });

    // Limpiar lista y reconstruir desde cero
    listaHTML.innerHTML = '';
    equipos.forEach((equipo, index) => {
        const fila = document.createElement('li');
        fila.id = 'fila-' + equipo.id;
        fila.className = 'fila-equipo';
        fila.style.background = `linear-gradient(to right, ${equipo.color1}, ${equipo.color2})`;
        fila.innerHTML = `
            <div class="pos">${equipo.posicionCalculada}</div>
            <div class="nom">${equipo.nombre}</div>
            <div class="pts">${equipo.puntos}pts</div>
        `;
        fila.style.cursor = 'pointer';
        fila.onclick = () => mostrarDetalleEquipo(equipo);
        listaHTML.appendChild(fila);
    });

    // Siempre renderizamos ambas vistas por si acaso, el CSS oculta la inactiva
    renderizarPodio();
}

function renderizarPodio() {
    const contenedorPodio = document.getElementById('vista-podio');
    contenedorPodio.innerHTML = '';
    
    const top3 = equipos.slice(0, 3);
    
    // Orden visual: 2do, 1ro, 3ro (así se ve el podio)
    const ordenVisual = [
        top3[1] || null,
        top3[0] || null,
        top3[2] || null
    ];
    
    const clasesPodio = ['podio-2', 'podio-1', 'podio-3'];
    const posiciones = [2, 1, 3];
    const medallas = ['🥈', '🏆', '🥉'];
    const etiquetas = ['2do LUGAR', '1er LUGAR', '3er LUGAR'];
    
    ordenVisual.forEach((equipo, index) => {
        // Wrapper externo que contiene la etiqueta arriba y la barra abajo
        const wrapper = document.createElement('div');
        wrapper.className = `podio-wrapper ${clasesPodio[index].replace('podio-', 'wrapper-')}`;

        // Etiqueta FUERA de la barra (arriba)
        const etq = document.createElement('div');
        etq.className = 'p-etiqueta';
        etq.textContent = etiquetas[index];
        wrapper.appendChild(etq);

        // La barra en sí
        const div = document.createElement('div');
        div.className = `podio-lugar ${clasesPodio[index]}`;
        
        if (equipo) {
            div.style.background = `linear-gradient(to bottom, ${equipo.color1}, ${equipo.color2})`;
            div.innerHTML = `
                <div class="p-decoracion">${medallas[index]}</div>
                <div class="p-pos">${posiciones[index]}</div>
                <div class="p-nom">${equipo.nombre}</div>
                <div class="p-pts">${equipo.puntos}pts</div>
            `;
        } else {
            div.style.background = 'rgba(0,0,0,0.3)';
        }
        
        wrapper.appendChild(div);
        contenedorPodio.appendChild(wrapper);
    });
}

// 3b. REVEAL DRAMÁTICO (botón Animar): filas salen volando y rebotan al entrar
window.revelacionDramatica = function() {
    const filasActuales = Array.from(listaHTML.children);

    // FASE 1: filas salen volando a la derecha, escalonadas (50ms entre cada una)
    filasActuales.forEach((fila, i) => {
        setTimeout(() => fila.classList.add('fila-saliendo'), i * 50);
    });

    const tiempoSalida = 350 + filasActuales.length * 50;

    // FASE 2: reconstruir y entrar rebotando desde abajo (120ms entre cada una)
    setTimeout(() => {
        actualizarPantalla();
        Array.from(listaHTML.children).forEach((fila, i) => {
            fila.style.setProperty('--dur', '0.55s');
            fila.style.animationDelay = (i * 120) + 'ms';
            fila.classList.add('fila-entrando');
            fila.style.opacity = '0';
        });
    }, tiempoSalida);
}

// 3c. ANIMACIÓN LINEAL (botón superior): salen rápido y entran de izquierda a derecha
window.animacionLineal = function() {
    const filasActuales = Array.from(listaHTML.children);

    // Salida rápida a la derecha
    filasActuales.forEach((fila, i) => {
        setTimeout(() => fila.classList.add('fila-saliendo'), i * 30);
    });

    const tiempoSalida = 300 + filasActuales.length * 30;

    // Entrada lineal
    setTimeout(() => {
        actualizarPantalla();
        Array.from(listaHTML.children).forEach((fila, i) => {
            fila.style.setProperty('--dur', '0.6s');
            fila.style.animationDelay = (i * 150) + 'ms';
            fila.classList.add('fila-entrando-lineal');
            fila.style.opacity = '0';
        });
    }, tiempoSalida);
}


// 3d. ANIMACIÓN DE PODIO PASO A PASO: cada click revela un lugar (3ro -> 2do -> 1ro)
let podioStep = 0; // 0 = todo oculto, 1 = 3er lugar visible, 2 = +2do, 3 = +1ro

window.resetearPodio = function() {
    podioStep = 0;
    const contenedorPodio = document.getElementById('vista-podio');
    if (!contenedorPodio) return;
    // Las barras son los .podio-lugar dentro de cada wrapper
    contenedorPodio.querySelectorAll('.podio-lugar').forEach(col => {
        col.classList.remove('podio-animando');
        col.style.transform = 'translateY(200%)';
        col.style.transition = 'none';
    });
}

window.animarPodio = function() {
    const contenedorPodio = document.getElementById('vista-podio');
    if (!contenedorPodio) return;
    // Los wrappers en el DOM: [0]=wrapper-2 (2do), [1]=wrapper-1 (1ro), [2]=wrapper-3 (3ro)
    const wrappers = Array.from(contenedorPodio.children);
    // Step order: step 1 -> wrapper idx 2 (3ro), step 2 -> idx 0 (2do), step 3 -> idx 1 (1ro)
    const ordenPorStep = [2, 0, 1];

    if (podioStep === 0) {
        wrappers.forEach(w => {
            const col = w.querySelector('.podio-lugar');
            if (col) {
                col.classList.remove('podio-animando');
                col.style.transform = 'translateY(200%)';
                col.style.transition = 'none';
            }
        });
        podioStep = 1;
        setTimeout(() => window.animarPodio(), 80);
        return;
    }

    if (podioStep > 3) {
        window.resetearPodio();
        return;
    }

    const domIndex = ordenPorStep[podioStep - 1];
    const col = wrappers[domIndex] ? wrappers[domIndex].querySelector('.podio-lugar') : null;
    if (col) {
        col.style.transition = '';
        col.style.transform = '';
        col.style.setProperty('--dur', '1s');
        col.style.animationDelay = '0ms';
        col.classList.add('podio-animando');
    }

    podioStep++;
}

// DETALLE DE EQUIPO: popup central al hacer click en una fila de la lista
let timeoutPopup;
function mostrarDetalleEquipo(equipo) {
    const popup = document.getElementById('popup-equipo');
    const inner = document.getElementById('popup-inner-contenido');
    const posVal = document.getElementById('popup-pos-val');
    const nombreVal = document.getElementById('popup-nombre-val');
    const ptsVal = document.getElementById('popup-pts-val');

    if (!popup || !inner || !posVal || !nombreVal || !ptsVal) return;

    // Llenar datos
    inner.style.background = `linear-gradient(90deg, ${equipo.color1}, ${equipo.color2}, ${equipo.color1})`;
    posVal.textContent = equipo.posicionCalculada;
    nombreVal.textContent = equipo.nombre;
    ptsVal.textContent = `${equipo.puntos}pts`; // Sin el +

    // Mostrar
    popup.style.display = 'flex';
    
    // Reiniciar animación si estaba visible (truco para forzar re-flow)
    inner.style.animation = 'none';
    popup.offsetHeight; /* trigger reflow */
    inner.style.animation = null; 

    // Auto-cerrar tras 4 segundos
    clearTimeout(timeoutPopup);
    timeoutPopup = setTimeout(() => { popup.style.display = 'none'; }, 4000);
}


// 3c. ACTUALIZACIÓN SUAVE (cerrar panel): fade rápido y slide desde izquierda
function actualizacionSuave() {
    actualizarPantalla();
    Array.from(listaHTML.children).forEach((fila, i) => {
        fila.style.setProperty('--dur-s', '0.3s');
        fila.style.animationDelay = (i * 60) + 'ms';
        fila.classList.add('fila-actualizando');
        fila.style.opacity = '0';
    });
}


// 4. CREAR PANEL DE CONTROL
function construirControles() {
    const contenedor = document.getElementById('controles-contenedor');
    contenedor.innerHTML = '';

    equipos.forEach(equipo => {
        let div = document.createElement('div');
        div.className = 'control-equipo';
        div.style.borderLeftColor = equipo.color1;
        
        div.innerHTML = `
            <div class="control-fila">
                <input type="text" value="${equipo.nombre}" onchange="actualizarDato('${equipo.id}', 'nombre', this.value)" placeholder="Nombre">
                <input type="color" value="${equipo.color1}" onchange="actualizarDato('${equipo.id}', 'color1', this.value)" title="Color Izquierdo">
                <input type="color" value="${equipo.color2}" onchange="actualizarDato('${equipo.id}', 'color2', this.value)" title="Color Derecho">
            </div>
            <div class="fila-pts">
                <span class="pts-display">${equipo.puntos} pts</span>
                <input type="number" id="cantidad-${equipo.id}" class="input-cantidad" value="100" min="1">
            </div>
            <div class="fila-botones">
                <button class="btn-puntos" onclick="modificarPuntosCustom('${equipo.id}', 1)">+ Sumar</button>
                <button class="btn-puntos btn-restar" onclick="modificarPuntosCustom('${equipo.id}', -1)">- Restar</button>
            </div>
            <button class="btn-eliminar" onclick="eliminarEquipo('${equipo.id}')">Eliminar</button>
        `;
        contenedor.appendChild(div);
    });
}

// 5. FUNCIONES INTERACTIVAS
window.modificarPuntosCustom = function(id, signo) {
    const inputCantidad = document.getElementById('cantidad-' + id);
    const cantidad = parseInt(inputCantidad.value) || 0;
    let equipo = equipos.find(e => e.id === id);
    if(equipo && cantidad > 0) {
        equipo.puntos += signo * cantidad;
        if (equipo.puntos < 0) equipo.puntos = 0; // No permitir puntos negativos
        guardarDatos();
        construirControles();
    }
}

// Alias para compatibilidad (agregarEquipo usa esto)
window.modificarPuntos = window.modificarPuntosCustom;

window.actualizarDato = function(id, campo, valor) {
    let equipo = equipos.find(e => e.id === id);
    if(equipo) {
        equipo[campo] = valor;
        guardarDatos();
        if(campo === 'color1' || campo === 'color2') {
            construirControles();
        }
        // NO actualizamos la pantalla todavía → se ve al cerrar el panel
    }
}

window.agregarEquipo = function() {
    const nuevoEquipo = {
        id: generarId(),
        nombre: 'NUEVO EQUIPO',
        puntos: 0,
        color1: '#777777',
        color2: '#333333'
    };
    equipos.push(nuevoEquipo);
    guardarDatos();
    construirControles();
    actualizarPantalla(); // Al agregar sí se muestra inmediatamente
    
    setTimeout(() => {
        const panel = document.getElementById('panel-control');
        panel.scrollTop = panel.scrollHeight;
    }, 100);
}

window.eliminarEquipo = function(id) {
    if(confirm("¿Seguro que deseas eliminar este equipo?")) {
        equipos = equipos.filter(e => e.id !== id);
        guardarDatos();
        construirControles();
        actualizarPantalla();
    }
}

// 6. INICIALIZACIÓN
construirControles();
actualizarPantalla();

// SVGs para el botón de panel
const SVG_PANEL = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
const SVG_CERRAR = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

// 7. TOGGLE PANEL DE CONTROL
window.togglePanel = function() {
    const panel = document.getElementById('panel-control');
    const btn   = document.getElementById('btn-toggle-panel');
    const estaOculto = panel.classList.contains('panel-oculto');

    if (estaOculto) {
        // Abrir panel: mostrar X
        panel.classList.remove('panel-oculto');
        btn.innerHTML = SVG_CERRAR;
        btn.title = 'Cerrar Panel';
        document.body.classList.add('panel-abierto');
    } else {
        // Cerrar panel: volver al ícono de menú
        panel.classList.add('panel-oculto');
        btn.innerHTML = SVG_PANEL;
        btn.title = 'Panel de Control';
        document.body.classList.remove('panel-abierto');

        // Animación sencilla (slide desde izquierda, sin rebote)
        setTimeout(() => {
            actualizacionSuave();
        }, 250);
    }
}

// 8. REINICIAR TORNEO
window.reiniciarTorneo = function() {
    if(confirm('⚠️ ¿Seguro que quieres reiniciar el torneo?\nTodos los puntos y cambios se perderán.')) {
        // Hacer una copia profunda de los valores por defecto
        equipos = JSON.parse(JSON.stringify(defaultEquipos));
        guardarDatos();
        construirControles();
        actualizarPantalla();
    }
}

// 9. GESTIÓN DE ESCENARIO Y TELÓN
window.toggleTelon = function(fromSync = false) {
    const telon = document.getElementById('telon');
    if (telon) {
        telon.classList.toggle('telon-oculto');
        const estaOculto = telon.classList.contains('telon-oculto');
        if (estaOculto) {
            document.body.classList.remove('telon-activo');
        } else {
            document.body.classList.add('telon-activo');
        }
        
        // Sincronizar con otras pestañas
        if (!fromSync) {
            localStorage.setItem('planCimos_telon', estaOculto ? 'oculto' : 'activo-' + Date.now());
        }
    }
}

window.cambiarEscena = function(escenaId) {
    // 1. Ocultar todas las escenas
    const escenas = document.querySelectorAll('.escena');
    escenas.forEach(e => e.classList.add('oculta'));

    // 2. Mostrar la escena seleccionada
    const escenaMostrar = document.getElementById('escena-' + escenaId);
    if (escenaMostrar) {
        escenaMostrar.classList.remove('oculta');
    }

    // 3. Manejar reproducción automática del video si es la escena del video
    const video = document.getElementById('video-intro');
    if (video) {
        if (escenaId === 'video') {
            video.currentTime = 0;
            video.play().catch(e => console.log('Auto-play bloqueado por el navegador', e));
        } else {
            video.pause();
        }
    }

    // 4. Mostrar u ocultar el botón de Vistas según la escena
    const dropdownVistas = document.getElementById('dropdown-vistas-container');
    if (dropdownVistas) {
        dropdownVistas.style.display = (escenaId === 'leaderboard') ? 'block' : 'none';
    }

    // 5. Actualizar el estado visual de los botones de escena (si aplican)
    const btnLogo = document.getElementById('btn-escena-logo');
    const btnVideo = document.getElementById('btn-escena-video');
    const btnMapa = document.getElementById('btn-escena-mapa');
    const btnLeaderboard = document.getElementById('btn-escena-leaderboard');
    
    if (btnLogo) btnLogo.classList.remove('activo');
    if (btnVideo) btnVideo.classList.remove('activo');
    if (btnMapa) btnMapa.classList.remove('activo');
    if (btnLeaderboard) btnLeaderboard.classList.remove('activo');

    const btnActivo = document.getElementById('btn-escena-' + escenaId);
    if (btnActivo) btnActivo.classList.add('activo');
}

// 10. SINCRONIZACIÓN ENTRE PESTAÑAS (Para múltiples pantallas HTML)
window.addEventListener('storage', function(e) {
    if (e.key === 'planCimos_equipos') {
        cargarDatos();
        // Si estamos en la pantalla de leaderboard (que tiene la lista y podio)
        if (document.getElementById('lista-equipos')) {
            construirControles();
            actualizarPantalla();
        }
    } else if (e.key === 'planCimos_telon') {
        const telon = document.getElementById('telon');
        if (telon) {
            const debeEstarOculto = e.newValue === 'oculto';
            const estaOculto = telon.classList.contains('telon-oculto');
            
            if (debeEstarOculto !== estaOculto) {
                window.toggleTelon(true); // true indica que viene de sync
            }
        }
    }
});
