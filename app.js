const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');
let currentColor = '#FF0000';
let currentSize = 15;
let currentShape = 'brush';
let isDrawing = false;
let startX, startY;
let currentImageIndex = 0;
let shapes = [];
let selectedShape = null;
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

const images = ['/images/duck1.png', '/images/duck2.png', '/images/duck3.png'];
const loadedImages = [];

// Canvas boyutunu ayarla
function resizeCanvas() {
    const container = document.getElementById('canvas-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    if (loadedImages[currentImageIndex]) {
        drawImage();
        redrawShapes();
    }
}

// Şekil sınıfı
class Shape {
    constructor(type, x, y, size, color) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.id = Date.now() + Math.random();
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.strokeStyle = this.color;
        ctx.fillStyle = this.color;
        ctx.lineWidth = currentSize;

        switch(this.type) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size/2, 0, Math.PI * 2);
                ctx.stroke();
                break;
            case 'square':
                ctx.strokeRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
                break;
            case 'heart':
                this.drawHeart(ctx);
                break;
            case 'star':
                this.drawStar(ctx);
                break;
        }
    }

    drawHeart(ctx) {
        const size = this.size;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + size/4);
        ctx.bezierCurveTo(
            this.x, this.y, 
            this.x - size/2, this.y, 
            this.x - size/2, this.y + size/4
        );
        ctx.bezierCurveTo(
            this.x - size/2, this.y + size/2,
            this.x, this.y + size*3/4,
            this.x, this.y + size
        );
        ctx.bezierCurveTo(
            this.x, this.y + size*3/4,
            this.x + size/2, this.y + size/2,
            this.x + size/2, this.y + size/4
        );
        ctx.bezierCurveTo(
            this.x + size/2, this.y,
            this.x, this.y,
            this.x, this.y + size/4
        );
        ctx.stroke();
    }

    drawStar(ctx) {
        const outerRadius = this.size/2;
        const innerRadius = this.size/4;
        const spikes = 5;
        let rot = Math.PI / 2 * 3;
        let x = this.x;
        let y = this.y;
        let step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(this.x, this.y - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = this.x + Math.cos(rot) * outerRadius;
            y = this.y + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = this.x + Math.cos(rot) * innerRadius;
            y = this.y + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.lineTo(this.x, this.y - outerRadius);
        ctx.stroke();
    }

    isPointInside(x, y) {
        const distance = Math.sqrt(Math.pow(x - this.x, 2) + Math.pow(y - this.y, 2));
        return distance <= this.size/2;
    }
}

// Balon sınıfı
class Balloon {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 30 + Math.random() * 20;
        this.color = `hsl(${Math.random() * 360}, 80%, 60%)`;
        this.speedY = -2 - Math.random() * 2;
        this.speedX = (Math.random() - 0.5) * 2;
        this.isPopped = false;
        this.popProgress = 0;
    }

    update() {
        if (this.isPopped) {
            this.popProgress += 0.1;
            return this.popProgress >= 1;
        }
        this.y += this.speedY;
        this.x += this.speedX;
        return this.y < -50;
    }

    draw(ctx) {
        if (this.isPopped) {
            // Patlama animasyonu
            ctx.beginPath();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            const particles = 8;
            for (let i = 0; i < particles; i++) {
                const angle = (i / particles) * Math.PI * 2;
                const distance = this.size * this.popProgress;
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(
                    this.x + Math.cos(angle) * distance,
                    this.y + Math.sin(angle) * distance
                );
            }
            ctx.stroke();
        } else {
            // Balon çizimi
            ctx.beginPath();
            ctx.fillStyle = this.color;
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.lineWidth = 2;
            ctx.arc(this.x, this.y, this.size/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // İp
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + this.size/2);
            ctx.quadraticCurveTo(
                this.x + 5, this.y + this.size/2 + 10,
                this.x, this.y + this.size/2 + 20
            );
            ctx.stroke();
        }
    }

    isPointInside(x, y) {
        if (this.isPopped) return false;
        const distance = Math.sqrt(Math.pow(x - this.x, 2) + Math.pow(y - this.y, 2));
        return distance <= this.size/2;
    }
}

let balloons = [];
let isPartyMode = false;

function startParty() {
    isPartyMode = true;
    balloons = [];
    function addBalloon() {
        if (!isPartyMode) return;
        const x = Math.random() * canvas.width;
        const y = canvas.height + 50;
        balloons.push(new Balloon(x, y));
        if (balloons.length < 50) {
            setTimeout(addBalloon, 200);
        }
    }
    addBalloon();
    animateBalloons();
}

