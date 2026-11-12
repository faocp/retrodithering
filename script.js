// Atkinson dithering: each pixel's error goes 1/8 each to these six neighbours [dx, dy]
const ATKINSON_NEIGHBOURS = [[1, 0], [2, 0], [-1, 1], [0, 1], [1, 1], [0, 2]];

// Takes RGBA pixels, returns opaque black/white RGBA pixels.
function applyAtkinsonDithering(data, width, height) {
    // Clamped bytes keep the classic behaviour: values stay 0-255 while error spreads
    const gray = new Uint8ClampedArray(width * height);
    for (let i = 0; i < gray.length; i++) {
        gray[i] = Math.round(data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114);
    }

    const out = new Uint8ClampedArray(width * height * 4).fill(255);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = y * width + x;
            const black = gray[i] < 128;
            const share = (gray[i] - (black ? 0 : 255)) / 8;
            for (const [dx, dy] of ATKINSON_NEIGHBOURS) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < width && ny < height) gray[ny * width + nx] += share;
            }
            if (black) out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = 0;
        }
    }
    return out;
}

document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('imageInput');
    const originalCanvas = document.getElementById('originalCanvas');
    const ditheredCanvas = document.getElementById('ditheredCanvas');
    const downloadBtn = document.getElementById('downloadBtn');
    const fileNameDisplay = document.querySelector('.file-name');

    const originalCtx = originalCanvas.getContext('2d');
    const ditheredCtx = ditheredCanvas.getContext('2d');

    // Create a hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    document.body.appendChild(fileInput);

    imageInput.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleImageUpload);
    downloadBtn.addEventListener('click', downloadDitheredImage);

    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        fileNameDisplay.textContent = file.name;

        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onerror = () => {
            URL.revokeObjectURL(url);
            fileNameDisplay.textContent = `Can't open ${file.name}`;
            downloadBtn.disabled = true;
        };
        img.onload = () => {
            URL.revokeObjectURL(url);
            const scale = Math.min(1, 800 / img.width);
            const width = Math.round(img.width * scale);
            const height = Math.round(img.height * scale);

            originalCanvas.width = ditheredCanvas.width = width;
            originalCanvas.height = ditheredCanvas.height = height;

            // White behind the image, so transparent areas dither as white
            originalCtx.fillStyle = '#fff';
            originalCtx.fillRect(0, 0, width, height);
            originalCtx.drawImage(img, 0, 0, width, height);

            const { data } = originalCtx.getImageData(0, 0, width, height);
            ditheredCtx.putImageData(new ImageData(applyAtkinsonDithering(data, width, height), width, height), 0, 0);
            downloadBtn.disabled = false;
        };
        img.src = url;
    }

    function downloadDitheredImage() {
        const link = document.createElement('a');
        link.download = 'dithered-image.png';
        link.href = ditheredCanvas.toDataURL('image/png');
        link.click();
    }
});
