const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');

// Temel değişkenler
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let currentColor = '#000000';
let currentSize = 10;
let currentTool = 'brush';

// Canvas boyutunu ayarla
function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    drawImage();
}

// Renkler
const colors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
    '#008000', '#FFC0CB', '#800000', '#808000', '#000080',
    '#FFA07A', '#7B68EE', '#98FB98', '#DDA0DD', '#F0E68C'
];

// Renk paletini oluştur
function createColorPalette() {
    const palette = document.getElementById('color-palette');
    colors.forEach(color => {
        const btn = document.createElement('button');
        btn.className = 'color-btn';
        btn.style.background = color;
        if (color === currentColor) btn.classList.add('active');
        btn.addEventListener('click', () => {
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentColor = color;
            currentTool = 'brush';
            updateToolButtons();
        });
        palette.appendChild(btn);
    });
}

// Resimler
const images = ['images/duck1.png', 'images/duck2.png', 'images/duck3.png', 'images/noel.png'];
const loadedImages = [];
let currentImageIndex = 0;

// Resimleri yükle
function preloadImages() {
    images.forEach((src, index) => {
        const img = new Image();
        img.onload = () => {
            loadedImages[index] = img;
            if (index === 0) drawImage();
        };
        img.onerror = () => console.error('Resim yüklenemedi:', src);
        img.src = src;
    });
}

// Resmi çiz
function drawImage() {
    if (loadedImages[currentImageIndex]) {
        const img = loadedImages[currentImageIndex];
        const scale = Math.min(
            canvas.width / img.width,
            canvas.height / img.height
        );
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    }
}

// Resim değiştirme
function changeImage(direction) {
    if (direction === 'next') {
        currentImageIndex = (currentImageIndex + 1) % images.length;
    } else {
        currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
    }
    drawImage();
}

// Çizim fonksiyonları
function startDrawing(e) {
    isDrawing = true;
    const pos = getMousePos(e);
    lastX = pos.x;
    lastY = pos.y;
    
    if (currentTool === 'fill') {
        floodFill(pos.x, pos.y);
    }
}

function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    
    const pos = getMousePos(e);
    
    if (currentTool === 'eraser') {
        erase(pos.x, pos.y);
    } else if (currentTool === 'brush') {
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = currentSize;
        ctx.lineCap = 'round';
        ctx.stroke();
    }
    
    lastX = pos.x;
    lastY = pos.y;
}

function stopDrawing() {
    isDrawing = false;
}

// Silgi fonksiyonu
function erase(x, y) {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, currentSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// Otomatik boyama fonksiyonu
function floodFill(startX, startY) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    const startPos = (startY * canvas.width + startX) * 4;
    const startR = pixels[startPos];
    const startG = pixels[startPos + 1];
    const startB = pixels[startPos + 2];
    const startA = pixels[startPos + 3];
    
    const fillR = parseInt(currentColor.substr(1, 2), 16);
    const fillG = parseInt(currentColor.substr(3, 2), 16);
    const fillB = parseInt(currentColor.substr(5, 2), 16);
    
    const tolerance = 30;
    
    function matchesStart(pos) {
        return Math.abs(pixels[pos] - startR) <= tolerance &&
               Math.abs(pixels[pos + 1] - startG) <= tolerance &&
               Math.abs(pixels[pos + 2] - startB) <= tolerance &&
               Math.abs(pixels[pos + 3] - startA) <= tolerance;
    }
    
    const stack = [[startX, startY]];
    const visited = new Set();
    
    while (stack.length > 0) {
        const [x, y] = stack.pop();
        
        if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
            continue;
        }
        
        const pos = (y * canvas.width + x) * 4;
        const key = `${x},${y}`;
        
        if (visited.has(key) || !matchesStart(pos)) {
            continue;
        }
        
        visited.add(key);
        
        pixels[pos] = fillR;
        pixels[pos + 1] = fillG;
        pixels[pos + 2] = fillB;
        pixels[pos + 3] = 255;
        
        stack.push(
            [x + 1, y],
            [x - 1, y],
            [x, y + 1],
            [x, y - 1]
        );
    }
    
    ctx.putImageData(imageData, 0, 0);
}

