/* =========================================
   OCR Engine — Tesseract.js wrapper
   ========================================= */

const OCREngine = (() => {

    /**
     * Perform OCR on an image file or data URL
     * @param {File|string} imageSource - File object or data URL string
     * @param {function} onProgress - Progress callback (stage, percent)
     * @returns {Promise<string>} Extracted text
     */
    async function recognize(imageSource, onProgress) {
        if (onProgress) onProgress('Initializing OCR engine...', 5);

        const worker = await Tesseract.createWorker('eng', 1, {
            logger: m => {
                if (m.status === 'recognizing text') {
                    const pct = Math.round((m.progress || 0) * 100);
                    if (onProgress) onProgress(`Recognizing text... ${pct}%`, 20 + pct * 0.7);
                }
            }
        });

        try {
            if (onProgress) onProgress('Running OCR recognition...', 20);

            let source = imageSource;

            // If it's a File, optionally preprocess
            if (imageSource instanceof File) {
                source = await preprocessImage(imageSource);
            }

            const { data: { text } } = await worker.recognize(source);

            if (onProgress) onProgress('OCR complete', 95);

            return text || '';
        } finally {
            await worker.terminate();
        }
    }

    /**
     * Perform OCR on multiple images (for multi-page PDFs)
     * @param {string[]} imageDataURLs - Array of data URL strings
     * @param {function} onProgress - Progress callback
     * @returns {Promise<string>} Combined text from all pages
     */
    async function recognizeMultiple(imageDataURLs, onProgress) {
        if (onProgress) onProgress('Initializing OCR engine...', 5);

        const worker = await Tesseract.createWorker('eng', 1, {
            logger: m => {
                if (m.status === 'recognizing text') {
                    // Don't override our page-level progress
                }
            }
        });

        try {
            let fullText = '';
            const total = imageDataURLs.length;

            for (let i = 0; i < total; i++) {
                const pageNum = i + 1;
                const baseProgress = (i / total) * 80 + 10;
                if (onProgress) onProgress(`OCR: Processing page ${pageNum}/${total}...`, baseProgress);

                const { data: { text } } = await worker.recognize(imageDataURLs[i]);
                fullText += `--- Page ${pageNum} ---\n${text}\n\n`;
            }

            if (onProgress) onProgress('OCR complete', 95);
            return fullText.trim();
        } finally {
            await worker.terminate();
        }
    }

    /**
     * Preprocess image for better OCR: grayscale + contrast on canvas
     */
    async function preprocessImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);

                    // Convert to grayscale & enhance contrast
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;
                    for (let i = 0; i < data.length; i += 4) {
                        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                        const contrast = 1.4;
                        const adjusted = ((gray / 255 - 0.5) * contrast + 0.5) * 255;
                        const final = Math.max(0, Math.min(255, adjusted));
                        data[i] = final;
                        data[i + 1] = final;
                        data[i + 2] = final;
                    }
                    ctx.putImageData(imageData, 0, 0);

                    resolve(canvas.toDataURL('image/png'));
                };
                img.onerror = reject;
                img.src = reader.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    return { recognize, recognizeMultiple };
})();
