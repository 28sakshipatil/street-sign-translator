// Main Application Controller
class SignTranslatorApp {
    constructor() {
        this.currentImage = null;
        this.stream = null;
        this.isProcessing = false;
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeApp();
    }

    initializeElements() {
        // Header elements
        this.darkModeToggle = document.getElementById('darkModeToggle');
        this.toggleIcon = this.darkModeToggle.querySelector('.toggle-icon');
        
        // Mode selection
        this.modeRadios = document.querySelectorAll('input[name="mode"]');
        
        // API Status
        this.apiStatus = document.getElementById('apiStatus');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = document.getElementById('statusText');
        
        // Camera elements
        this.cameraBtn = document.getElementById('cameraBtn');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.fileInput = document.getElementById('fileInput');
        this.cameraContainer = document.getElementById('cameraContainer');
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.captureBtn = document.getElementById('captureBtn');
        this.closeCameraBtn = document.getElementById('closeCameraBtn');
        
        // Preview elements
        this.imagePreview = document.getElementById('imagePreview');
        this.previewImage = document.getElementById('previewImage');
        this.removeImageBtn = document.getElementById('removeImageBtn');
        
        // Processing elements
        this.processBtn = document.getElementById('processBtn');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.loadingText = document.getElementById('loadingText');
        
        // Results elements
        this.extractedText = document.getElementById('extractedText');
        this.transliteratedText = document.getElementById('transliteratedText');
        this.confidenceScore = document.getElementById('confidenceScore');
        this.confidenceValue = document.getElementById('confidenceValue');
        
        // Language selection
        this.sourceLanguage = document.getElementById('sourceLanguage');
        this.targetLanguage = document.getElementById('targetLanguage');
        
        // API Configuration
        this.ocrApiKey = document.getElementById('ocrApiKey');
        this.saveApiKeys = document.getElementById('saveApiKeys');
    }

