const canvas = document.getElementById('white-noise-canvas');
const ctx = canvas.getContext('2d');
const displayCanvas = document.createElement('canvas'); // Создаем canvas для отображения
const displayCtx = displayCanvas.getContext('2d');
const generateButton = document.getElementById('generate-button');
const columnsInput = document.getElementById('columns');
const rowsInput = document.getElementById('rows');
const squareSizeInput = document.getElementById('square-size');
const colorModeSelect = document.getElementById('color-mode');
const biasSelect = document.getElementById('bias');
const imageSizeSpan = document.getElementById('image-size');
const gradient2Controls = document.getElementById('gradient2-controls');
const startColorInput = document.getElementById('start-color');
const endColorInput = document.getElementById('end-color');
const warningMessage = document.getElementById('warning-message');
const imageContainer = document.querySelector('.image-container');
const downloadButton = document.getElementById('download-button'); // Получаем кнопку скачивания

imageContainer.appendChild(displayCanvas); // Добавляем canvas отображения на страницу

function checkSize() {
    const columns = parseInt(columnsInput.value);
    const rows = parseInt(rowsInput.value);
    const squareSize = parseInt(squareSizeInput.value);
    const width = columns * squareSize;
    const height = rows * squareSize;
    const totalPixels = width * height;
    const MAX_PIXELS = 1000000;

    if (totalPixels > MAX_PIXELS) {
        warningMessage.textContent = "Warning: this is massive and may freeze/crash your browser!";
        warningMessage.style.display = 'block';
    } else {
        warningMessage.style.display = 'none';
    }
}


function generateWhiteNoise() {
    checkSize();
    const columns = parseInt(columnsInput.value);
    const rows = parseInt(rowsInput.value);
    const squareSize = parseInt(squareSizeInput.value);
    const colorMode = colorModeSelect.value;
    const biasMode = biasSelect.value;

    const width = columns * squareSize;
    const height = rows * squareSize;
    canvas.width = width;
    canvas.height = height;
      displayCanvas.width = 250;
    displayCanvas.height = 125;

    imageSizeSpan.textContent = `(${width}x${height})`;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            let r, g, b;

            let biasValue = 0;
            switch (biasMode) {
                case 'verylight':
                    biasValue = 0.75 + Math.random() * 0.25;
                    break;
                case 'light':
                    biasValue = 0.5 + Math.random() * 0.5;
                    break;
                case 'dark':
                    biasValue = Math.random() * 0.5;
                    break;
                case 'verydark':
                    biasValue = Math.random() * 0.25;
                    break;
                default:
                    biasValue = 1;
            }

            if (colorMode === 'monochrome') {
                const gray = Math.floor(Math.random() * 256);
                const grayValue = Math.floor(gray * biasValue);
                ctx.fillStyle = `rgb(${grayValue}, ${grayValue}, ${grayValue})`;
            } else if (colorMode === 'red' || colorMode === 'blue' || colorMode === 'green') {
                r = colorMode === 'red' ? Math.floor(Math.random() * 256 * biasValue) : 0;
                g = colorMode === 'green' ? Math.floor(Math.random() * 256 * biasValue) : 0;
                b = colorMode === 'blue' ? Math.floor(Math.random() * 256 * biasValue) : 0;
                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;

            } else if (colorMode === 'gradient2') {
                const startColor = hexToRgb(startColorInput.value);
                const endColor = hexToRgb(endColorInput.value);
                const amount = Math.random();
                const color = lerpColor(startColor, endColor, amount);
                const rgb = `rgb(${Math.floor(color.r * biasValue)}, ${Math.floor(color.g * biasValue)}, ${Math.floor(color.b * biasValue)})`
                ctx.fillStyle = rgb;

            } else if (colorMode === 'gradient35') {
                const numColors = Math.floor(Math.random() * 3) + 3;
                const colors = [];
                for (let i = 0; i < numColors; i++) {
                    colors.push({
                        color: {
                            r: Math.floor(Math.random() * 256),
                            g: Math.floor(Math.random() * 256),
                            b: Math.floor(Math.random() * 256),
                        },
                        pos: Math.random(),
                    });
                }
                colors.sort((a, b) => a.pos - b.pos)

                const amount = Math.random()
                const color = getColorFromGradient(colors, amount);
                const rgb = `rgb(${Math.floor(color.r * biasValue)}, ${Math.floor(color.g * biasValue)}, ${Math.floor(color.b * biasValue)})`
                ctx.fillStyle = rgb;

            }
            ctx.fillRect(col * squareSize, row * squareSize, squareSize, squareSize);
        }
    }
        //обрезаем
        const sourceX = 0;
        const sourceY = 0;
        const sourceWidth =  Math.min(canvas.width, 250);
       const sourceHeight = Math.min(canvas.height, 125);
      const destWidth = sourceWidth;
        const destHeight = sourceHeight;


    displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);

    displayCtx.drawImage(
            canvas,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            destWidth,
            destHeight
          );
}
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
function lerpColor(start, end, amount) {
    return {
        r: start.r + (end.r - start.r) * amount,
        g: start.g + (end.g - start.g) * amount,
        b: start.b + (end.b - start.b) * amount,
    }
}

function getColorFromGradient(colors, amount) {
    if (amount <= 0) {
        return colors[0].color;
    }
    if (amount >= 1) {
        return colors[colors.length - 1].color;
    }

    for (let i = 0; i < colors.length - 1; i++) {
        const start = colors[i];
        const end = colors[i + 1];

        if (amount >= start.pos && amount <= end.pos) {
            const relativeAmount = (amount - start.pos) / (end.pos - start.pos);
            return lerpColor(start.color, end.color, relativeAmount);
        }
    }
    return colors[0].color;
}
function downloadImage() {
        const link = document.createElement('a');
        link.download = 'white_noise.png';
        link.href = canvas.toDataURL();
        link.click();
}


generateButton.addEventListener('click', generateWhiteNoise);
colorModeSelect.addEventListener('change', () => {
    const selectedMode = colorModeSelect.value;
    gradient2Controls.style.display = selectedMode === 'gradient2' ? 'flex' : 'none';
    gradient2Controls.style.flexDirection = selectedMode === 'gradient2' ? 'column' : 'none';
});
columnsInput.addEventListener('input', checkSize);
rowsInput.addEventListener('input', checkSize);
squareSizeInput.addEventListener('input', checkSize);


document.addEventListener('DOMContentLoaded', () => {
    generateWhiteNoise();
});

downloadButton.addEventListener('click', downloadImage);