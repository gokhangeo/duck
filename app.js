// Canvas ve context
const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');

// Değişkenler
let isDrawing = false;
let currentTool = 'brush';
let currentColor = '#000000';
let currentSize = 10;
let lastX = 0;
let lastY = 0;
const isTouchDevice = 'ontouchstart' in window;

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

// Araç butonlarını ayarla
document.querySelectorAll('.tool-btn').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentTool = button.id.replace('-tool', '');
        updateBrushStyle();
    });
});

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

function startDrawing(e) {
    e.preventDefault();
    isDrawing = true;
    const coords = getCoordinates(e);
    
    if (currentTool === 'fill') {
        const fillColor = currentColor;
        floodFill(coords.x, coords.y, fillColor);
    } else {
        lastX = coords.x;
        lastY = coords.y;
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
    }
}

function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    
    const coords = getCoordinates(e);
    
    if (currentTool === 'brush' || currentTool === 'eraser') {
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
    }
}

function stopDrawing() {
    isDrawing = false;
    ctx.beginPath();
}

// Flood fill algoritması
function floodFill(startX, startY, fillColor) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const startPos = (startY * canvas.width + startX) * 4;
    
    const startR = pixels[startPos];
    const startG = pixels[startPos + 1];
    const startB = pixels[startPos + 2];
    
    const fillColorObj = hexToRgb(fillColor);
    if (!fillColorObj) return;
    
    const fillR = fillColorObj.r;
    const fillG = fillColorObj.g;
    const fillB = fillColorObj.b;
    
    if (startR === fillR && startG === fillG && startB === fillB) {
        return;
    }
    
    const tolerance = 30;
    const queue = [[startX, startY]];
    const visited = new Set();
    
    function matchesStartColor(pos) {
        return Math.abs(pixels[pos] - startR) <= tolerance &&
               Math.abs(pixels[pos + 1] - startG) <= tolerance &&
               Math.abs(pixels[pos + 2] - startB) <= tolerance;
    }
    
    function setPixel(pos) {
        pixels[pos] = fillR;
        pixels[pos + 1] = fillG;
        pixels[pos + 2] = fillB;
        pixels[pos + 3] = 255;
    }
    
    while (queue.length) {
        const [x, y] = queue.shift();
        const pos = (y * canvas.width + x) * 4;
        const key = `${x},${y}`;
        
        if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height ||
            visited.has(key) || !matchesStartColor(pos)) {
            continue;
        }
        
        visited.add(key);
        setPixel(pos);
        
        queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    
    ctx.putImageData(imageData, 0, 0);
}

// Yardımcı fonksiyonlar
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// Dosya işlemleri
document.getElementById('clear-btn').addEventListener('click', () => {
    if (confirm('Tüm çizimi silmek istediğinizden emin misiniz?')) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        updateBrushStyle();
    }
});

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