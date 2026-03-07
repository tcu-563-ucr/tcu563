const USER = 'tcu-563-ucr';
const REPO = 'tcu563';
const BRANCH = 'main';
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

function construirUrlRaw(pathArchivo) {
    const rutaCodificada = pathArchivo
        .split('/')
        .map(segmento => encodeURIComponent(segmento))
        .join('/');

    return `https://raw.githubusercontent.com/${USER}/${REPO}/${BRANCH}/${rutaCodificada}`;
}

function construirUrlCdn(pathArchivo) {
    const rutaCodificada = pathArchivo
        .split('/')
        .map(segmento => encodeURIComponent(segmento))
        .join('/');

    return `https://cdn.jsdelivr.net/gh/${USER}/${REPO}@${BRANCH}/${rutaCodificada}`;
}

function obtenerUrlVistaPrevia(pathArchivo, nombreArchivo) {
    const extension = obtenerExtensionArchivo(nombreArchivo);
    const cdnUrl = construirUrlCdn(pathArchivo);

    if (extension === 'pdf') {
        return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(cdnUrl)}`;
    }

    if (['ppt', 'pptx'].includes(extension)) {
        return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(cdnUrl)}`;
    }

    return null;
}

function abrirVistaPrevia(url) {
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.target = '_blank';
    enlace.rel = 'noopener noreferrer';
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
}

async function visualizarArchivo(pathArchivo, nombreArchivo, downloadUrl) {
    const extension = obtenerExtensionArchivo(nombreArchivo);

    if (extension === 'pdf') {
        const vistaPreviaPdf = obtenerUrlVistaPrevia(pathArchivo, nombreArchivo);
        abrirVistaPrevia(vistaPreviaPdf);
        return;
    }

    const vistaPreviaUrl = obtenerUrlVistaPrevia(pathArchivo, nombreArchivo);

    if (!vistaPreviaUrl) {
        alert('Este tipo de archivo no tiene vista previa disponible.');
        return;
    }

    abrirVistaPrevia(vistaPreviaUrl);
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
                    visualizarArchivo(item.path, item.name, item.download_url);
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