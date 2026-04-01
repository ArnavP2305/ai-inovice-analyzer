/* =========================================
   GST Validator — compliance checking
   ========================================= */

const GSTValidator = (() => {

    const INDIAN_STATES = {
        '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
        '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana',
        '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
        '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
        '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
        '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam',
        '19': 'West Bengal', '20': 'Jharkhand', '21': 'Odisha',
        '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
        '26': 'Dadra & Nagar Haveli and Daman & Diu', '27': 'Maharashtra',
        '28': 'Andhra Pradesh (Old)', '29': 'Karnataka', '30': 'Goa',
        '31': 'Lakshadweep', '32': 'Kerala', '33': 'Tamil Nadu',
        '34': 'Puducherry', '35': 'Andaman & Nicobar', '36': 'Telangana',
        '37': 'Andhra Pradesh', '38': 'Ladakh', '97': 'Other Territory',
    };

    /**
     * Validate GSTIN format:
     * 2-digit state code + 10-char PAN + 1 entity code + 1 Z + 1 checksum
     * Pattern: \d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}
     */
    function validateGSTIN(gstin) {
        if (!gstin || typeof gstin !== 'string') return { valid: false, message: 'GSTIN is empty' };
        
        const cleaned = gstin.trim().toUpperCase();
        if (cleaned.length !== 15) {
            return { valid: false, message: `GSTIN must be 15 characters (got ${cleaned.length})` };
        }

        const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/;
        if (!gstinRegex.test(cleaned)) {
            return { valid: false, message: 'Invalid GSTIN format' };
        }

        const stateCode = cleaned.substring(0, 2);
        if (!INDIAN_STATES[stateCode]) {
            return { valid: false, message: `Invalid state code: ${stateCode}` };
        }

        // Checksum validation
        const checksumValid = verifyGSTINChecksum(cleaned);
        if (!checksumValid) {
            return { valid: false, message: 'Checksum verification failed' };
        }

        return {
            valid: true,
            message: `Valid — ${INDIAN_STATES[stateCode]}`,
            stateCode,
            stateName: INDIAN_STATES[stateCode],
            pan: cleaned.substring(2, 12),
        };
    }

    function verifyGSTINChecksum(gstin) {
        const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let sum = 0;
        for (let i = 0; i < 14; i++) {
            const idx = CHARS.indexOf(gstin[i]);
            let factor = (i % 2 === 0) ? 1 : 2;
            let product = idx * factor;
            sum += Math.floor(product / 36) + (product % 36);
        }
        const remainder = sum % 36;
        const checkChar = CHARS[(36 - remainder) % 36];
        return checkChar === gstin[14];
    }

    function validateHSNSAC(code) {
        if (!code) return { valid: false, message: 'No HSN/SAC code' };
        const cleaned = code.toString().trim();
        if (/^\d{4}$/.test(cleaned)) return { valid: true, message: '4-digit code (up to ₹5Cr turnover)' };
        if (/^\d{6}$/.test(cleaned)) return { valid: true, message: '6-digit code (above ₹5Cr turnover)' };
        if (/^\d{8}$/.test(cleaned)) return { valid: true, message: '8-digit code (Import/Export)' };
        return { valid: false, message: 'HSN/SAC must be 4, 6, or 8 digits' };
    }

    /**
     * Perform full GST compliance check on extracted invoice data
     */
    function checkCompliance(data) {
        const checks = [];
        let passed = 0;
        let total = 0;

        // 1. Invoice Number
        total++;
        if (data.invoiceNumber && data.invoiceNumber.trim()) {
            if (data.invoiceNumber.length <= 16) {
                checks.push({ field: 'Invoice No.', status: 'pass', msg: 'Present & ≤16 chars' });
                passed++;
            } else {
                checks.push({ field: 'Invoice No.', status: 'warn', msg: 'Exceeds 16 characters' });
                passed += 0.5;
            }
        } else {
            checks.push({ field: 'Invoice No.', status: 'fail', msg: 'Missing' });
        }

        // 2. Invoice Date
        total++;
        if (data.invoiceDate && data.invoiceDate.trim()) {
            checks.push({ field: 'Invoice Date', status: 'pass', msg: 'Present' });
            passed++;
        } else {
            checks.push({ field: 'Invoice Date', status: 'fail', msg: 'Missing' });
        }

        // 3. Seller GSTIN
        total++;
        if (data.sellerGstin) {
            const v = validateGSTIN(data.sellerGstin);
            if (v.valid) {
                checks.push({ field: 'Seller GSTIN', status: 'pass', msg: v.message });
                passed++;
            } else {
                checks.push({ field: 'Seller GSTIN', status: 'fail', msg: v.message });
            }
        } else {
            checks.push({ field: 'Seller GSTIN', status: 'fail', msg: 'Missing' });
        }

        // 4. Seller Name
        total++;
        if (data.sellerName && data.sellerName.trim()) {
            checks.push({ field: 'Seller Name', status: 'pass', msg: 'Present' });
            passed++;
        } else {
            checks.push({ field: 'Seller Name', status: 'fail', msg: 'Missing' });
        }

        // 5. Buyer GSTIN (optional for B2C but nice to have)
        total++;
        if (data.buyerGstin) {
            const v = validateGSTIN(data.buyerGstin);
            if (v.valid) {
                checks.push({ field: 'Buyer GSTIN', status: 'pass', msg: v.message });
                passed++;
            } else {
                checks.push({ field: 'Buyer GSTIN', status: 'warn', msg: v.message });
                passed += 0.5;
            }
        } else {
            checks.push({ field: 'Buyer GSTIN', status: 'warn', msg: 'Missing (OK for B2C)' });
            passed += 0.5;
        }

        // 6. Place of Supply
        total++;
        if (data.placeOfSupply && data.placeOfSupply.trim()) {
            checks.push({ field: 'Place of Supply', status: 'pass', msg: 'Present' });
            passed++;
        } else {
            checks.push({ field: 'Place of Supply', status: 'fail', msg: 'Missing' });
        }

        // 7. Tax Details
        total++;
        const hasCGST = data.cgstAmount && parseFloat(data.cgstAmount) > 0;
        const hasSGST = data.sgstAmount && parseFloat(data.sgstAmount) > 0;
        const hasIGST = data.igstAmount && parseFloat(data.igstAmount) > 0;
        if ((hasCGST && hasSGST) || hasIGST) {
            checks.push({ field: 'Tax Details', status: 'pass', msg: hasCGST ? 'CGST+SGST present' : 'IGST present' });
            passed++;
        } else if (hasCGST || hasSGST) {
            checks.push({ field: 'Tax Details', status: 'warn', msg: 'Only one of CGST/SGST found' });
            passed += 0.5;
        } else {
            checks.push({ field: 'Tax Details', status: 'fail', msg: 'No tax amounts detected' });
        }

        // 8. CGST == SGST check
        if (hasCGST && hasSGST) {
            total++;
            const cgst = parseFloat(data.cgstAmount);
            const sgst = parseFloat(data.sgstAmount);
            if (Math.abs(cgst - sgst) < 0.01) {
                checks.push({ field: 'CGST=SGST', status: 'pass', msg: 'Amounts match' });
                passed++;
            } else {
                checks.push({ field: 'CGST=SGST', status: 'warn', msg: `Mismatch: ₹${cgst} vs ₹${sgst}` });
                passed += 0.5;
            }
        }

        // 9. Total Amount
        total++;
        if (data.grandTotal && parseFloat(data.grandTotal) > 0) {
            checks.push({ field: 'Grand Total', status: 'pass', msg: `₹${data.grandTotal}` });
            passed++;
        } else {
            checks.push({ field: 'Grand Total', status: 'fail', msg: 'Missing' });
        }

        // 10. Line Items with HSN
        total++;
        if (data.lineItems && data.lineItems.length > 0) {
            const withHSN = data.lineItems.filter(i => i.hsn && i.hsn.trim()).length;
            if (withHSN === data.lineItems.length) {
                checks.push({ field: 'HSN/SAC Codes', status: 'pass', msg: `All ${withHSN} items have codes` });
                passed++;
            } else if (withHSN > 0) {
                checks.push({ field: 'HSN/SAC Codes', status: 'warn', msg: `${withHSN}/${data.lineItems.length} items have codes` });
                passed += 0.5;
            } else {
                checks.push({ field: 'HSN/SAC Codes', status: 'fail', msg: 'No HSN/SAC codes found' });
            }
        } else {
            checks.push({ field: 'Line Items', status: 'warn', msg: 'No line items detected' });
            passed += 0.25;
        }

        // 11. Reverse Charge
        total++;
        if (data.reverseCharge && data.reverseCharge !== '') {
            checks.push({ field: 'Reverse Charge', status: 'pass', msg: data.reverseCharge });
            passed++;
        } else {
            checks.push({ field: 'Reverse Charge', status: 'warn', msg: 'Not specified' });
            passed += 0.5;
        }

        const score = Math.round((passed / total) * 100);
        let label = 'Non-Compliant';
        if (score >= 90) label = 'Fully Compliant';
        else if (score >= 70) label = 'Mostly Compliant';
        else if (score >= 50) label = 'Partially Compliant';

        return { score, label, checks, passed, total };
    }

    return {
        validateGSTIN,
        validateHSNSAC,
        checkCompliance,
        INDIAN_STATES,
    };
})();
