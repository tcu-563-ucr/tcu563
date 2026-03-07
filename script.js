const USER = 'tcu-563-ucr';
const REPO = 'tcu563';
let currentPath = '';

const container = document.getElementById('lista-pdfs');
const ARCHIVOS_OCULTOS = ['index.html', 'style.css', 'script.js', 'README.md', '.gitignore'];

function obtenerExtensionArchivo(nombreArchivo) {
    const partes = nombreArchivo.toLowerCase().split('.');
    return partes.length > 1 ? partes.pop() : '';
}

function archivoAdmiteVistaPrevia(nombreArchivo) {
    const extension = obtenerExtensionArchivo(nombreArchivo);
    return ['pdf', 'ppt', 'pptx'].includes(extension);
}

function obtenerUrlVistaPrevia(downloadUrl, nombreArchivo) {
    const extension = obtenerExtensionArchivo(nombreArchivo);

    if (extension === 'pdf') {
        return downloadUrl;
    }

    if (['ppt', 'pptx'].includes(extension)) {
        return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(downloadUrl)}`;
    }

    return null;
}

function visualizarArchivo(downloadUrl, nombreArchivo) {
    const vistaPreviaUrl = obtenerUrlVistaPrevia(downloadUrl, nombreArchivo);

    if (!vistaPreviaUrl) {
        alert('Este tipo de archivo no tiene vista previa disponible.');
        return;
    }

    window.open(vistaPreviaUrl, '_blank', 'noopener,noreferrer');
}

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
        window.open(url, '_blank');
    }
}

async function cargarContenido(path = '') {
    currentPath = path;
    const url = `https://api.github.com/repos/${USER}/${REPO}/contents/${path}`;
    
    try {
        const response = await fetch(url);
        const items = await response.json();
        container.innerHTML = ''; 

        if (path !== '') {
            const btnVolver = document.createElement('div');
            btnVolver.className = 'tarjeta-pdf volver';
   
            btnVolver.innerHTML = '<strong> Volver a todos los cursos </strong>';
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
                card.innerHTML = `<strong>Carpeta: ${item.name}</strong>`;
                card.onclick = () => cargarContenido(item.path);
            } 
            else {
                const admiteVistaPrevia = archivoAdmiteVistaPrevia(item.name);
                card.innerHTML = `
                    <div class="info-archivo">${item.name}</div>
                    <div class="acciones-archivo">
                        <button class="boton-visualizar" ${admiteVistaPrevia ? '' : 'disabled'}>Visualizar</button>
                        <button class="boton-descarga">Descargar</button>
                    </div>
                `;
                const btnDescarga = card.querySelector('.boton-descarga');
                const btnVisualizar = card.querySelector('.boton-visualizar');

                btnDescarga.onclick = (e) => {
                    e.stopPropagation();
                    descargarArchivo(item.download_url, item.name);
                };

                btnVisualizar.onclick = (e) => {
                    e.stopPropagation();
                    visualizarArchivo(item.download_url, item.name);
                };
            }
            container.appendChild(card);
        });
    } catch (error) {
        container.innerHTML = '<p>Error de conexion con el repositorio.</p>';
    }
}

function toggleCursos() {
    const panel = document.getElementById('panel-cursos');
    panel.classList.toggle('active');
}


const buscador = document.getElementById('buscador');
buscador.addEventListener('input', function() {
    const textoBusqueda = this.value.toLowerCase();
    const tarjetas = document.querySelectorAll('.tarjeta-pdf:not(.volver)');
    
    tarjetas.forEach(tarjeta => {
        const nombreArchivo = tarjeta.textContent.toLowerCase();
        tarjeta.style.display = nombreArchivo.includes(textoBusqueda) ? 'block' : 'none';
    });
});

cargarContenido();