// Canvas ve context
const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');

// Başlangıç ayarları
ctx.strokeStyle = '#000000';
ctx.lineJoin = 'round';
ctx.lineCap = 'round';
ctx.lineWidth = 10;

// Aktif çizim durumu
let isDrawing = false;
let currentTool = 'brush';
let currentColor = '#000000';
let currentSize = 10;
let lastX = 0;
let lastY = 0;
let hue = 0;
let partySize = 5;
let partyDirection = true;
let selectedShape = null;
let shapes = [];
let activeShape = null;
let isDraggingShape = false;
let isResizingShape = false;
let resizeHandle = null;
const isTouchDevice = 'ontouchstart' in window;

// Şekil sınıfı
class Shape {
    constructor(type, x, y, size, color) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.isSelected = false;
    }

    draw() {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.isSelected ? '#00ff00' : this.color;
        ctx.lineWidth = 2;

        switch(this.type) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'square':
                ctx.fillRect(this.x - this.size, this.y - this.size, this.size * 2, this.size * 2);
                break;
            case 'triangle':
                ctx.beginPath();
                ctx.moveTo(this.x, this.y - this.size);
                ctx.lineTo(this.x - this.size, this.y + this.size);
                ctx.lineTo(this.x + this.size, this.y + this.size);
                ctx.closePath();
                ctx.fill();
                break;
            case 'star':
                this.drawStar();
                break;
            case 'heart':
                this.drawHeart();
                break;
        }

        if (this.isSelected) {
            // Seçim çerçevesi
            ctx.strokeStyle = '#00ff00';
            ctx.strokeRect(this.x - this.size - 10, this.y - this.size - 10, 
                          (this.size + 10) * 2, (this.size + 10) * 2);
            
            // Boyutlandırma noktaları
            const handles = this.getResizeHandles();
            handles.forEach(handle => {
                ctx.fillStyle = '#00ff00';
                ctx.beginPath();
                ctx.arc(handle.x, handle.y, 5, 0, Math.PI * 2);
                ctx.fill();
            });
        }
        ctx.restore();
    }

    drawStar() {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * this.size + this.x,
                      Math.sin((18 + i * 72) * Math.PI / 180) * this.size + this.y);
            ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * (this.size/2) + this.x,
                      Math.sin((54 + i * 72) * Math.PI / 180) * (this.size/2) + this.y);
        }
        ctx.closePath();
        ctx.fill();
    }

    drawHeart() {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.size * 0.7);
        ctx.bezierCurveTo(this.x, this.y + this.size * 0.7, 
                         this.x - this.size, this.y + this.size * 0.4,
                         this.x - this.size, this.y);
        ctx.bezierCurveTo(this.x - this.size, this.y - this.size * 0.8,
                         this.x, this.y - this.size * 0.8,
                         this.x, this.y);
        ctx.bezierCurveTo(this.x, this.y - this.size * 0.8,
                         this.x + this.size, this.y - this.size * 0.8,
                         this.x + this.size, this.y);
        ctx.bezierCurveTo(this.x + this.size, this.y + this.size * 0.4,
                         this.x, this.y + this.size * 0.7,
                         this.x, this.y + this.size * 0.7);
        ctx.fill();
    }

    contains(x, y) {
        const distance = Math.sqrt((x - this.x) ** 2 + (y - this.y) ** 2);
        return distance <= this.size;
    }

    getResizeHandles() {
        return [
            { x: this.x - this.size - 10, y: this.y - this.size - 10 }, // Sol üst
            { x: this.x + this.size + 10, y: this.y - this.size - 10 }, // Sağ üst
            { x: this.x - this.size - 10, y: this.y + this.size + 10 }, // Sol alt
            { x: this.x + this.size + 10, y: this.y + this.size + 10 }  // Sağ alt
        ];
    }

    isOnResizeHandle(x, y) {
        const handles = this.getResizeHandles();
        for (let i = 0; i < handles.length; i++) {
            const handle = handles[i];
            const distance = Math.sqrt((x - handle.x) ** 2 + (y - handle.y) ** 2);
            if (distance <= 5) {
                return i;
            }
        }
        return -1;
    }
}

