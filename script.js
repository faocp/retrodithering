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

    // Handle file input button click
    imageInput.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', handleImageUpload);
    downloadBtn.addEventListener('click', downloadDitheredImage);

    // Add window control button functionality
    document.querySelector('.close-button').addEventListener('click', () => {
        window.close();
    });

    document.querySelector('.minimize-button').addEventListener('click', () => {
        // In a real app, this would minimize the window
        console.log('Minimize clicked');
    });

    document.querySelector('.zoom-button').addEventListener('click', () => {
        // In a real app, this would maximize/restore the window
        console.log('Zoom clicked');
    });

    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        fileNameDisplay.textContent = file.name;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // Set canvas dimensions
                const maxWidth = 800;
                const scale = Math.min(1, maxWidth / img.width);
                const width = img.width * scale;
                const height = img.height * scale;

                originalCanvas.width = width;
                originalCanvas.height = height;
                ditheredCanvas.width = width;
                ditheredCanvas.height = height;

                // Draw original image
                originalCtx.drawImage(img, 0, 0, width, height);
                
                // Get image data and apply dithering
                const imageData = originalCtx.getImageData(0, 0, width, height);
                const ditheredData = applyAtkinsonDithering(imageData);
                
                // Draw dithered image
                ditheredCtx.putImageData(ditheredData, 0, 0);
                
                // Enable download button
                downloadBtn.disabled = false;
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    function applyAtkinsonDithering(imageData) {
        const { width, height, data } = imageData;
        const newData = new Uint8ClampedArray(data);
        const threshold = 128; // Threshold for black/white conversion
        
        // First pass: Convert to grayscale
        for (let i = 0; i < data.length; i += 4) {
            const gray = Math.round(
                data[i] * 0.299 + 
                data[i + 1] * 0.587 + 
                data[i + 2] * 0.114
            );
            newData[i] = gray;
            newData[i + 1] = gray;
            newData[i + 2] = gray;
        }
        
        // Second pass: Apply Atkinson dithering
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const oldPixel = newData[idx];
                const newPixel = oldPixel < threshold ? 0 : 255;
                const error = oldPixel - newPixel;
                
                // Atkinson dithering pattern (1/8 of error to each pixel)
                const pattern = [
                    [0, 0, 1, 1, 1], // Current row
                    [0, 1, 1, 1, 0], // Next row
                    [0, 0, 1, 0, 0]  // Row after next
                ];
                
                // Distribute error
                for (let dy = 0; dy < 3; dy++) {
                    for (let dx = 0; dx < 5; dx++) {
                        if (pattern[dy][dx]) {
                            const nx = x + dx - 2; // Center the pattern
                            const ny = y + dy;
                            if (nx >= 0 && nx < width && ny < height) {
                                const nidx = (ny * width + nx) * 4;
                                const factor = pattern[dy][dx] / 8;
                                const newValue = Math.min(255, Math.max(0, newData[nidx] + error * factor));
                                newData[nidx] = newValue;
                                newData[nidx + 1] = newValue;
                                newData[nidx + 2] = newValue;
                            }
                        }
                    }
                }
                
                // Set the new pixel value
                newData[idx] = newPixel;
                newData[idx + 1] = newPixel;
                newData[idx + 2] = newPixel;
            }
        }
        
        return new ImageData(newData, width, height);
    }

    function downloadDitheredImage() {
        const link = document.createElement('a');
        link.download = 'dithered-image.png';
        link.href = ditheredCanvas.toDataURL('image/png');
        link.click();
    }
}); 