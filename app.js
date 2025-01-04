// Canvas ve context
const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');

// Çizim geçmişi için ikinci canvas
const historyCanvas = document.createElement('canvas');
const historyCtx = historyCanvas.getContext('2d');

// Araç ve mod değişkenleri
let currentTool = 'brush';
let isDrawing = false;
let currentColor = '#000000';
let brushSize = 10;
let lastX = 0;
let lastY = 0;
let rainbowHue = 0;
let backgroundImage = null;

// Canvas boyutunu ayarla
function resizeCanvas() {
    const container = document.getElementById('canvas-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    historyCanvas.width = container.clientWidth;
    historyCanvas.height = container.clientHeight;
    if (backgroundImage) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
        // Arka plan resmini history canvas'a da kopyala
        historyCtx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
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
document.getElementById('party-tool').addEventListener('click', () => setTool('rainbow'));

function setTool(tool) {
    currentTool = tool;
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`${tool}-tool`).classList.add('active');
}

function startDrawing(e) {
    isDrawing = true;
    const pos = getMousePos(canvas, e);
    lastX = pos.x;
    lastY = pos.y;
    
    // Çizime başlamadan önce mevcut canvas'ı history'e kaydet
    historyCtx.clearRect(0, 0, canvas.width, canvas.height);
    historyCtx.drawImage(canvas, 0, 0);
}

function draw(e) {
    if (!isDrawing) return;
    
    const pos = getMousePos(canvas, e);
    const x = pos.x;
    const y = pos.y;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    
    if (currentTool === 'rainbow') {
        // Gökkuşağı efekti
        rainbowHue = (rainbowHue + 2) % 360;
        ctx.strokeStyle = `hsl(${rainbowHue}, 100%, 50%)`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `hsl(${(rainbowHue + 180) % 360}, 100%, 50%)`;
    } else {
        ctx.strokeStyle = currentTool === 'eraser' ? '#ffffff' : currentColor;
        ctx.shadowBlur = 0;
    }
    
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastX = x;
    lastY = y;
}

function stopDrawing() {
    isDrawing = false;
    ctx.shadowBlur = 0; // Gölgeyi kapat
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
const colors = [
    '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#00ffff', '#ff00ff', '#ff9900', '#9900ff',
    '#ff69b4', '#32cd32', '#8b4513', '#4169e1', '#ffa07a'
];

const colorPalette = document.getElementById('color-palette');
colors.forEach(color => {
    const colorBtn = document.createElement('button');
    colorBtn.className = 'color-btn';
    colorBtn.style.backgroundColor = color;
    colorBtn.addEventListener('click', () => {
        currentColor = color;
        document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('active'));
        colorBtn.classList.add('active');
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

// Temizle butonu - sadece çizimleri temizler
document.getElementById('clear-btn').addEventListener('click', () => {
    // History canvas'tan orijinal resmi geri yükle
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (backgroundImage) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    }
    // Rainbow modunu kapat
    if (currentTool === 'rainbow') {
        setTool('brush');
    }
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
            // Ana canvas'ı temizle ve resmi çiz
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            // History canvas'ı da güncelle
            historyCtx.clearRect(0, 0, canvas.width, canvas.height);
            historyCtx.drawImage(img, 0, 0, canvas.width, canvas.height);
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
    sidebar.classList.toggle('collapsed');
    this.classList.toggle('collapsed');
});

// Mobil menü
document.getElementById('toggle-sidebar').addEventListener('click', function() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('show');
});