// Parti efektleri
function drawParty(e) {
    ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
    ctx.lineWidth = partySize;
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    
    [lastX, lastY] = [e.offsetX, e.offsetY];
    
    hue += 3;
    if (hue >= 360) hue = 0;
    
    if (partySize >= 50 || partySize <= 5) {
        partyDirection = !partyDirection;
    }
    
    if (partyDirection) {
        partySize += 2;
    } else {
        partySize -= 2;
    }
}

// Canvas olayları
function startDrawing(e) {
    isDrawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];

    if (currentTool === 'shape') {
        const newShape = new Shape(selectedShape, e.offsetX, e.offsetY, currentSize, currentColor);
        shapes.push(newShape);
        activeShape = newShape;
        redrawCanvas();
    } else if (currentTool === 'select') {
        // Şekil seçimi veya boyutlandırma kontrolü
        let clickedShape = null;
        for (let i = shapes.length - 1; i >= 0; i--) {
            const shape = shapes[i];
            const handleIndex = shape.isOnResizeHandle(e.offsetX, e.offsetY);
            
            if (handleIndex !== -1 && shape.isSelected) {
                isResizingShape = true;
                resizeHandle = handleIndex;
                activeShape = shape;
                break;
            } else if (shape.contains(e.offsetX, e.offsetY)) {
                clickedShape = shape;
                break;
            }
        }

        if (clickedShape) {
            isDraggingShape = true;
            activeShape = clickedShape;
            shapes.forEach(s => s.isSelected = false);
            clickedShape.isSelected = true;
        } else if (!isResizingShape) {
            shapes.forEach(s => s.isSelected = false);
            activeShape = null;
        }
        redrawCanvas();
    }
}

function draw(e) {
    if (!isDrawing) return;

    switch(currentTool) {
        case 'brush':
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(e.offsetX, e.offsetY);
            ctx.stroke();
            [lastX, lastY] = [e.offsetX, e.offsetY];
            break;
            
        case 'eraser':
            ctx.save();
            ctx.strokeStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(e.offsetX, e.offsetY);
            ctx.stroke();
            ctx.restore();
            [lastX, lastY] = [e.offsetX, e.offsetY];
            break;
            
        case 'party':
            drawParty(e);
            break;
            
        case 'shape':
            if (activeShape) {
                activeShape.size = Math.max(
                    Math.abs(e.offsetX - activeShape.x),
                    Math.abs(e.offsetY - activeShape.y)
                ) / 2;
                redrawCanvas();
            }
            break;
            
        case 'select':
            if (isDraggingShape && activeShape) {
                activeShape.x = e.offsetX;
                activeShape.y = e.offsetY;
                redrawCanvas();
            } else if (isResizingShape && activeShape) {
                const dx = e.offsetX - activeShape.x;
                const dy = e.offsetY - activeShape.y;
                activeShape.size = Math.max(Math.abs(dx), Math.abs(dy));
                redrawCanvas();
            }
            break;
    }
}

function stopDrawing() {
    isDrawing = false;
    isDraggingShape = false;
    isResizingShape = false;
    resizeHandle = null;
}

// Temizle butonu
document.getElementById('clear-btn').addEventListener('click', () => {
    // Geçici canvas oluştur
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    
    // Mevcut resmi geçici canvas'a kopyala
    if (currentImageIndex >= 0 && currentImageIndex < images.length) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = function() {
            const scale = Math.min(
                (canvas.width * 0.8) / img.width,
                (canvas.height * 0.8) / img.height
            );
            
            const x = (canvas.width - img.width * scale) / 2;
            const y = (canvas.height - img.height * scale) / 2;
            
            // Ana canvas'ı temizle
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Resmi çiz
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            
            // Şekilleri tekrar çiz
            shapes.forEach(shape => shape.draw());
        };
        img.src = images[currentImageIndex];
    }
});

// Araç butonları
document.getElementById('brush-tool').addEventListener('click', () => {
    currentTool = 'brush';
    updateToolButtons('brush-tool');
});

document.getElementById('eraser-tool').addEventListener('click', () => {
    currentTool = 'eraser';
    updateToolButtons('eraser-tool');
});

