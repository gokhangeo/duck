// Canvas ve context
const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');

// Araç ve mod değişkenleri
let currentTool = 'brush';
let isDrawing = false;
let currentColor = '#000000';
let currentSize = 5;
let lastPoint;
let partyMode = false;
let rainbowMode = false;
let rainbowIndex = 0;

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
let backgroundImage = null;

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

// Temizle butonu
document.getElementById('clear-btn').addEventListener('click', () => {
    const canvas = document.getElementById('drawing-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Eğer bir arkaplan resmi varsa, onu tekrar çiz
    if (backgroundImage) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    }
});

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
    if (currentTool === 'party') {
        stopPartyMode();
    }
    currentTool = tool;
    if (tool === 'party') {
        startPartyMode();
    }
    if (tool === 'rainbow') {
        rainbowMode = true;
    } else {
        rainbowMode = false;
    }
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`${tool}-tool`).classList.add('active');
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
    lastPoint = pos;
}

function draw(e) {
    if (!isDrawing) return;
    
    const pos = getMousePos(canvas, e);
    
    if (['rect', 'circle', 'triangle', 'line'].includes(currentTool)) {
        // Şekil önizlemesi için geçici canvas kullan
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');

        // Mevcut canvas içeriğini kopyala
        tempCtx.drawImage(canvas, 0, 0);

        // Şekli çiz
        drawShape(tempCtx, currentTool, lastPoint.x, lastPoint.y, pos.x, pos.y);

        // Ana canvas'ı temizle ve geçici canvas'ı kopyala
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (backgroundImage) {
            ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(tempCanvas, 0, 0);
    } else {
        // Normal çizim
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(pos.x, pos.y);
        
        if (partyMode) {
            ctx.strokeStyle = `hsl(${partyHue}, 100%, 50%)`;
            ctx.shadowBlur = 10;
            ctx.shadowColor = `hsl(${(partyHue + 180) % 360}, 100%, 50%)`;
        } else if (rainbowMode) {
            ctx.strokeStyle = getRainbowColor();
        } else {
            ctx.strokeStyle = currentTool === 'eraser' ? '#ffffff' : currentColor;
            ctx.shadowBlur = 0;
        }
        
        ctx.lineWidth = currentSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    }

    lastPoint = pos;
}

function getRainbowColor() {
    rainbowIndex = (rainbowIndex + 1) % colors.length;
    return colors[rainbowIndex];
}

function drawShape(context, shape, startX, startY, endX, endY) {
    context.beginPath();
    context.strokeStyle = currentColor;
    context.lineWidth = currentSize;
    context.lineCap = 'round';
    context.lineJoin = 'round';

    switch (shape) {
        case 'rect':
            const width = endX - startX;
            const height = endY - startY;
            context.rect(startX, startY, width, height);
            break;
        case 'circle':
            const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
            context.arc(startX, startY, radius, 0, Math.PI * 2);
            break;
        case 'triangle':
            context.moveTo(startX, startY);
            context.lineTo(endX, endY);
            context.lineTo(startX - (endX - startX), endY);
            context.closePath();
            break;
        case 'line':
            context.moveTo(startX, startY);
            context.lineTo(endX, endY);
            break;
    }
    context.stroke();
}

function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    ctx.shadowBlur = 0;

    if (['rect', 'circle', 'triangle', 'line'].includes(currentTool)) {
        // Son şekli çiz
        drawShape(ctx, currentTool, lastPoint.x, lastPoint.y, lastPoint.x, lastPoint.y);
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