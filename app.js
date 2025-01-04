// Canvas ve context
const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');

// Araç ve mod değişkenleri
let currentTool = 'brush';
let isDrawing = false;
let currentColor = '#000000';
let brushSize = 10;
let lastX = 0;
let lastY = 0;
let partyMode = false;
let partyHue = 0;
let backgroundImage = null;

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

function setTool(tool) {
    if (tool !== 'party' && currentTool === 'party') {
        partyMode = false;
    }
    
    currentTool = tool;
    if (tool === 'party') {
        partyMode = true;
        partyHue = 0;
    }
    
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`${tool}-tool`).classList.add('active');
}

function startDrawing(e) {
    isDrawing = true;
    const pos = getMousePos(canvas, e);
    lastX = pos.x;
    lastY = pos.y;
}

function draw(e) {
    if (!isDrawing) return;
    
    const pos = getMousePos(canvas, e);
    const x = pos.x;
    const y = pos.y;

    if (currentTool === 'party') {
        drawPartyLine(lastX, lastY, x, y);
    } else {
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = currentTool === 'eraser' ? '#ffffff' : currentColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.stroke();
    }

    lastX = x;
    lastY = y;
}

function drawPartyLine(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = `hsl(${partyHue}, 100%, 50%)`;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.stroke();
    partyHue = (partyHue + 10) % 360;
}

function stopDrawing() {
    isDrawing = false;
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

// Temizle butonu
document.getElementById('clear-btn').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (backgroundImage) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    }
    if (currentTool === 'party') {
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
    sidebar.classList.toggle('collapsed');
    this.classList.toggle('collapsed');
});

// Mobil menü
document.getElementById('toggle-sidebar').addEventListener('click', function() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('show');
});