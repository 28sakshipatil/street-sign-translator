// Global Configuration
window.CONFIG = {
    // API Endpoints
    API_ENDPOINTS: {
        OCR_SPACE: 'https://api.ocr.space/parse/image'
    },
    
    // Package Server (local for demo)
    PACKAGE_SERVER: './language-packs/',
    
    // Storage limits
    MAX_STORAGE_MB: 50,
    
    // Default settings
    DEFAULT_MODE: 'online',
    DEFAULT_SOURCE_LANG: 'auto',
    DEFAULT_TARGET_LANG: 'en',
    
    // OCR Settings
    OCR_SETTINGS: {
        engine: 2,
        isOverlayRequired: false,
        detectOrientation: true
    }
};

// API Keys storage
window.API_KEYS = {
    ocrSpace: 'K86254359788957',
    google: ''
};