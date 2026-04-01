/* =========================================
   StorageManager — API + localStorage persistence
   ========================================= */

const StorageManager = (() => {
    const KEYS = {
        API_KEY: 'invoiceai_api_key',         // legacy
        API_KEY_GEMINI: 'invoiceai_key_gemini',
        API_KEY_GROQ: 'invoiceai_key_groq',
        API_KEY_OPENROUTER: 'invoiceai_key_openrouter',
        PROVIDER: 'invoiceai_provider',
        MODE: 'invoiceai_mode',
        AUTH_TOKEN: 'invoiceai_token',
    };

    function getToken() {
        return localStorage.getItem(KEYS.AUTH_TOKEN);
    }

    function setToken(token) {
        if (token) localStorage.setItem(KEYS.AUTH_TOKEN, token);
        else localStorage.removeItem(KEYS.AUTH_TOKEN);
    }

    // --- API Backend logic ---
    async function getHistory() {
        if (!getToken()) return [];
        try {
            const res = await fetch('/api/invoices', {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            if (!res.ok) return [];
            return await res.json();
        } catch(e) {
            console.error(e);
            return [];
        }
    }

    async function saveInvoice(invoiceData) {
        if (!getToken()) throw new Error("Please log in to save invoices.");
        const entry = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            filename: invoiceData.filename || 'Unknown',
            total_amount: parseFloat(invoiceData.grandTotal) || 0.0,
            tax_amount: parseFloat(invoiceData.totalTax) || 0.0,
            data: invoiceData,
        };
        
        const res = await fetch('/api/invoices', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(entry)
        });
        if (!res.ok) throw new Error("Failed to save to database");
        return {
            ...entry,
            processedAt: new Date().toISOString()
        };
    }

    async function getInvoice(id) {
        // Typically handled by searching locally fetched history, or add a specific GET /api/invoices/:id route
        const history = await getHistory();
        return history.find(h => h.id === id) || null;
    }

    async function deleteInvoice(id) {
        if (!getToken()) return;
        await fetch(`/api/invoices/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
    }

    async function clearHistory() {
        const history = await getHistory();
        for (const h of history) {
            await deleteInvoice(h.id);
        }
    }

    // --- Provider ---
    function getProvider() {
        return localStorage.getItem(KEYS.PROVIDER) || 'groq';
    }

    function setProvider(provider) {
        localStorage.setItem(KEYS.PROVIDER, provider);
    }

    // --- API Keys (per-provider) ---
    function getApiKey(provider) {
        const p = provider || getProvider();
        switch (p) {
            case 'openrouter': return localStorage.getItem(KEYS.API_KEY_OPENROUTER) || '';
            case 'groq':
            default:
                return localStorage.getItem(KEYS.API_KEY_GROQ) || '';
        }
    }

    function setApiKey(provider, key) {
        switch (provider) {
            case 'openrouter':
                key ? localStorage.setItem(KEYS.API_KEY_OPENROUTER, key)
                    : localStorage.removeItem(KEYS.API_KEY_OPENROUTER);
                break;
            case 'groq':
            default:
                key ? localStorage.setItem(KEYS.API_KEY_GROQ, key)
                    : localStorage.removeItem(KEYS.API_KEY_GROQ);
                break;
        }
    }

    function getActiveApiKey() {
        return getApiKey(getProvider());
    }

    function getMode() {
        return localStorage.getItem(KEYS.MODE) || 'regex';
    }

    function setMode(mode) {
        localStorage.setItem(KEYS.MODE, mode);
    }

    return {
        getToken, setToken,
        getHistory, saveInvoice, getInvoice, deleteInvoice, clearHistory,
        getProvider, setProvider, getApiKey, setApiKey, getActiveApiKey, getMode, setMode
    };
})();
