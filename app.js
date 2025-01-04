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
function floodFill(startX, startY, fillColor) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Başlangıç noktasının rengini al
    const startPos = (startY * canvas.width + startX) * 4;
    const startR = pixels[startPos];
    const startG = pixels[startPos + 1];
    const startB = pixels[startPos + 2];
    const startA = pixels[startPos + 3];

    // Yeni renk değerlerini al
    const fillR = parseInt(fillColor.substr(1, 2), 16);
    const fillG = parseInt(fillColor.substr(3, 2), 16);
    const fillB = parseInt(fillColor.substr(5, 2), 16);

    // Renk toleransı
    const tolerance = 30;

    function matchesStartColor(pos) {
        return Math.abs(pixels[pos] - startR) <= tolerance &&
               Math.abs(pixels[pos + 1] - startG) <= tolerance &&
               Math.abs(pixels[pos + 2] - startB) <= tolerance &&
               Math.abs(pixels[pos + 3] - startA) <= tolerance;
    }

    function colorPixel(pos) {
        pixels[pos] = fillR;
        pixels[pos + 1] = fillG;
        pixels[pos + 2] = fillB;
        pixels[pos + 3] = 255;
    }

    // Flood fill algoritması
    const pixelsToCheck = [[startX, startY]];
    const visited = new Set();

    while (pixelsToCheck.length) {
        const [x, y] = pixelsToCheck.pop();
        const pos = (y * canvas.width + x) * 4;
        const key = `${x},${y}`;

        if (visited.has(key)) continue;
        visited.add(key);

        if (!matchesStartColor(pos)) continue;

        colorPixel(pos);

        // Komşu pikselleri kontrol et
        if (x > 0) pixelsToCheck.push([x - 1, y]);
        if (x < canvas.width - 1) pixelsToCheck.push([x + 1, y]);
        if (y > 0) pixelsToCheck.push([x, y - 1]);
        if (y < canvas.height - 1) pixelsToCheck.push([x, y + 1]);
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

// PWA Kurulumu
let deferredPrompt;
const installPrompt = document.querySelector('.install-prompt');
const installButton = document.querySelector('.install-btn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installPrompt.classList.add('show');
});

installButton.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('Uygulama kuruldu');
        }
        deferredPrompt = null;
        installPrompt.classList.remove('show');
    }
});

// Service Worker Kaydı
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
                console.log('ServiceWorker başarıyla kaydedildi');
            })
            .catch(error => {
                console.log('ServiceWorker kaydı başarısız:', error);
            });
    });
}

// Toolbar Genişletme
const toolbar = document.getElementById('toolbar');
const expandBtn = document.querySelector('.expand-btn');
let isExpanded = false;

expandBtn.addEventListener('click', () => {
    isExpanded = !isExpanded;
    toolbar.classList.toggle('expanded');
    expandBtn.querySelector('i').classList.toggle('fa-chevron-up');
    expandBtn.querySelector('i').classList.toggle('fa-chevron-down');
});

// Resim Yükleme
const fileInput = document.getElementById('file-input');
fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                const aspectRatio = img.width / img.height;
                const maxWidth = canvas.width * 0.8;
                const maxHeight = canvas.height * 0.8;
                
                let newWidth, newHeight;
                if (img.width > img.height) {
                    newWidth = maxWidth;
                    newHeight = maxWidth / aspectRatio;
                } else {
                    newHeight = maxHeight;
                    newWidth = maxHeight * aspectRatio;
                }

                const x = (canvas.width - newWidth) / 2;
                const y = (canvas.height - newHeight) / 2;
                
                ctx.drawImage(img, x, y, newWidth, newHeight);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Otomatik Boyama Alanları
const autoFillButtons = document.querySelectorAll('.auto-fill-btn');
const areas = {
    head: { x: 300, y: 200, radius: 80 },
    body: { x: 300, y: 350, width: 160, height: 200 },
    hat: { x: 300, y: 120, width: 100, height: 60 },
    wings: { x: 400, y: 350, width: 60, height: 100 }
};

autoFillButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const area = btn.dataset.area;
        const currentColor = document.querySelector('.color-btn.active').style.backgroundColor;
        
        if (area === 'head') {
            ctx.beginPath();
            ctx.fillStyle = currentColor;
            ctx.arc(areas.head.x, areas.head.y, areas.head.radius, 0, Math.PI * 2);
            ctx.fill();
        } else if (area === 'body') {
            ctx.fillStyle = currentColor;
            ctx.fillRect(
                areas.body.x - areas.body.width/2,
                areas.body.y - areas.body.height/2,
                areas.body.width,
                areas.body.height
            );
        } else if (area === 'hat') {
            ctx.fillStyle = currentColor;
            ctx.fillRect(
                areas.hat.x - areas.hat.width/2,
                areas.hat.y - areas.hat.height/2,
                areas.hat.width,
                areas.hat.height
            );
        } else if (area === 'wings') {
            ctx.fillStyle = currentColor;
            ctx.beginPath();
            ctx.ellipse(
                areas.wings.x,
                areas.wings.y,
                areas.wings.width/2,
                areas.wings.height/2,
                0,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    });
});

// Mobil menü kontrolü
const toggleSidebar = document.getElementById('toggle-sidebar');
const sidebar = document.getElementById('sidebar');

toggleSidebar.addEventListener('click', () => {
    sidebar.classList.toggle('show');
});

// Canvas'ın dışına tıklandığında menüyü kapat
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && 
        !sidebar.contains(e.target) && 
        !toggleSidebar.contains(e.target) &&
        sidebar.classList.contains('show')) {
        sidebar.classList.remove('show');
    }
});

// Renk dönüşüm yardımcısı
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// RGB'den HEX'e dönüşüm
function rgbToHex(rgb) {
    const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!match) return rgb;
    
    function hex(x) {
        return ("0" + parseInt(x).toString(16)).slice(-2);
    }
    
    return "#" + hex(match[1]) + hex(match[2]) + hex(match[3]);
}

// Canvas tıklama olayını güncelle
canvas.addEventListener(isTouchDevice ? 'touchstart' : 'mousedown', function(e) {
    const rect = canvas.getBoundingClientRect();
    const x = isTouchDevice ? 
        e.touches[0].clientX - rect.left : 
        e.clientX - rect.left;
    const y = isTouchDevice ? 
        e.touches[0].clientY - rect.top : 
        e.clientY - rect.top;

    if (currentTool === 'fill') {
        const currentColor = document.querySelector('.color-btn.active').style.backgroundColor;
        floodFill(Math.floor(x), Math.floor(y), rgbToHex(currentColor));
    } else {
        isDrawing = true;
        lastX = x;
        lastY = y;
    }
});

// Başlangıç
resizeCanvas();
createColorPalette();
preloadImages();