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
let partyHue = 0;
let selectedShape = null;
let isResizing = false;
let resizeHandle = null;
let shapes = [];

// Parti efekti için değişkenler
let partyMode = false;
let partySize = 10;
let partySizeDirection = 1;

// Şekil çizimi için değişkenler
let isDrawingShape = false;
let currentShapeType = null;
let shapeStartX = 0;
let shapeStartY = 0;

// Seçim modu için değişkenler
let isSelecting = false;
let selectedShapeIndex = -1;

// Yüklenen resim için değişken
let loadedImage = null;

// Canvas boyutunu ayarla
function resizeCanvas() {
    const container = document.getElementById('canvas-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    redrawCanvas();
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
document.getElementById('select-tool').addEventListener('click', () => setTool('select'));

// Şekil butonları
document.getElementById('shape-circle').addEventListener('click', () => setShape('circle'));
document.getElementById('shape-square').addEventListener('click', () => setShape('square'));
document.getElementById('shape-triangle').addEventListener('click', () => setShape('triangle'));
document.getElementById('shape-star').addEventListener('click', () => setShape('star'));
document.getElementById('shape-heart').addEventListener('click', () => setShape('heart'));

function setTool(tool) {
    currentTool = tool;
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`${tool}-tool`).classList.add('active');
    
    if (tool === 'select') {
        canvas.style.cursor = 'pointer';
    } else {
        canvas.style.cursor = 'crosshair';
    }
}

function setShape(shape) {
    currentTool = 'shape';
    currentShapeType = shape;
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`shape-${shape}`).classList.add('active');
}

function startDrawing(e) {
    isDrawing = true;
    const pos = getMousePos(canvas, e);
    lastX = pos.x;
    lastY = pos.y;

    if (currentTool === 'shape') {
        isDrawingShape = true;
        shapeStartX = pos.x;
        shapeStartY = pos.y;
    } else if (currentTool === 'select') {
        handleSelection(pos.x, pos.y);
    }
}

