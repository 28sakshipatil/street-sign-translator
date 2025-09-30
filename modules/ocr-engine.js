class OCREngine {
    constructor() {
        this.provider = 'api';
        this.tesseractWorker = null;
        this.isInitialized = false;
        this.apiKeys = {
            ocrSpace: ''
        };
    }

    setProvider(provider) {
        this.provider = provider;
        console.log(`OCR Engine: Switched to ${provider} provider`);
    }

    setApiKeys(keys) {
        this.apiKeys = keys;
    }

    async initializeTesseract() {
        if (this.isInitialized) return;

        if (typeof Tesseract === 'undefined') {
            throw new Error('Tesseract.js not loaded');
        }

        try {
            console.log('OCR Engine: Initializing Tesseract...');
            
            this.tesseractWorker = await Tesseract.createWorker({
                logger: m => {
                    if (m.status === 'recognizing text') {
                        console.log('OCR Progress:', m.progress * 100 + '%');
                    }
                }
            });

            // Load languages from installed packages
            const installedLangs = packageManager.getInstalledLanguages();
            const langString = installedLangs.length > 0 ? installedLangs.join('+') : 'eng';
            
            await this.tesseractWorker.loadLanguage(langString);
            await this.tesseractWorker.initialize(langString);
            
            this.isInitialized = true;
            console.log('OCR Engine: Tesseract initialized with languages:', installedLangs);
        } catch (error) {
            console.error('OCR Engine: Tesseract initialization failed:', error);
            throw error;
        }
    }

    async processImage(imageData, options = {}) {
        switch (this.provider) {
            case 'api':
                return await this.processWithAPI(imageData, options);
            case 'local':
                return await this.processLocally(imageData, options);
            case 'hybrid':
                try {
                    return await this.processLocally(imageData, options);
                } catch (error) {
                    console.log('Local OCR failed, falling back to API');
                    return await this.processWithAPI(imageData, options);
                }
            default:
                throw new Error(`Unknown provider: ${this.provider}`);
        }
    }

    async processWithAPI(imageData, options) {
        if (!this.apiKeys.ocrSpace) {
            throw new Error('OCR API key not configured');
        }

        try {
            const response = await fetch(imageData);
            const blob = await response.blob();
            
            const formData = new FormData();
            formData.append('file', blob, 'image.jpg');
            formData.append('language', options.language || 'eng');
            formData.append('isOverlayRequired', 'false');
            formData.append('OCREngine', '2');

            const ocrResponse = await fetch(CONFIG.API_ENDPOINTS.OCR_SPACE, {
                method: 'POST',
                headers: {
                    'apikey': this.apiKeys.ocrSpace
                },
                body: formData
            });

            const data = await ocrResponse.json();
            
            if (data.IsErroredOnProcessing) {
                throw new Error(data.ErrorMessage || 'OCR processing failed');
            }

            if (data.ParsedResults && data.ParsedResults.length > 0) {
                return {
                    text: data.ParsedResults[0].ParsedText,
                    confidence: data.ParsedResults[0].FileParseExitCode === 1 ? 95 : 75,
                    provider: 'api'
                };
            }

            throw new Error('No text found in image');
        } catch (error) {
            console.error('API OCR Error:', error);
            throw error;
        }
    }

    async processLocally(imageData, options) {
        if (!this.isInitialized) {
            await this.initializeTesseract();
        }

        try {
            // Configure Tesseract parameters
            await this.tesseractWorker.setParameters({
                tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789- .,;:!?()',
                tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
                preserve_interword_spaces: '1'
            });

            // Perform OCR
            const result = await this.tesseractWorker.recognize(imageData);
            
            return {
                text: result.data.text.trim(),
                confidence: result.data.confidence || 85,
                provider: 'local'
            };
        } catch (error) {
            console.error('Local OCR Error:', error);
            throw error;
        }
    }

    terminate() {
        if (this.tesseractWorker) {
            this.tesseractWorker.terminate();
            this.tesseractWorker = null;
            this.isInitialized = false;
        }
    }
}

// Create global instance
window.ocrEngine = new OCREngine();