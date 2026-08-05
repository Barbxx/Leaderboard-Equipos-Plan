// 1. BASE DE DATOS DE EQUIPOS
const supabaseUrl = 'https://yzddjejnawqpxqvqdrhm.supabase.co';
const supabaseKey = 'sb_publishable_c0tg7B54QIOs6y9VW10PJw_sx8e9RSK';
const db = supabase.createClient(supabaseUrl, supabaseKey);

// Array local (se llena al cargar desde Supabase)
let equipos = [];

// ── CARGAR todos los equipos desde Supabase ──────────────────────────────────
async function cargarDatos() {
    const { data, error } = await db.from('equipos').select('*').order('puntos', { ascending: false });
    if (error) { console.error('Error cargando equipos:', error); return; }
    equipos = data;
    construirControles();
    actualizarPantalla();
}

// ── GUARDAR un campo de un equipo en Supabase ─────────────────────────────────
async function guardarDato(id, campos) {
    const { error } = await db.from('equipos').update(campos).eq('id', id);
    if (error) console.error('Error guardando dato:', error);
}


// Helper: normaliza colores de 8 dígitos (#RRGGBBAA) a 6 (#RRGGBB)
// El input type="color" solo acepta 6 dígitos
function normalizarColor(color) {
    if (!color) return '#000000';
    return color.length === 9 ? color.slice(0, 7) : color;
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

    // Calcular posiciones con empates (dense ranking: sin saltos numéricos)
    let posicionActual = 0;
    let puntosAnteriores = null;
    equipos.forEach((equipo) => {
        if (equipo.puntos !== puntosAnteriores) {
            posicionActual++;
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

        // Controlar visibilidad inicial basada en podioStep
        const isVisible = 
            (index === 2 && podioStep >= 1) || 
            (index === 0 && podioStep >= 2) || 
            (index === 1 && podioStep >= 3);
            
        if (!isVisible) {
            wrapper.style.opacity = '0';
            wrapper.style.visibility = 'hidden';
        }

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
    // Ocultar los wrappers enteros para que el podio inicie en blanco
    contenedorPodio.querySelectorAll('.podio-wrapper').forEach(w => {
        w.style.opacity = '0';
        w.style.visibility = 'hidden';
        w.style.transition = 'none';
        
        const col = w.querySelector('.podio-lugar');
        if (col) {
            col.classList.remove('podio-animando');
            col.style.transform = 'translateY(200%)';
            col.style.transition = 'none';
        }
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
        podioStep = 1;
    }

    // 4to clic: Explosión de confetti
    if (podioStep === 4) {
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 200,
                spread: 120,
                origin: { y: 0.5, x: 0.5 },
                colors: ['#FFD700', '#FF8C00', '#FF0080', '#00FF00', '#00BFFF', '#FFFFFF'],
                startVelocity: 50,
                gravity: 0.8,
                ticks: 300
            });
        }
        podioStep++;
        return;
    }

    if (podioStep > 4) {
        window.resetearPodio();
        return;
    }

    const domIndex = ordenPorStep[podioStep - 1];
    const wrapper = wrappers[domIndex];
    if (wrapper) {
        wrapper.style.opacity = '1';
        wrapper.style.visibility = 'visible';
        wrapper.style.transition = 'opacity 0.4s ease';
        
        const col = wrapper.querySelector('.podio-lugar');
        if (col) {
            col.style.transition = '';
            col.style.transform = '';
            col.style.setProperty('--dur', '1s');
            col.style.animationDelay = '0ms';
            col.classList.add('podio-animando');
        }
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
                <input type="color" value="${normalizarColor(equipo.color1)}" onchange="actualizarDato('${equipo.id}', 'color1', this.value)" title="Color Izquierdo">
                <input type="color" value="${normalizarColor(equipo.color2)}" onchange="actualizarDato('${equipo.id}', 'color2', this.value)" title="Color Derecho">
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
window.modificarPuntosCustom = async function(id, signo) {
    const inputCantidad = document.getElementById('cantidad-' + id);
    const cantidad = parseInt(inputCantidad.value) || 0;
    let equipo = equipos.find(e => e.id === id);
    if (equipo && cantidad > 0) {
        const nuevosPuntos = Math.max(0, equipo.puntos + signo * cantidad);
        equipo.puntos = nuevosPuntos;
        await guardarDato(id, { puntos: nuevosPuntos });
        construirControles();
        actualizarPantalla();
    }
}

// Alias para compatibilidad (agregarEquipo usa esto)
window.modificarPuntos = window.modificarPuntosCustom;

window.actualizarDato = async function(id, campo, valor) {
    let equipo = equipos.find(e => e.id === id);
    if (equipo) {
        equipo[campo] = valor;
        await guardarDato(id, { [campo]: valor });
        if (campo === 'color1' || campo === 'color2') {
            construirControles();
        }
        // NO actualizamos la pantalla todavía → se ve al cerrar el panel
    }
}

window.agregarEquipo = async function() {
    const nuevoEquipo = {
        id: crypto.randomUUID(),
        nombre: 'NUEVO EQUIPO',
        puntos: 0,
        color1: '#777777',
        color2: '#333333'
    };
    const { data, error } = await db.from('equipos').insert(nuevoEquipo).select().single();
    if (error) { console.error('Error agregando equipo:', error); return; }
    equipos.push(data);
    construirControles();
    actualizarPantalla();

    setTimeout(() => {
        const panel = document.getElementById('panel-control');
        panel.scrollTop = panel.scrollHeight;
    }, 100);
}

window.eliminarEquipo = async function(id) {
    if (confirm('¿Seguro que deseas eliminar este equipo?')) {
        const { error } = await db.from('equipos').delete().eq('id', id);
        if (error) { console.error('Error eliminando equipo:', error); return; }
        equipos = equipos.filter(e => e.id !== id);
        construirControles();
        actualizarPantalla();
    }
}

// 6. INICIALIZACIÓN: cargamos datos desde Supabase
cargarDatos();

// Suscripción en tiempo real: actualiza la pantalla automáticamente
// cuando otro dispositivo/pestaña cambia datos en Supabase
db.channel('equipos-cambios')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'equipos' }, () => {
        cargarDatos();
    })
    .subscribe();

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

// 8. REINICIAR TORNEO (pone todos los puntos a 0)
window.reiniciarTorneo = async function() {
    if (confirm('⚠️ ¿Seguro que quieres reiniciar el torneo?\nTodos los puntos se pondrán en 0.')) {
        // Poner puntos a 0 en Supabase para todos los equipos
        const updates = equipos.map(e =>
            db.from('equipos').update({ puntos: 0 }).eq('id', e.id)
        );
        await Promise.all(updates);
        await cargarDatos();
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

// 10. SINCRONIZACIÓN DEL TELÓN ENTRE PESTAÑAS (localStorage sigue siendo suficiente para esto)
window.addEventListener('storage', function(e) {
    if (e.key === 'planCimos_telon') {
        const telon = document.getElementById('telon');
        if (telon) {
            const debeEstarOculto = e.newValue === 'oculto';
            const estaOculto = telon.classList.contains('telon-oculto');
            if (debeEstarOculto !== estaOculto) {
                window.toggleTelon(true);
            }
        }
    }
});

// 11. MODAL REGLAS DE PUNTOS
window.abrirModalPuntos = function() {
    const modal = document.getElementById('modal-puntos');
    if (modal) {
        modal.style.display = 'flex';
        // force reflow for animation
        modal.offsetHeight;
        modal.classList.remove('modal-oculto');
    }
};

window.cerrarModalPuntos = function() {
    const modal = document.getElementById('modal-puntos');
    if (modal) {
        modal.classList.add('modal-oculto');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300); // Wait for transition
    }
};
