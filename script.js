const USER = 'tcu-563-ucr';
const REPO = 'tcu563';
let currentPath = '';

const container = document.getElementById('lista-pdfs');


const ARCHIVOS_OCULTOS = [
    'index.html', 
    'style.css', 
    'script.js', 
    'README.md',

];


async function descargarArchivo(url, nombre) {
    try {
        const respuesta = await fetch(url);
        const blob = await respuesta.blob(); 
        const urlBlob = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = urlBlob;
        a.download = nombre;
        document.body.appendChild(a);
        a.click();
        

        document.body.removeChild(a);
        window.URL.revokeObjectURL(urlBlob);
    } catch (error) {
        console.error("Error en la descarga forzada:", error);
        window.open(url, '_blank');
    }
}

async function cargarContenido(path = '') {
    currentPath = path;
    const url = `https://api.github.com/repos/${USER}/${REPO}/contents/${path}`;
    
    try {
        const response = await fetch(url);
        const items = await response.json();
        
        if (!Array.isArray(items)) {
            container.innerHTML = '<p>No se encontraron archivos en esta ubicación.</p>';
            return;
        }

        container.innerHTML = '';


        if (path !== '') {
            const btnVolver = document.createElement('div');
            btnVolver.className = 'tarjeta-pdf volver';
            btnVolver.innerHTML = '<strong>⬅ Volver atrás</strong>';
            btnVolver.onclick = () => {
                const parts = path.split('/');
                parts.pop();
                cargarContenido(parts.join('/'));
            };
            container.appendChild(btnVolver);
        }


        items.forEach(item => {
            
            if (ARCHIVOS_OCULTOS.includes(item.name)) return;

            const card = document.createElement('div');
            card.className = 'tarjeta-pdf';

            if (item.type === 'dir') {
                card.classList.add('carpeta');
                card.innerHTML = `<strong>📁 ${item.name}</strong>`;
                card.onclick = () => cargarContenido(item.path);
            } 
            else if (item.type === 'file') {

                card.innerHTML = `
                    <div class="info-archivo">📄 ${item.name}</div>
                    <button class="boton-descarga">Descargar</button>
                `;
                
               
                const btn = card.querySelector('.boton-descarga');
                btn.onclick = (e) => {
                    e.stopPropagation(); 
                    descargarArchivo(item.download_url, item.name);
                };
            } 
            
            container.appendChild(card);
        });

        if (container.innerHTML === '') {
            container.innerHTML = '<p>Carpeta vacía.</p>';
        }

    } catch (error) {
        console.error("Error al cargar:", error);
        container.innerHTML = '<p>Error de conexión con GitHub.</p>';
    }
}


cargarContenido();