function animateBalloons() {
    if (!isPartyMode) return;
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    drawImage();
    ctx.putImageData(imageData, 0, 0);
    
    balloons = balloons.filter(balloon => {
        balloon.draw(ctx);
        return !balloon.update();
    });

    if (balloons.length > 0) {
        requestAnimationFrame(animateBalloons);
    } else {
        isPartyMode = false;
    }
}

// Resimleri önceden yükle
function preloadImages() {
    images.forEach((src, index) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            console.log('Resim başarıyla yüklendi:', src);
            loadedImages[index] = img;
            if (index === 0) {
                drawImage();
            }
        };
        img.onerror = (error) => {
            console.error('Resim yükleme hatası:', {
                src: src,
                error: error,
                path: window.location.href + src
            });
        };
    });
}

// Resmi canvas'a çiz
function drawImage() {
    const img = loadedImages[currentImageIndex];
    if (!img) return;

    const scale = Math.min(
        canvas.width / img.width,
        canvas.height / img.height
    ) * 0.9;

    const x = (canvas.width - img.width * scale) / 2;
    const y = (canvas.height - img.height * scale) / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
}

function redrawShapes() {
    shapes.forEach(shape => shape.draw(ctx));
}

// Çizim event fonksiyonları
function startDrawing(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.type === 'mousedown' ? e.clientX : e.touches[0].clientX) - rect.left;
    const y = (e.type === 'mousedown' ? e.clientY : e.touches[0].clientY) - rect.top;

    if (isPartyMode) {
        // Balon patlatma kontrolü
        const balloon = balloons.find(b => b.isPointInside(x, y));
        if (balloon) {
            balloon.isPopped = true;
            return;
        }
    }

    // Şekil seçme kontrolü
    selectedShape = shapes.find(shape => shape.isPointInside(x, y));
    if (selectedShape) {
        isDragging = true;
        dragOffsetX = x - selectedShape.x;
        dragOffsetY = y - selectedShape.y;
        return;
    }

    if (currentShape !== 'brush') {
        const newShape = new Shape(currentShape, x, y, 50, currentColor);
        shapes.push(newShape);
        selectedShape = newShape;
        isDragging = true;
        dragOffsetX = 0;
        dragOffsetY = 0;
    } else {
        isDrawing = true;
        startX = x;
        startY = y;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
    }
}

function draw(e) {
    if (!isDrawing && !isDragging) return;
    e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const x = (e.type === 'mousemove' ? e.clientX : e.touches[0].clientX) - rect.left;
    const y = (e.type === 'mousemove' ? e.clientY : e.touches[0].clientY) - rect.top;

    if (isDragging && selectedShape) {
        selectedShape.x = x - dragOffsetX;
        selectedShape.y = y - dragOffsetY;
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        drawImage();
        ctx.putImageData(imageData, 0, 0);
        shapes.forEach(shape => {
            if (shape !== selectedShape) shape.draw(ctx);
        });
        selectedShape.draw(ctx);
    } else if (isDrawing && currentShape === 'brush') {
        ctx.lineTo(x, y);
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = currentSize;
        ctx.lineCap = 'round';
        ctx.stroke();
    }
}

function stopDrawing() {
    isDrawing = false;
    isDragging = false;
    selectedShape = null;
    ctx.beginPath();
}

// Event Listeners
window.addEventListener('resize', resizeCanvas);
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('touchstart', startDrawing);
canvas.addEventListener('touchmove', draw);
canvas.addEventListener('touchend', stopDrawing);

// Renk seçimi
document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelector('.color-btn.active').classList.remove('active');
        btn.classList.add('active');
        currentColor = btn.dataset.color;
    });
});

// Kalem kalınlığı seçimi
document.querySelectorAll('.brush-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelector('.brush-btn.active').classList.remove('active');
        btn.classList.add('active');
        currentSize = parseInt(btn.dataset.size);
    });
});

// Şekil seçimi
document.querySelectorAll('.shape-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelector('.shape-btn.active').classList.remove('active');
        btn.classList.add('active');
        currentShape = btn.dataset.shape;
    });
});

// Temizle butonu
document.getElementById('clear-btn').addEventListener('click', () => {
    shapes = [];
    balloons = [];
    isPartyMode = false;
    drawImage();
});

// Sonraki resim
document.getElementById('next-btn').addEventListener('click', () => {
    currentImageIndex = (currentImageIndex + 1) % images.length;
    drawImage();
    redrawShapes();
});

// Balon partisi butonu
document.getElementById('party-btn').addEventListener('click', startParty);

// Yeni renk paleti
const colorPalette = [
    '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
    '#FFA500', '#800080', '#008000', '#FFC0CB', '#800000', '#808000',
    '#000080', '#FFA07A', '#7B68EE', '#98FB98', '#DDA0DD', '#F0E68C'
];

