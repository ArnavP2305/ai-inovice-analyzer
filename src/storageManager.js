/* =========================================
   StorageManager — localStorage persistence
   ========================================= */

const StorageManager = (() => {
    const KEYS = {
        HISTORY: 'invoiceai_history',
        API_KEY: 'invoiceai_api_key',         // legacy (gemini)
        API_KEY_GEMINI: 'invoiceai_key_gemini',
        API_KEY_GROQ: 'invoiceai_key_groq',
        API_KEY_OPENROUTER: 'invoiceai_key_openrouter',
        PROVIDER: 'invoiceai_provider',
        MODE: 'invoiceai_mode',
    };

    const MAX_HISTORY = 100;

    function getHistory() {
        try {
            const data = localStorage.getItem(KEYS.HISTORY);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    function saveInvoice(invoiceData) {
        const history = getHistory();
        const entry = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            filename: invoiceData.filename || 'Unknown',
            processedAt: new Date().toISOString(),
            complianceScore: invoiceData.complianceScore || 0,
            data: invoiceData,
        };
        history.unshift(entry);
        if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
        localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
        return entry;
    }

    function getInvoice(id) {
        const history = getHistory();
        return history.find(h => h.id === id) || null;
    }

    function deleteInvoice(id) {
        let history = getHistory();
        history = history.filter(h => h.id !== id);
        localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
    }

    function clearHistory() {
        localStorage.removeItem(KEYS.HISTORY);
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

    // --- Active key (for current provider) ---
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
        getHistory,
        saveInvoice,
        getInvoice,
        deleteInvoice,
        clearHistory,
        getProvider,
        setProvider,
        getApiKey,
        setApiKey,
        getActiveApiKey,
        getMode,
        setMode,
    };
})();