// Yardımcı fonksiyonlar
function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    return { x, y };
}

function updateToolButtons() {
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    let activeBtn;
    switch(currentTool) {
        case 'brush':
            activeBtn = document.getElementById('brush-tool');
            break;
        case 'eraser':
            activeBtn = document.getElementById('eraser-tool');
            break;
        case 'fill':
            activeBtn = document.getElementById('fill-tool');
            break;
    }
    if (activeBtn) activeBtn.classList.add('active');
}

// Event Listeners
window.addEventListener('resize', resizeCanvas);

// Mouse Events
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// Touch Events
canvas.addEventListener('touchstart', startDrawing, { passive: false });
canvas.addEventListener('touchmove', draw, { passive: false });
canvas.addEventListener('touchend', stopDrawing);
canvas.addEventListener('touchcancel', stopDrawing);

document.getElementById('brush-tool').addEventListener('click', () => {
    currentTool = 'brush';
    updateToolButtons();
});

document.getElementById('eraser-tool').addEventListener('click', () => {
    currentTool = 'eraser';
    updateToolButtons();
});

document.getElementById('fill-tool').addEventListener('click', () => {
    currentTool = 'fill';
    updateToolButtons();
});

document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSize = parseInt(btn.dataset.size);
    });
});

document.getElementById('prev-image').addEventListener('click', () => changeImage('prev'));
document.getElementById('next-image').addEventListener('click', () => changeImage('next'));

document.getElementById('clear-btn').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawImage();
});

document.getElementById('save-btn').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'paper-duck.png';
    link.href = canvas.toDataURL();
    link.click();
});

// Balon partisi değişkenleri
let isPartyMode = false;
let balloons = [];

// Balon sınıfı
class Balloon {
    constructor() {
        this.x = Math.random() * window.innerWidth;
        this.y = window.innerHeight + 50;
        this.size = 30 + Math.random() * 20;
        this.color = `hsl(${Math.random() * 360}, 80%, 60%)`;
        this.speedY = -2 - Math.random() * 2;
        this.speedX = (Math.random() - 0.5) * 2;
        this.element = document.createElement('div');
        this.element.className = 'balloon';
        this.element.style.width = `${this.size}px`;
        this.element.style.height = `${this.size * 1.2}px`;
        this.element.style.background = this.color;
        this.element.style.borderRadius = '50% 50% 50% 50% / 60% 60% 40% 40%';
        this.element.style.position = 'fixed';
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
        document.body.appendChild(this.element);
    }

    update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
        return this.y < -50;
    }

    remove() {
        this.element.remove();
    }
}

// Balon partisi fonksiyonları
function startParty() {
    if (isPartyMode) return;
    isPartyMode = true;
    addBalloons();
}

function stopParty() {
    isPartyMode = false;
    balloons.forEach(balloon => balloon.remove());
    balloons = [];
}

function addBalloons() {
    if (!isPartyMode) return;
    
    const balloon = new Balloon();
    balloons.push(balloon);
    
    // Balonları güncelle
    balloons = balloons.filter(balloon => {
        const shouldRemove = balloon.update();
        if (shouldRemove) {
            balloon.remove();
            return false;
        }
        return true;
    });
    
    if (balloons.length < 20) {
        setTimeout(addBalloons, 500);
    }
    
    requestAnimationFrame(() => {
        if (isPartyMode) {
            addBalloons();
        }
    });
}

// Parti butonu event listener'ı
document.getElementById('party-btn').addEventListener('click', () => {
    if (isPartyMode) {
        stopParty();
        document.getElementById('party-btn').classList.remove('active');
    } else {
        startParty();
        document.getElementById('party-btn').classList.add('active');
    }
});

// Başlangıç
resizeCanvas();
createColorPalette();
preloadImages();