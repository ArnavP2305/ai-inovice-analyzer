/* =========================================
   FieldExtractor — Regex-based extraction
   ========================================= */

const FieldExtractor = (() => {

    /**
     * Extract all GST-relevant fields from raw text
     */
    function extract(rawText) {
        if (!rawText || typeof rawText !== 'string') {
            return createEmptyResult();
        }

        const text = rawText.replace(/\r\n/g, '\n');
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

        return {
            invoiceNumber: extractInvoiceNumber(text, lines),
            invoiceDate: extractInvoiceDate(text, lines),
            placeOfSupply: extractPlaceOfSupply(text, lines),
            reverseCharge: extractReverseCharge(text, lines),
            sellerName: extractSellerName(text, lines),
            sellerGstin: extractGSTINs(text, lines).seller,
            sellerAddress: extractSellerAddress(text, lines),
            buyerName: extractBuyerName(text, lines),
            buyerGstin: extractGSTINs(text, lines).buyer,
            buyerAddress: extractBuyerAddress(text, lines),
            cgstRate: extractTaxRate(text, 'cgst'),
            cgstAmount: extractTaxAmount(text, 'cgst'),
            sgstRate: extractTaxRate(text, 'sgst'),
            sgstAmount: extractTaxAmount(text, 'sgst'),
            igstRate: extractTaxRate(text, 'igst'),
            igstAmount: extractTaxAmount(text, 'igst'),
            cessAmount: extractCessAmount(text),
            taxableValue: extractTaxableValue(text),
            grandTotal: extractGrandTotal(text, lines),
            lineItems: extractLineItems(text, lines),
            rawText: rawText,
        };
    }

    function createEmptyResult() {
        return {
            invoiceNumber: '', invoiceDate: '', placeOfSupply: '', reverseCharge: '',
            sellerName: '', sellerGstin: '', sellerAddress: '',
            buyerName: '', buyerGstin: '', buyerAddress: '',
            cgstRate: '', cgstAmount: '', sgstRate: '', sgstAmount: '',
            igstRate: '', igstAmount: '', cessAmount: '',
            taxableValue: '', grandTotal: '', lineItems: [], rawText: '',
        };
    }

    function extractInvoiceNumber(text, lines) {
        const patterns = [
            /(?:invoice\s*(?:no|number|#|num)\.?\s*[:\-]?\s*)([A-Z0-9\-\/\\]+)/i,
            /(?:bill\s*(?:no|number|#)\.?\s*[:\-]?\s*)([A-Z0-9\-\/\\]+)/i,
            /(?:inv\s*(?:no|#)\.?\s*[:\-]?\s*)([A-Z0-9\-\/\\]+)/i,
            /(?:voucher\s*(?:no|number)\.?\s*[:\-]?\s*)([A-Z0-9\-\/\\]+)/i,
            /(?:receipt\s*(?:no|number)\.?\s*[:\-]?\s*)([A-Z0-9\-\/\\]+)/i,
            /\b(INV[\-\/]?\d{3,})\b/i,
            /\b(GST[\-\/]?\d{3,})\b/i,
        ];

        for (const p of patterns) {
            const m = text.match(p);
            if (m && m[1]) return m[1].trim();
        }
        return '';
    }

    function extractInvoiceDate(text, lines) {
        const patterns = [
            /(?:invoice\s*date|date\s*of\s*invoice|inv\.?\s*date|bill\s*date|dated?)\s*[:\-]?\s*(\d{1,2}[\-\/\.]\d{1,2}[\-\/\.]\d{2,4})/i,
            /(?:invoice\s*date|date\s*of\s*invoice|inv\.?\s*date|bill\s*date|dated?)\s*[:\-]?\s*(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*,?\s*\d{2,4})/i,
            /\b(\d{1,2}[\-\/\.]\d{1,2}[\-\/\.]\d{4})\b/,
        ];

        for (const p of patterns) {
            const m = text.match(p);
            if (m && m[1]) return m[1].trim();
        }
        return '';
    }

    function extractPlaceOfSupply(text, lines) {
        const patterns = [
            /(?:place\s*of\s*supply)\s*[:\-]?\s*([^\n,]{3,50})/i,
            /(?:state)\s*[:\-]?\s*(?:name\s*[:\-]?\s*)?([A-Za-z\s]{3,30})(?:\s*(?:code|[\(\)]))/i,
        ];
        for (const p of patterns) {
            const m = text.match(p);
            if (m && m[1]) return m[1].trim();
        }
        return '';
    }

    function extractReverseCharge(text) {
        const m = text.match(/(?:reverse\s*charge)\s*[:\-]?\s*(yes|no|y|n|applicable|not\s*applicable)/i);
        if (m) {
            const v = m[1].toLowerCase();
            return (v === 'yes' || v === 'y' || v === 'applicable') ? 'Yes' : 'No';
        }
        return '';
    }

    function extractGSTINs(text) {
        const gstinRegex = /\b(\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9])\b/g;
        const matches = [];
        let m;
        while ((m = gstinRegex.exec(text)) !== null) {
            matches.push(m[1]);
        }

        let seller = '', buyer = '';
        if (matches.length >= 2) {
            seller = matches[0];
            buyer = matches[1];
        } else if (matches.length === 1) {
            seller = matches[0];
        }

        // Try to assign based on context
        const lines = text.split('\n');
        for (const line of lines) {
            for (const gstin of matches) {
                if (/(?:seller|supplier|sold\s*by|from|billed\s*by)/i.test(line) && line.includes(gstin)) {
                    seller = gstin;
                }
                if (/(?:buyer|purchaser|bill\s*to|ship\s*to|sold\s*to|customer)/i.test(line) && line.includes(gstin)) {
                    buyer = gstin;
                }
            }
        }

        return { seller, buyer, all: matches };
    }

    function extractSellerName(text, lines) {
        const patterns = [
            /(?:seller|supplier|sold\s*by|billed\s*by|from)\s*[:\-]?\s*(?:name\s*[:\-]?\s*)?([^\n]{3,80})/i,
        ];
        for (const p of patterns) {
            const m = text.match(p);
            if (m && m[1] && !/gstin|address|phone/i.test(m[1])) return m[1].trim();
        }
        // Fallback: first line that looks like a company name (before any GSTIN)
        for (let i = 0; i < Math.min(lines.length, 8); i++) {
            const line = lines[i];
            if (line.length > 5 && line.length < 80 && /[A-Za-z]/.test(line) &&
                !/invoice|bill|tax|date|no\.|number|gstin|address|phone|email|www/i.test(line)) {
                return line;
            }
        }
        return '';
    }

    function extractBuyerName(text, lines) {
        const patterns = [
            /(?:buyer|purchaser|bill\s*to|sold\s*to|customer|consignee|ship\s*to)\s*[:\-]?\s*(?:name\s*[:\-]?\s*)?([^\n]{3,80})/i,
        ];
        for (const p of patterns) {
            const m = text.match(p);
            if (m && m[1] && !/gstin|address|phone/i.test(m[1])) return m[1].trim();
        }
        return '';
    }

    function extractSellerAddress(text) {
        const m = text.match(/(?:seller|supplier)\s*(?:address)\s*[:\-]?\s*([^\n]{5,150})/i);
        if (m) return m[1].trim();
        return '';
    }

    function extractBuyerAddress(text) {
        const m = text.match(/(?:buyer|purchaser|bill\s*to|ship\s*to)\s*(?:address)\s*[:\-]?\s*([^\n]{5,150})/i);
        if (m) return m[1].trim();
        return '';
    }

    function extractTaxRate(text, taxType) {
        const prefix = taxType.toUpperCase();
        const patterns = [
            new RegExp(`${prefix}\\s*(?:@|rate)?\\s*[:\\-]?\\s*(\\d+\\.?\\d*)\\s*%`, 'i'),
            new RegExp(`${prefix}\\s*\\(\\s*(\\d+\\.?\\d*)\\s*%\\s*\\)`, 'i'),
        ];
        for (const p of patterns) {
            const m = text.match(p);
            if (m && m[1]) return m[1];
        }
        return '';
    }

    function extractTaxAmount(text, taxType) {
        const prefix = taxType.toUpperCase();
        const patterns = [
            new RegExp(`${prefix}[^\\n]*?(?:₹|Rs\\.?|INR)?\\s*([\\d,]+\\.\\d{2})`, 'i'),
            new RegExp(`${prefix}\\s*(?:@\\s*\\d+\\.?\\d*\\s*%)?\\s*[:\\-]?\\s*(?:₹|Rs\\.?|INR)?\\s*([\\d,]+\\.?\\d*)`, 'i'),
        ];
        for (const p of patterns) {
            const m = text.match(p);
            if (m && m[1]) return m[1].replace(/,/g, '');
        }
        return '';
    }

    function extractCessAmount(text) {
        const m = text.match(/cess\s*(?:amount)?[^\\n]*?(?:₹|Rs\.?|INR)?\s*([\d,]+\.?\d*)/i);
        if (m && m[1]) return m[1].replace(/,/g, '');
        return '';
    }

    function extractTaxableValue(text) {
        const patterns = [
            /(?:taxable\s*(?:value|amount)|sub\s*total|subtotal|total\s*before\s*tax)\s*[:\-]?\s*(?:₹|Rs\.?|INR)?\s*([\d,]+\.?\d*)/i,
        ];
        for (const p of patterns) {
            const m = text.match(p);
            if (m && m[1]) return m[1].replace(/,/g, '');
        }
        return '';
    }

    function extractGrandTotal(text, lines) {
        const patterns = [
            /(?:grand\s*total|total\s*amount|net\s*payable|amount\s*payable|invoice\s*total|bill\s*total|total\s*(?:incl|inc|with)\w*\s*(?:tax|gst))\s*[:\-]?\s*(?:₹|Rs\.?|INR)?\s*([\d,]+\.?\d*)/i,
            /(?:^|\n)\s*total\s*[:\-]?\s*(?:₹|Rs\.?|INR)?\s*([\d,]+\.?\d*)/im,
        ];
        for (const p of patterns) {
            const m = text.match(p);
            if (m && m[1]) return m[1].replace(/,/g, '');
        }

        // Fallback: find the largest number after "total"
        const totalIdx = text.toLowerCase().lastIndexOf('total');
        if (totalIdx > -1) {
            const after = text.substring(totalIdx, totalIdx + 100);
            const nums = [...after.matchAll(/([\d,]+\.\d{2})/g)].map(m => parseFloat(m[1].replace(/,/g, '')));
            if (nums.length > 0) return Math.max(...nums).toFixed(2);
        }

        return '';
    }

    function extractLineItems(text, lines) {
        const items = [];
        
        // Look for patterns that match line items: description, optional hsn, qty, rate, amount
        const lineItemPatterns = [
            // Description | HSN | Qty | Rate | Amount
            /^(.{3,50}?)\s+(\d{4,8})?\s+(\d+\.?\d*)\s+(?:(?:nos?|pcs?|kg|ltr|mtr|box)\s+)?(\d[\d,]*\.?\d*)\s+(\d[\d,]*\.?\d*)\s*$/im,
            // Numbered: 1. Description  Qty  Rate  Amount
            /^\d+\.?\s+(.{3,50}?)\s+(\d{4,8})?\s+(\d+\.?\d*)\s+(\d[\d,]*\.?\d*)\s+(\d[\d,]*\.?\d*)\s*$/im,
        ];

        // Simple approach: look for lines with multiple numbers that could be line items
        for (const line of lines) {
            // Skip header-like lines
            if (/^(?:s\.?\s*no|sr|sl|#|description|item|particular|hsn|qty|rate|amount|total)/i.test(line)) continue;
            if (/(?:cgst|sgst|igst|cess|tax|subtotal|grand\s*total|net|round)/i.test(line)) continue;

            // Match lines with at least description + amount pattern
            const m = line.match(/^(\d+\.?\s+)?(.{3,60}?)\s{2,}(\d{4,8})?\s*(\d+\.?\d*)?\s+(?:(?:nos?|pcs?|kg|ltr|mtr|box|unit|set|pair)\s+)?(\d[\d,]*\.?\d*)\s+(\d[\d,]*\.?\d*)\s*$/i);
            if (m) {
                items.push({
                    description: (m[2] || '').trim(),
                    hsn: (m[3] || '').trim(),
                    qty: (m[4] || '1').trim(),
                    unit: '',
                    rate: (m[5] || '').replace(/,/g, '').trim(),
                    amount: (m[6] || '').replace(/,/g, '').trim(),
                });
                continue;
            }

            // Simpler pattern: text followed by numbers
            const m2 = line.match(/^(\d+\.?\s+)?(.{4,50}?)\s{2,}(\d[\d,]*\.?\d*)\s+(\d[\d,]*\.?\d*)\s*$/);
            if (m2) {
                const desc = (m2[2] || '').trim();
                const num1 = (m2[3] || '').replace(/,/g, '');
                const num2 = (m2[4] || '').replace(/,/g, '');
                if (parseFloat(num2) > 0 && desc.length > 3) {
                    items.push({
                        description: desc,
                        hsn: '',
                        qty: '',
                        unit: '',
                        rate: num1,
                        amount: num2,
                    });
                }
            }
        }

        return items;
    }

    return { extract, createEmptyResult };
})();
