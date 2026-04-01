/* =========================================
   PDF Parser — PDF.js text extraction
   ========================================= */

const PDFParser = (() => {

    let pdfjsLib = null;
    let initialized = false;

    async function init() {
        if (initialized) return;
        
        // Dynamic import of PDF.js
        pdfjsLib = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.min.mjs');
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.worker.min.mjs';
        initialized = true;
    }

    /**
     * Extract text from a PDF file
     * Returns { text, pageCount, isScanned }
     */
    async function extractText(fileOrArrayBuffer, onProgress) {
        await init();

        const arrayBuffer = fileOrArrayBuffer instanceof ArrayBuffer
            ? fileOrArrayBuffer
            : await fileOrArrayBuffer.arrayBuffer();

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        const pageCount = pdf.numPages;
        let fullText = '';
        let totalChars = 0;

        for (let i = 1; i <= pageCount; i++) {
            if (onProgress) onProgress(`Extracting text from page ${i}/${pageCount}`, (i / pageCount) * 100);

            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            const pageText = textContent.items
                .map(item => item.str)
                .join(' ')
                .replace(/\s+/g, ' ')
                .trim();

            fullText += pageText + '\n\n';
            totalChars += pageText.length;
        }

        // If very little text was extracted, the PDF is likely scanned (image-based)
        const isScanned = totalChars < 50 * pageCount;

        return {
            text: fullText.trim(),
            pageCount,
            isScanned,
        };
    }

    /**
     * Convert PDF pages to images (for OCR on scanned PDFs)
     * Returns array of canvas ImageData URLs
     */
    async function convertToImages(fileOrArrayBuffer, onProgress) {
        await init();

        const arrayBuffer = fileOrArrayBuffer instanceof ArrayBuffer
            ? fileOrArrayBuffer
            : await fileOrArrayBuffer.arrayBuffer();

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        const pageCount = pdf.numPages;
        const images = [];

        for (let i = 1; i <= pageCount; i++) {
            if (onProgress) onProgress(`Rendering page ${i}/${pageCount} to image`, (i / pageCount) * 100);

            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR

            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            const ctx = canvas.getContext('2d');
            await page.render({ canvasContext: ctx, viewport }).promise;

            // Pre-process for better OCR: convert to grayscale and enhance contrast
            preprocessCanvas(ctx, canvas.width, canvas.height);

            images.push(canvas.toDataURL('image/png'));
        }

        return images;
    }

    /**
     * Pre-process canvas image for better OCR accuracy
     */
    function preprocessCanvas(ctx, width, height) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            // Convert to grayscale
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

            // Enhance contrast
            const contrast = 1.4;
            const adjusted = ((gray / 255 - 0.5) * contrast + 0.5) * 255;
            const final = Math.max(0, Math.min(255, adjusted));

            data[i] = final;
            data[i + 1] = final;
            data[i + 2] = final;
        }

        ctx.putImageData(imageData, 0, 0);
    }

    return { extractText, convertToImages };
})();