document.getElementById('party-tool').addEventListener('click', () => {
    currentTool = 'party';
    updateToolButtons('party-tool');
    partySize = 5;
    partyDirection = true;
});

// Şekil butonları
document.querySelectorAll('[id^="shape-"]').forEach(button => {
    button.addEventListener('click', () => {
        const shapeType = button.id.replace('shape-', '');
        currentTool = 'shape';
        selectedShape = shapeType;
        updateToolButtons(button.id);
    });
});

// Seçim aracı
document.getElementById('select-tool').addEventListener('click', () => {
    currentTool = 'select';
    updateToolButtons('select-tool');
});

function updateToolButtons(activeId) {
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(activeId).classList.add('active');
}

// Event listeners
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// Parti efektleri
function drawRainbow(e) {
    ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    [lastX, lastY] = [e.offsetX, e.offsetY];
    
    hue++;
    if (hue >= 360) hue = 0;
    
    if (ctx.lineWidth >= 50 || ctx.lineWidth <= 5) {
        direction = !direction;
    }
    
    if (direction) {
        ctx.lineWidth++;
    } else {
        ctx.lineWidth--;
    }
}

function drawSparkle(e) {
    const size = Math.random() * 10 + 5;
    const angle = Math.random() * Math.PI * 2;
    const colors = ['#FFD700', '#FFA500', '#FF69B4', '#00FF00', '#4169E1'];
    
    ctx.save();
    ctx.translate(e.offsetX, e.offsetY);
    ctx.rotate(angle);
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * size,
                  Math.sin((18 + i * 72) * Math.PI / 180) * size);
        ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * (size/2),
                  Math.sin((54 + i * 72) * Math.PI / 180) * (size/2));
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawConfetti(e) {
    const colors = ['#FF69B4', '#4169E1', '#FFD700', '#32CD32', '#FF4500'];
    const size = Math.random() * 10 + 5;
    
    for (let i = 0; i < 5; i++) {
        const x = e.offsetX + (Math.random() - 0.5) * 50;
        const y = e.offsetY + (Math.random() - 0.5) * 50;
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.fillRect(x, y, size, size);
    }
}

// Parti efekt butonları
document.getElementById('party-rainbow').addEventListener('click', () => {
    currentTool = 'rainbow';
    updateToolButtons('party-rainbow');
});

document.getElementById('party-sparkle').addEventListener('click', () => {
    currentTool = 'sparkle';
    updateToolButtons('party-sparkle');
});

document.getElementById('party-confetti').addEventListener('click', () => {
    currentTool = 'confetti';
    updateToolButtons('party-confetti');
});

// Canvas boyutlandırma
function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Pencere boyutu değiştiğinde canvas'ı yeniden boyutlandır
window.addEventListener('resize', resizeCanvas);

// Renk paleti oluştur
function createColorPalette() {
    const colors = [
        '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00',
        '#00ffff', '#ff00ff', '#c0c0c0', '#808080', '#800000', '#808000',
        '#008000', '#800080', '#008080', '#000080', '#ff6b6b', '#4ecdc4',
        '#45b7d1', '#96ceb4', '#ffeead', '#ff6f69', '#ffcc5c', '#88d8b0'
    ];

    const palette = document.getElementById('color-palette');
    colors.forEach(color => {
        const button = document.createElement('button');
        button.className = 'color-btn';
        button.style.backgroundColor = color;
        if (color === currentColor) button.classList.add('active');
        button.addEventListener('click', () => {
            document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentColor = color;
            if (currentTool === 'eraser') {
                currentTool = 'brush';
                document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
                document.getElementById('brush-tool').classList.add('active');
            }
            updateBrushStyle();
        });
        palette.appendChild(button);
    });
}

// Boyut butonlarını ayarla
document.querySelectorAll('.size-btn').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentSize = parseInt(button.dataset.size);
        updateBrushStyle();
    });
});

// Fırça stilini güncelle
function updateBrushStyle() {
    if (currentTool === 'eraser') {
        ctx.strokeStyle = '#ffffff';
    } else {
        ctx.strokeStyle = currentColor;
    }
    ctx.lineWidth = currentSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
}