    setupEventListeners() {
        // Dark mode toggle
        this.darkModeToggle.addEventListener('click', () => this.toggleDarkMode());
        
        // Mode selection
        this.modeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => this.handleModeChange(e.target.value));
        });
        
        // Camera functionality
        this.cameraBtn.addEventListener('click', () => this.startCamera());
        this.captureBtn.addEventListener('click', () => this.captureImage());
        this.closeCameraBtn.addEventListener('click', () => this.stopCamera());
        
        // Upload functionality
        this.uploadBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        
        // Image preview
        this.removeImageBtn.addEventListener('click', () => this.removeImage());
        
        // Processing
        this.processBtn.addEventListener('click', () => this.processImage());
        
        // API Keys
        this.saveApiKeys.addEventListener('click', () => this.saveApiKeys());
        
        // Language change
        this.sourceLanguage.addEventListener('change', () => this.handleLanguageChange());
        this.targetLanguage.addEventListener('change', () => this.handleLanguageChange());
        
        // Load saved API keys
        this.loadApiKeys();
    }

    initializeApp() {
        // Load saved theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.toggleIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
        
        // Check API status
        this.updateApiStatus('checking', 'Checking API status...');
        
        // Set default mode
        this.handleModeChange('online');
    }

    toggleDarkMode() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        this.toggleIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    }

    handleModeChange(mode) {
        console.log('Mode changed to:', mode);
        
        // Update UI based on mode
        if (mode === 'offline') {
            // Show package manager
            const packageManager = document.getElementById('packageManager');
            if (packageManager) packageManager.style.display = 'block';
            
            // Check if packages are installed
            if (packageManager.installedPackages.size === 0) {
                this.updateApiStatus('warning', 'Please install language packs for offline mode');
                return;
            }
            
            this.updateApiStatus('offline', 'Offline mode - Local processing');
        } else if (mode === 'online') {
            // Hide package manager
            const packageManager = document.getElementById('packageManager');
            if (packageManager) packageManager.style.display = 'none';
            
            // Check API keys
            if (!this.ocrApiKey.value) {
                this.updateApiStatus('error', 'Please configure API key for online mode');
                return;
            }
            
            this.updateApiStatus('connected', 'Online mode - API processing');
        } else if (mode === 'hybrid') {
            this.updateApiStatus('connected', 'Hybrid mode - Best of both worlds');
        }
        
        // Update engines
        if (window.ocrEngine) {
            window.ocrEngine.setProvider(mode);
        }
        if (window.transliterationEngine) {
            window.transliterationEngine.setProvider(mode);
        }
    }

    async startCamera() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            this.video.srcObject = this.stream;
            this.cameraContainer.style.display = 'block';
            this.cameraBtn.style.display = 'none';
            this.uploadBtn.style.display = 'none';
        } catch (error) {
            alert('Unable to access camera. Please ensure you have granted camera permissions.');
            console.error('Camera error:', error);
        }
    }

    captureImage() {
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        this.canvas.getContext('2d').drawImage(this.video, 0, 0);
        
        this.canvas.toBlob((blob) => {
            const file = new File([blob], 'captured-image.jpg', { type: 'image/jpeg' });
            this.handleImageFile(file);
            this.stopCamera();
        }, 'image/jpeg');
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        this.cameraContainer.style.display = 'none';
        this.cameraBtn.style.display = 'inline-flex';
        this.uploadBtn.style.display = 'inline-flex';
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            this.handleImageFile(file);
        }
    }

    handleImageFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentImage = e.target.result;
            this.previewImage.src = this.currentImage;
            this.imagePreview.style.display = 'block';
            this.processBtn.disabled = false;
            
            // Add fade-in animation
            this.imagePreview.classList.add('fade-in');
            setTimeout(() => this.imagePreview.classList.remove('fade-in'), 500);
        };
        reader.readAsDataURL(file);
    }

    removeImage() {
        this.currentImage = null;
        this.imagePreview.style.display = 'none';
        this.processBtn.disabled = true;
        this.fileInput.value = '';
        
        // Reset results
        this.extractedText.innerHTML = '<p class="placeholder">Text will appear here after processing</p>';
        this.transliteratedText.innerHTML = '<p class="placeholder">Transliteration will appear here</p>';
        this.confidenceScore.style.display = 'none';
    }

    async processImage() {
        if (!this.currentImage || this.isProcessing) return;

        const currentMode = document.querySelector('input[name="mode"]:checked').value;
        
        if (currentMode === 'online' && !this.ocrApiKey.value) {
            alert('Please configure OCR API key for online mode');
            return;
        }

        this.isProcessing = true;
        this.processBtn.disabled = true;
        this.loadingSpinner.style.display = 'block';
        this.loadingText.textContent = 'Processing image...';

        try {
            // Step 1: OCR
            this.loadingText.textContent = 'Performing OCR...';
            const ocrResult = await window.ocrEngine.processImage(this.currentImage, {
                language: this.sourceLanguage.value === 'auto' ? 'eng' : this.sourceLanguage.value
            });

            // Display OCR result
            this.extractedText.innerHTML = `<p>${ocrResult.text}</p>`;
            this.confidenceValue.textContent = Math.round(ocrResult.confidence) + '%';
            this.confidenceScore.style.display = 'block';

            // Step 2: Transliteration
            this.loadingText.textContent = 'Transliterating text...';
            const transliterated = await window.transliterationEngine.transliterate(
                ocrResult.text,
                this.targetLanguage.value,
                this.sourceLanguage.value
            );

            this.transliteratedText.innerHTML = `<p>${transliterated}</p>`;

            // Add fade-in animation
            this.extractedText.parentElement.classList.add('fade-in');
            this.transliteratedText.parentElement.classList.add('fade-in');
            setTimeout(() => {
                this.extractedText.parentElement.classList.remove('fade-in');
                this.transliteratedText.parentElement.classList.remove('fade-in');
            }, 500);

        } catch (error) {
            console.error('Processing error:', error);
            this.extractedText.innerHTML = `<p class="error">Error: ${error.message}</p>`;
            this.transliteratedText.innerHTML = `<p class="error">Transliteration failed</p>`;
        } finally {
            this.isProcessing = false;
            this.processBtn.disabled = false;
            this.loadingSpinner.style.display = 'none';
        }
    }

    handleLanguageChange() {
        // Re-process if image is already loaded
        if (this.currentImage && !this.isProcessing) {
            // Reset results
            this.extractedText.innerHTML = '<p class="placeholder">Text will appear here after processing</p>';
            this.transliteratedText.innerHTML = '<p class="placeholder">Transliteration will appear here</p>';
            this.confidenceScore.style.display = 'none';
        }
    }

    saveApiKeys() {
        const ocrKey = this.ocrApiKey.value.trim();
        
        if (ocrKey) {
            API_KEYS.ocrSpace = ocrKey;
            localStorage.setItem('ocrApiKey', ocrKey);
            
            if (window.ocrEngine) {
                window.ocrEngine.setApiKeys(API_KEYS);
            }
            
            alert('API keys saved successfully!');
            this.updateApiStatus('connected', 'API keys configured');
        } else {
            alert('Please enter valid API keys');
        }
    }

    loadApiKeys() {
        const savedKey = localStorage.getItem('ocrApiKey');
        if (savedKey) {
            this.ocrApiKey.value = savedKey;
            API_KEYS.ocrSpace = savedKey;
            
            if (window.ocrEngine) {
                window.ocrEngine.setApiKeys(API_KEYS);
            }
            
            this.updateApiStatus('connected', 'API keys loaded');
        }
    }

    updateApiStatus(status, message) {
        if (!this.statusIndicator || !this.statusText) return;
        
        this.statusIndicator.className = 'status-indicator ' + status;
        this.statusText.textContent = 'Status: ' + message;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.signTranslatorApp = new SignTranslatorApp();
});