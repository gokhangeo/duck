// Canvas ve context
const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');

// Araç ve mod değişkenleri
let isDrawing = false;
let currentTool = 'brush';
let currentColor = '#000000';
let currentSize = 5;
let lastX = 0;
let lastY = 0;
let backgroundImage = null;
let currentBackgroundImage = null;
let partyInterval = null;
let partyMode = false;
let rainbowMode = false;
let rainbowIndex = 0;
let shapeStartX = 0;
let shapeStartY = 0;

// Geçici canvas oluştur
const tempCanvas = document.createElement('canvas');
const tempCtx = tempCanvas.getContext('2d');

// Renk paleti
const colors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
    '#FFC0CB', '#A52A2A', '#008000', '#808080', '#FFD700',
    '#E6E6FA', '#FF4500', '#32CD32', '#4169E1', '#FF69B4'
];

// Renk paletini oluştur
const colorPalette = document.getElementById('color-palette');
colors.forEach(color => {
    const colorBtn = document.createElement('button');
    colorBtn.className = 'color-btn';
    colorBtn.style.backgroundColor = color;
    if (color === currentColor) {
        colorBtn.classList.add('active');
    }
    colorBtn.addEventListener('click', () => {
        document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('active'));
        colorBtn.classList.add('active');
        currentColor = color;
        if (partyMode) {
            stopPartyMode();
            setTool('brush');
        }
        rainbowMode = false;
    });
    colorPalette.appendChild(colorBtn);
});

// GitHub resim galerisi
async function loadGitHubImages() {
    try {
        const username = 'showman1907';
        const repo = 'duck';
        const path = 'images';
        const response = await fetch(`https://api.github.com/repos/${username}/${repo}/contents/${path}`);
        const data = await response.json();
        return data.filter(file => file.type === 'file' && file.name.match(/\.(jpg|jpeg|png|gif)$/i))
                   .map(file => file.download_url);
    } catch (error) {
        console.error('GitHub resimlerini yüklerken hata:', error);
        return [];
    }
}

let currentImageIndex = 0;

function loadBackgroundImage(url) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        const canvas = document.getElementById('drawing-canvas');
        const ctx = canvas.getContext('2d');
        
        // Resmi canvas'a sığdır
        const canvasRatio = canvas.width / canvas.height;
        const imageRatio = img.width / img.height;
        let drawWidth, drawHeight, drawX, drawY;
        
        if (canvasRatio > imageRatio) {
            // Canvas daha geniş, resmi yüksekliğe göre ayarla
            drawHeight = canvas.height;
            drawWidth = img.width * (canvas.height / img.height);
            drawX = (canvas.width - drawWidth) / 2;
            drawY = 0;
        } else {
            // Canvas daha dar, resmi genişliğe göre ayarla
            drawWidth = canvas.width;
            drawHeight = img.height * (canvas.width / img.width);
            drawX = 0;
            drawY = (canvas.height - drawHeight) / 2;
        }
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        
        // Resmi kaydet
        backgroundImage = img;
        currentBackgroundImage = url;
    };
    img.src = url;
}

document.getElementById('prev-image').addEventListener('click', async () => {
    const images = await loadGitHubImages();
    if (images.length === 0) return;
    
    currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
    loadBackgroundImage(images[currentImageIndex]);
});

document.getElementById('next-image').addEventListener('click', async () => {
    const images = await loadGitHubImages();
    if (images.length === 0) return;
    
    currentImageIndex = (currentImageIndex + 1) % images.length;
    loadBackgroundImage(images[currentImageIndex]);
});

// Sayfa yüklendiğinde ilk resmi yükle
window.addEventListener('load', async () => {
    const images = await loadGitHubImages();
    if (images.length > 0) {
        loadBackgroundImage(images[0]);
    }
});

