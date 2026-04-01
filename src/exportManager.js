/* =========================================
   Export Manager — JSON & CSV export
   ========================================= */

const ExportManager = (() => {

    /**
     * Export invoice data as JSON file
     */
    function exportJSON(invoiceData, filename) {
        const exportObj = {
            exportedAt: new Date().toISOString(),
            application: 'InvoiceAI — Smart GST Invoice Analyzer',
            invoice: sanitizeForExport(invoiceData),
        };

        const json = JSON.stringify(exportObj, null, 2);
        downloadFile(json, `${sanitizeFilename(filename)}_invoice.json`, 'application/json');
    }

    /**
     * Export multiple invoices as JSON
     */
    function exportAllJSON(invoices) {
        const exportObj = {
            exportedAt: new Date().toISOString(),
            application: 'InvoiceAI — Smart GST Invoice Analyzer',
            totalInvoices: invoices.length,
            invoices: invoices.map(inv => ({
                filename: inv.filename,
                processedAt: inv.processedAt,
                complianceScore: inv.complianceScore,
                data: sanitizeForExport(inv.data),
            })),
        };

        const json = JSON.stringify(exportObj, null, 2);
        downloadFile(json, `invoiceai_export_${Date.now()}.json`, 'application/json');
    }

    /**
     * Export invoice data as CSV
     */
    function exportCSV(invoiceData, filename) {
        const headers = [
            'Invoice Number', 'Invoice Date', 'Place of Supply', 'Reverse Charge',
            'Seller Name', 'Seller GSTIN', 'Seller Address',
            'Buyer Name', 'Buyer GSTIN', 'Buyer Address',
            'CGST Rate', 'CGST Amount', 'SGST Rate', 'SGST Amount',
            'IGST Rate', 'IGST Amount', 'Cess Amount',
            'Taxable Value', 'Grand Total',
        ];

        const values = [
            invoiceData.invoiceNumber, invoiceData.invoiceDate, invoiceData.placeOfSupply, invoiceData.reverseCharge,
            invoiceData.sellerName, invoiceData.sellerGstin, invoiceData.sellerAddress,
            invoiceData.buyerName, invoiceData.buyerGstin, invoiceData.buyerAddress,
            invoiceData.cgstRate, invoiceData.cgstAmount, invoiceData.sgstRate, invoiceData.sgstAmount,
            invoiceData.igstRate, invoiceData.igstAmount, invoiceData.cessAmount,
            invoiceData.taxableValue, invoiceData.grandTotal,
        ];

        let csv = headers.map(h => `"${h}"`).join(',') + '\n';
        csv += values.map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(',') + '\n';

        // Line items
        if (invoiceData.lineItems && invoiceData.lineItems.length > 0) {
            csv += '\n';
            csv += '"Line Items"\n';
            csv += '"#","Description","HSN/SAC","Qty","Unit","Rate","Amount"\n';
            invoiceData.lineItems.forEach((item, i) => {
                csv += [
                    i + 1,
                    `"${(item.description || '').replace(/"/g, '""')}"`,
                    `"${item.hsn || ''}"`,
                    `"${item.qty || ''}"`,
                    `"${item.unit || ''}"`,
                    `"${item.rate || ''}"`,
                    `"${item.amount || ''}"`,
                ].join(',') + '\n';
            });
        }

        downloadFile(csv, `${sanitizeFilename(filename)}_invoice.csv`, 'text/csv');
    }

    function sanitizeForExport(data) {
        const d = { ...data };
        delete d.rawText; // Don't include raw OCR text in export
        return d;
    }

    function sanitizeFilename(name) {
        return (name || 'invoice').replace(/\.[^/.]+$/, '').replace(/[^a-z0-9_\-]/gi, '_').substring(0, 50);
    }

    function downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    return { exportJSON, exportAllJSON, exportCSV };
})();