function draw(e) {
    if (!isDrawing) return;
    
    const pos = getMousePos(canvas, e);
    const x = pos.x;
    const y = pos.y;

    if (currentTool === 'shape' && isDrawingShape) {
        redrawCanvas();
        drawShape(currentShapeType, shapeStartX, shapeStartY, x - shapeStartX, y - shapeStartY);
    } else if (currentTool === 'party') {
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

function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    
    if (currentTool === 'shape' && isDrawingShape) {
        isDrawingShape = false;
        const pos = getMousePos(canvas, event);
        const shape = {
            type: currentShapeType,
            x: shapeStartX,
            y: shapeStartY,
            width: pos.x - shapeStartX,
            height: pos.y - shapeStartY,
            color: currentColor
        };
        shapes.push(shape);
        redrawCanvas();
    }
}

function drawPartyLine(x1, y1, x2, y2) {
    // Parti efekti için değişken fırça boyutu
    partySize += partySizeDirection;
    if (partySize >= 50 || partySize <= 5) {
        partySizeDirection *= -1;
    }

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = `hsl(${partyHue}, 100%, 50%)`;
    ctx.lineWidth = partySize;
    ctx.lineCap = 'round';
    ctx.stroke();

    partyHue = (partyHue + 10) % 360;
}

function drawShape(type, x, y, width, height) {
    ctx.beginPath();
    ctx.strokeStyle = currentColor;
    ctx.fillStyle = currentColor;
    ctx.lineWidth = 2;

    switch (type) {
        case 'circle':
            const radius = Math.sqrt(width * width + height * height) / 2;
            ctx.arc(x + width/2, y + height/2, radius, 0, Math.PI * 2);
            break;
        case 'square':
            ctx.rect(x, y, width, height);
            break;
        case 'triangle':
            ctx.moveTo(x + width/2, y);
            ctx.lineTo(x + width, y + height);
            ctx.lineTo(x, y + height);
            ctx.closePath();
            break;
        case 'star':
            drawStar(x + width/2, y + height/2, 5, Math.abs(width/2), Math.abs(height/4));
            break;
        case 'heart':
            drawHeart(x, y, width, height);
            break;
    }
    
    ctx.stroke();
    ctx.fill();
}

function drawStar(cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);

    for(let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
}

function drawHeart(x, y, width, height) {
    const topCurveHeight = height * 0.3;
    ctx.beginPath();
    ctx.moveTo(x + width/2, y + height);
    ctx.bezierCurveTo(x, y + height/2, x, y, x + width/2, y + topCurveHeight);
    ctx.bezierCurveTo(x + width, y, x + width, y + height/2, x + width/2, y + height);
    ctx.closePath();
}

function handleSelection(x, y) {
    selectedShapeIndex = -1;
    for (let i = shapes.length - 1; i >= 0; i--) {
        const shape = shapes[i];
        if (isPointInShape(x, y, shape)) {
            selectedShapeIndex = i;
            break;
        }
    }
    redrawCanvas();
}

function isPointInShape(x, y, shape) {
    const { type, x: shapeX, y: shapeY, width, height } = shape;
    
    switch (type) {
        case 'circle':
            const radius = Math.sqrt(width * width + height * height) / 2;
            const centerX = shapeX + width/2;
            const centerY = shapeY + height/2;
            const distance = Math.sqrt((x - centerX) * (x - centerX) + (y - centerY) * (y - centerY));
            return distance <= radius;
        case 'square':
            return x >= shapeX && x <= shapeX + width && y >= shapeY && y <= shapeY + height;
        case 'triangle':
            return isPointInTriangle(x, y, 
                { x: shapeX + width/2, y: shapeY },
                { x: shapeX + width, y: shapeY + height },
                { x: shapeX, y: shapeY + height }
            );
        case 'star':
        case 'heart':
            // Basitleştirilmiş sınırlayıcı kutu kontrolü
            return x >= shapeX && x <= shapeX + width && y >= shapeY && y <= shapeY + height;
    }
    return false;
}

function isPointInTriangle(px, py, v1, v2, v3) {
    const area = Math.abs((v2.x - v1.x) * (v3.y - v1.y) - (v3.x - v1.x) * (v2.y - v1.y)) / 2;
    const a1 = Math.abs((v1.x - px) * (v2.y - py) - (v2.x - px) * (v1.y - py)) / 2;
    const a2 = Math.abs((v2.x - px) * (v3.y - py) - (v3.x - px) * (v2.y - py)) / 2;
    const a3 = Math.abs((v3.x - px) * (v1.y - py) - (v1.x - px) * (v3.y - py)) / 2;
    return Math.abs(area - (a1 + a2 + a3)) < 0.1;
}

function redrawCanvas() {
    // Geçici canvas oluştur
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    // Mevcut canvas içeriğini geçici canvas'a kopyala
    tempCtx.drawImage(canvas, 0, 0);

    // Ana canvas'ı temizle
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Geçici canvas'ı geri çiz
    ctx.drawImage(tempCanvas, 0, 0);

    // Şekilleri çiz
    shapes.forEach((shape, index) => {
        ctx.save();
        if (index === selectedShapeIndex) {
            // Seçili şekil için vurgulama
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(shape.x - 5, shape.y - 5, shape.width + 10, shape.height + 10);
            ctx.setLineDash([]);
            
            // Boyutlandırma tutamaçları
            drawResizeHandles(shape);
        }
        ctx.fillStyle = shape.color;
        ctx.strokeStyle = shape.color;
        drawShape(shape.type, shape.x, shape.y, shape.width, shape.height);
        ctx.restore();
    });
}

function drawResizeHandles(shape) {
    const handles = [
        { x: shape.x - 5, y: shape.y - 5 },
        { x: shape.x + shape.width/2 - 5, y: shape.y - 5 },
        { x: shape.x + shape.width - 5, y: shape.y - 5 },
        { x: shape.x - 5, y: shape.y + shape.height/2 - 5 },
        { x: shape.x + shape.width - 5, y: shape.y + shape.height/2 - 5 },
        { x: shape.x - 5, y: shape.y + shape.height - 5 },
        { x: shape.x + shape.width/2 - 5, y: shape.y + shape.height - 5 },
        { x: shape.x + shape.width - 5, y: shape.y + shape.height - 5 }
    ];

    ctx.fillStyle = '#00ff00';
    handles.forEach(handle => {
        ctx.fillRect(handle.x, handle.y, 10, 10);
    });
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

// Resim yükleme
const fileInput = document.getElementById('file-input');
fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            // Yüklenen resmi sakla
            loadedImage = img;
            // Canvas'ı temizle ve resmi çiz
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(file);
});

// Temizle butonu
document.getElementById('clear-btn').addEventListener('click', () => {
    // Canvas'ı temizle
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Şekilleri sıfırla
    shapes = [];
    
    // Parti modunu kapat
    if (currentTool === 'party') {
        setTool('brush');
    }
    
    // Eğer yüklenmiş bir resim varsa, onu tekrar çiz
    if (loadedImage) {
        ctx.drawImage(loadedImage, 0, 0, canvas.width, canvas.height);
    }
});

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

// Kaydet butonu
document.getElementById('save-btn').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'boyama.png';
    link.href = canvas.toDataURL();
    link.click();
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