// Canvas boyutunu ayarla
function resizeCanvas() {
    const canvas = document.getElementById('drawing-canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Eski çizimi koru
    if (backgroundImage) {
        const ctx = canvas.getContext('2d');
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    }
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', resizeCanvas);

// Temizle fonksiyonu
function clearCanvas() {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    if (currentBackgroundImage) {
        const img = new Image();
        img.src = currentBackgroundImage;
        img.onload = () => {
            // Canvas'ı temizle
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Arkaplan resmini tekrar çiz
            const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
            const x = (canvas.width - img.width * scale) / 2;
            const y = (canvas.height - img.height * scale) / 2;
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        };
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    isDrawing = false;
    partyMode = false;
    partyInterval && clearInterval(partyInterval);
}

document.getElementById('clear-btn').addEventListener('click', clearCanvas);

// Araç butonları
document.getElementById('brush-tool').addEventListener('click', () => setTool('brush'));
document.getElementById('eraser-tool').addEventListener('click', () => setTool('eraser'));
document.getElementById('party-tool').addEventListener('click', () => setTool('party'));
document.getElementById('rect-tool').addEventListener('click', () => setTool('rect'));
document.getElementById('circle-tool').addEventListener('click', () => setTool('circle'));
document.getElementById('triangle-tool').addEventListener('click', () => setTool('triangle'));
document.getElementById('line-tool').addEventListener('click', () => setTool('line'));
document.getElementById('rainbow-tool').addEventListener('click', () => setTool('rainbow'));

function setTool(tool) {
    currentTool = tool;
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`${tool}-tool`).classList.add('active');
    
    // Parti modunu kapat
    if (tool !== 'party' && partyMode) {
        partyMode = false;
        clearInterval(partyInterval);
    }
}

function startPartyMode() {
    partyMode = true;
    partyHue = 0;
    partyInterval = setInterval(() => {
        partyHue = (partyHue + 5) % 360;
    }, 50);
}

function stopPartyMode() {
    partyMode = false;
    if (partyInterval) {
        clearInterval(partyInterval);
        partyInterval = null;
    }
}

function startDrawing(e) {
    isDrawing = true;
    const pos = getMousePos(canvas, e);
    lastX = pos.x;
    lastY = pos.y;
    shapeStartX = pos.x;
    shapeStartY = pos.y;

    if (['rect', 'circle', 'triangle', 'line'].includes(currentTool)) {
        // Geçici canvas'ı hazırla
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Mevcut canvas içeriğini geçici canvas'a kopyala
        tempCtx.drawImage(canvas, 0, 0);
    }
}

function draw(e) {
    if (!isDrawing) return;

    const pos = getMousePos(canvas, e);

    if (['rect', 'circle', 'triangle', 'line'].includes(currentTool)) {
        // Ana canvas'ı temizle ve geçici canvas'ı çiz
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (backgroundImage) {
            ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(tempCanvas, 0, 0);

        // Şekli çiz
        ctx.beginPath();
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = currentSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        switch(currentTool) {
            case 'rect':
                const width = pos.x - shapeStartX;
                const height = pos.y - shapeStartY;
                ctx.strokeRect(shapeStartX, shapeStartY, width, height);
                break;
            case 'circle':
                const radius = Math.sqrt(
                    Math.pow(pos.x - shapeStartX, 2) + 
                    Math.pow(pos.y - shapeStartY, 2)
                );
                ctx.beginPath();
                ctx.arc(shapeStartX, shapeStartY, radius, 0, Math.PI * 2);
                ctx.stroke();
                break;
            case 'triangle':
                const triangleWidth = pos.x - shapeStartX;
                const triangleHeight = pos.y - shapeStartY;
                ctx.beginPath();
                ctx.moveTo(shapeStartX + triangleWidth/2, shapeStartY);
                ctx.lineTo(shapeStartX, shapeStartY + triangleHeight);
                ctx.lineTo(shapeStartX + triangleWidth, shapeStartY + triangleHeight);
                ctx.closePath();
                ctx.stroke();
                break;
            case 'line':
                ctx.beginPath();
                ctx.moveTo(shapeStartX, shapeStartY);
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
                break;
        }
    } else {
        // Normal çizim işlemi
        ctx.beginPath();
        ctx.strokeStyle = rainbowMode ? `hsl(${rainbowIndex}, 100%, 50%)` : currentColor;
        ctx.lineWidth = currentSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();

        if (rainbowMode) {
            rainbowIndex = (rainbowIndex + 1) % 360;
        }
    }

    lastX = pos.x;
    lastY = pos.y;
}

function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;

    if (['rect', 'circle', 'triangle', 'line'].includes(currentTool)) {
        // Son şekli geçici canvas'a kaydet
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(canvas, 0, 0);
    }
}

// Yardımcı fonksiyonlar
function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    if (evt.touches) {
        return {
            x: (evt.touches[0].clientX - rect.left) * scaleX,
            y: (evt.touches[0].clientY - rect.top) * scaleY
        };
    }
    
    return {
        x: (evt.clientX - rect.left) * scaleX,
        y: (evt.clientY - rect.top) * scaleY
    };
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

function handleTouchEnd(e) {
    e.preventDefault();
    const mouseEvent = new MouseEvent('mouseup', {});
    canvas.dispatchEvent(mouseEvent);
}

// Menü kontrolü
document.getElementById('toggle-sidebar').addEventListener('click', function() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggle-sidebar');
    
    sidebar.classList.toggle('expanded');
    toggleBtn.classList.toggle('expanded');
});

// Menü dışına tıklandığında menüyü kapat (sadece mobilde)
document.addEventListener('click', function(e) {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggle-sidebar');
    
    if (window.innerWidth <= 768 && 
        !sidebar.contains(e.target) && 
        !toggleBtn.contains(e.target)) {
        sidebar.classList.remove('show');
        sidebar.classList.remove('expanded');
        toggleBtn.classList.remove('expanded');
    }
});

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// Dokunmatik olaylar
canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchMove);
canvas.addEventListener('touchend', handleTouchEnd);