// Canvas ve context
const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');

// Araç ve mod değişkenleri
let currentTool = 'brush';
let isDrawing = false;
let currentColor = '#000000';
let brushSize = 10;
let startX = 0;
let startY = 0;
let lastX = 0;
let lastY = 0;
let partyMode = false;
let partyHue = 0;
let partyInterval = null;
let backgroundImage = null;
let rainbowMode = false;
let rainbowIndex = 0;

// Renk paleti
const colors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
    '#FFC0CB', '#A52A2A', '#008000', '#808080', '#FFD700',
    '#E6E6FA', '#FF4500', '#32CD32', '#4169E1', '#FF69B4'
];

// GitHub resim galerisi
const images = [
    'image1.jpg',
    'image2.jpg',
    'image3.jpg',
    // Diğer resimler...
];

let currentImageIndex = 0;

// Resim kontrolü
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

function loadBackgroundImage(url) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        const canvas = document.getElementById('drawing-canvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = url;
}

// Canvas boyutunu ayarla
function resizeCanvas() {
    const container = document.getElementById('canvas-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    if (backgroundImage) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    }
}

// Fare olayları
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// Dokunmatik olaylar
canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchMove);
canvas.addEventListener('touchend', handleTouchEnd);

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
    startX = pos.x;
    startY = pos.y;
    lastX = pos.x;
    lastY = pos.y;

    if (['rect', 'circle', 'triangle', 'line'].includes(currentTool)) {
        // Şekil çizimi için başlangıç noktasını kaydet
        ctx.beginPath();
        ctx.moveTo(startX, startY);
    }
}

function draw(e) {
    if (!isDrawing) return;
    
    const pos = getMousePos(canvas, e);
    const x = pos.x;
    const y = pos.y;

    if (['rect', 'circle', 'triangle', 'line'].includes(currentTool)) {
        // Şekil önizlemesi için geçici canvas kullan
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');

        // Mevcut canvas içeriğini kopyala
        tempCtx.drawImage(canvas, 0, 0);

        // Şekli çiz
        drawShape(tempCtx, currentTool, startX, startY, x, y);

        // Ana canvas'ı temizle ve geçici canvas'ı kopyala
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (backgroundImage) {
            ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(tempCanvas, 0, 0);
    } else {
        // Normal çizim
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        
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
        
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    }

    lastX = x;
    lastY = y;
}

function getRainbowColor() {
    rainbowIndex = (rainbowIndex + 1) % colors.length;
    return colors[rainbowIndex];
}

function drawShape(context, shape, startX, startY, endX, endY) {
    context.beginPath();
    context.strokeStyle = currentColor;
    context.lineWidth = brushSize;
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
        drawShape(ctx, currentTool, startX, startY, lastX, lastY);
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

// Renk paletini oluştur
colors.forEach(color => {
    const colorBtn = document.createElement('button');
    colorBtn.className = 'color-btn';
    colorBtn.style.backgroundColor = color;
    colorBtn.addEventListener('click', () => {
        currentColor = color;
        document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('active'));
        colorBtn.classList.add('active');
        if (partyMode) {
            stopPartyMode();
            setTool('brush');
        }
        rainbowMode = false;
    });
    colorPalette.appendChild(colorBtn);
});

// Boyut butonları
document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        brushSize = parseInt(btn.dataset.size);
        document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// Temizle butonu
document.getElementById('clear-btn').addEventListener('click', () => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Arka plan resmini geçici canvas'a kopyala
    if (backgroundImage) {
        tempCtx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    }
    
    // Ana canvas'ı temizle ve geçici canvas'tan arka planı geri kopyala
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, 0, 0);
    
    // Parti modunu kapat
    if (partyMode) {
        stopPartyMode();
        setTool('brush');
    }
    rainbowMode = false;
});

// Kaydet butonu
document.getElementById('save-btn').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'boyama.png';
    link.href = canvas.toDataURL();
    link.click();
});

// Resim yükleme
const fileInput = document.getElementById('file-input');
fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            backgroundImage = img;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(file);
});

// Sayfa yüklendiğinde ve pencere boyutu değiştiğinde canvas'ı yeniden boyutlandır
window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);

// Sidebar toggle
document.getElementById('toggle-sidebar').addEventListener('click', function() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggle-sidebar');
    
    sidebar.classList.toggle('expanded');
    toggleBtn.classList.toggle('expanded');
    
    // Mobil görünümde
    if (window.innerWidth <= 768) {
        sidebar.classList.toggle('show');
    }
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