// Çizim olayları
canvas.addEventListener(isTouchDevice ? 'touchstart' : 'mousedown', startDrawing);
canvas.addEventListener(isTouchDevice ? 'touchmove' : 'mousemove', draw);
canvas.addEventListener(isTouchDevice ? 'touchend' : 'mouseup', stopDrawing);
canvas.addEventListener('mouseleave', stopDrawing);

function getCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = isTouchDevice ? e.touches[0].clientX : e.clientX;
    const clientY = isTouchDevice ? e.touches[0].clientY : e.clientY;
    return {
        x: Math.floor((clientX - rect.left) * (canvas.width / rect.width)),
        y: Math.floor((clientY - rect.top) * (canvas.height / rect.height))
    };
}

function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    shapes.forEach(shape => shape.draw());
}

// Dosya işlemleri
document.getElementById('save-btn').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'cizim.png';
    link.href = canvas.toDataURL();
    link.click();
});

const fileInput = document.getElementById('file-input');
fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Mobil menü kontrolü
const toggleSidebar = document.getElementById('toggle-sidebar');
const sidebar = document.getElementById('sidebar');

toggleSidebar.addEventListener('click', () => {
    sidebar.classList.toggle('show');
});

document.addEventListener('click', (e) => {
    if (sidebar.classList.contains('show') &&
        !sidebar.contains(e.target) &&
        !toggleSidebar.contains(e.target)) {
        sidebar.classList.remove('show');
    }
});

// Parti efekti
document.getElementById('party-btn').addEventListener('click', () => {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    let colorIndex = 0;
    
    function confetti() {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 10 + 5;
        
        ctx.fillStyle = colors[colorIndex];
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        
        colorIndex = (colorIndex + 1) % colors.length;
    }
    
    let count = 0;
    const interval = setInterval(() => {
        confetti();
        count++;
        if (count >= 100) clearInterval(interval);
    }, 50);
});

// Resim değişkenleri
const REPO_OWNER = 'showman1907';
const REPO_NAME = 'duck';
const IMAGE_PATH = 'images';
let currentImageIndex = 0;
let images = [];

// GitHub'dan resimleri çek
async function fetchImagesFromGitHub() {
    try {
        const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${IMAGE_PATH}`);
        const data = await response.json();
        
        // Sadece resim dosyalarını filtrele
        images = data.filter(file => 
            file.name.match(/\.(jpg|jpeg|png|gif)$/i)
        ).map(file => file.download_url);
        
        if (images.length > 0) {
            loadAndDrawImage(0);
        }
    } catch (error) {
        console.error('Resimler yüklenemedi:', error);
    }
}

// Resmi yükle ve çiz
function loadAndDrawImage(index) {
    if (index >= 0 && index < images.length) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = function() {
            // Canvas'ı temizle
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Resmi ortala ve boyutlandır
            const scale = Math.min(
                (canvas.width * 0.8) / img.width,
                (canvas.height * 0.8) / img.height
            );
            
            const x = (canvas.width - img.width * scale) / 2;
            const y = (canvas.height - img.height * scale) / 2;
            
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            currentImageIndex = index;
            updateImageButtons();
        };
        img.src = images[index];
    }
}

// Resim değiştirme butonlarını güncelle
function updateImageButtons() {
    const prevBtn = document.getElementById('prev-image');
    const nextBtn = document.getElementById('next-image');
    
    if (prevBtn && nextBtn) {
        prevBtn.disabled = currentImageIndex <= 0;
        nextBtn.disabled = currentImageIndex >= images.length - 1;
    }
}

// Resim değiştirme fonksiyonları
function changeImage(direction) {
    let newIndex;
    if (direction === 'next' && currentImageIndex < images.length - 1) {
        newIndex = currentImageIndex + 1;
    } else if (direction === 'prev' && currentImageIndex > 0) {
        newIndex = currentImageIndex - 1;
    } else {
        return;
    }
    loadAndDrawImage(newIndex);
}

document.getElementById('prev-image').addEventListener('click', () => {
    changeImage('prev');
});

document.getElementById('next-image').addEventListener('click', () => {
    changeImage('next');
});

// Başlangıç
resizeCanvas();
createColorPalette();
updateBrushStyle();
fetchImagesFromGitHub();