// Karışık renk oluşturma fonksiyonu
function createMixedColor(color1, color2) {
    const r1 = parseInt(color1.substr(1,2), 16);
    const g1 = parseInt(color1.substr(3,2), 16);
    const b1 = parseInt(color1.substr(5,2), 16);
    
    const r2 = parseInt(color2.substr(1,2), 16);
    const g2 = parseInt(color2.substr(3,2), 16);
    const b2 = parseInt(color2.substr(5,2), 16);
    
    const r = Math.round((r1 + r2) / 2);
    const g = Math.round((g1 + g2) / 2);
    const b = Math.round((b1 + b2) / 2);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Resim yükleme fonksiyonu
function loadCustomImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                loadedImages.push(img);
                currentImageIndex = loadedImages.length - 1;
                drawImage();
                redrawShapes();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// Çizimi kaydetme fonksiyonu
function saveDrawing() {
    const link = document.createElement('a');
    link.download = 'paper-duck-drawing.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// Emoji ekleme fonksiyonu
const emojis = ['😊', '🦆', '❤️', '⭐', '🌈', '🎨', '🎉', '🌺'];
function addEmoji(emoji, x, y) {
    ctx.font = `${currentSize * 2}px Arial`;
    ctx.fillText(emoji, x, y);
    shapes.push({
        type: 'emoji',
        x: x,
        y: y,
        content: emoji,
        size: currentSize * 2,
        draw: function(ctx) {
            ctx.font = `${this.size}px Arial`;
            ctx.fillText(this.content, this.x, this.y);
        }
    });
}

// Yazı ekleme fonksiyonu
function addText(text, x, y) {
    ctx.font = `${currentSize}px Arial`;
    ctx.fillStyle = currentColor;
    ctx.fillText(text, x, y);
    shapes.push({
        type: 'text',
        x: x,
        y: y,
        content: text,
        color: currentColor,
        size: currentSize,
        draw: function(ctx) {
            ctx.font = `${this.size}px Arial`;
            ctx.fillStyle = this.color;
            ctx.fillText(this.content, this.x, this.y);
        }
    });
}

// Silgi boyutları
const eraserSizes = [10, 20, 30, 50];
let currentEraserSize = eraserSizes[0];

// Otomatik boyama fonksiyonu
function floodFill(startX, startY, fillColor) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    const startPos = (startY * canvas.width + startX) * 4;
    const startR = pixels[startPos];
    const startG = pixels[startPos + 1];
    const startB = pixels[startPos + 2];
    const startA = pixels[startPos + 3];

    function matchesStart(pos) {
        return pixels[pos] === startR &&
               pixels[pos + 1] === startG &&
               pixels[pos + 2] === startB &&
               pixels[pos + 3] === startA;
    }

    const queue = [[startX, startY]];
    while (queue.length > 0) {
        const [x, y] = queue.pop();
        const pos = (y * canvas.width + x) * 4;

        if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height || !matchesStart(pos)) {
            continue;
        }

        // Rengi değiştir
        pixels[pos] = fillColor.r;
        pixels[pos + 1] = fillColor.g;
        pixels[pos + 2] = fillColor.b;
        pixels[pos + 3] = 255;

        queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }

    ctx.putImageData(imageData, 0, 0);
}

// Başlangıç
resizeCanvas();
preloadImages();

// Yeni renk paleti butonları
colorPalette.forEach(color => {
    const btn = document.createElement('button');
    btn.style.background = color;
    btn.addEventListener('click', () => {
        currentColor = color;
    });
    document.getElementById('color-palette').appendChild(btn);
});

// Resim yükleme butonu
document.getElementById('load-image-btn').addEventListener('change', loadCustomImage);

// Çizimi kaydetme butonu
document.getElementById('save-drawing-btn').addEventListener('click', saveDrawing);

// Emoji ekleme butonu
document.getElementById('add-emoji-btn').addEventListener('click', () => {
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    addEmoji(emoji, Math.random() * canvas.width, Math.random() * canvas.height);
});

// Yazı ekleme butonu
document.getElementById('add-text-btn').addEventListener('click', () => {
    const text = prompt('Yazıyı girin:');
    addText(text, Math.random() * canvas.width, Math.random() * canvas.height);
});

// Silgi boyutu seçimi
eraserSizes.forEach(size => {
    const btn = document.createElement('button');
    btn.textContent = size;
    btn.addEventListener('click', () => {
        currentEraserSize = size;
    });
    document.getElementById('eraser-sizes').appendChild(btn);
});

// Otomatik boyama butonu
document.getElementById('flood-fill-btn').addEventListener('click', () => {
    const fillColor = {
        r: Math.random() * 255,
        g: Math.random() * 255,
        b: Math.random() * 255
    };
    floodFill(Math.random() * canvas.width, Math.random() * canvas.height, fillColor);
});