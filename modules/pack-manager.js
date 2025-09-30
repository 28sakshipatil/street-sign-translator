class PackageManager {
    constructor() {
        this.availablePackages = {
            'hindi': {
                name: 'Hindi Pack',
                size: '2.3 MB',
                languages: ['hi'],
                description: 'Hindi OCR + Devanagari transliteration',
                words: 15000,
                icon: '🕉️'
            },
            'tamil': {
                name: 'Tamil Pack',
                size: '2.1 MB',
                languages: ['ta'],
                description: 'Tamil OCR + Tamil script transliteration',
                words: 12000,
                icon: '𑌅'
            },
            'telugu': {
                name: 'Telugu Pack',
                size: '2.2 MB',
                languages: ['te'],
                description: 'Telugu OCR + Telugu script transliteration',
                words: 13000,
                icon: 'తె'
            },
            'kannada': {
                name: 'Kannada Pack',
                size: '2.0 MB',
                languages: ['kn'],
                description: 'Kannada OCR + Kannada script transliteration',
                words: 11000,
                icon: 'ಕ'
            },
            'multi-indic': {
                name: 'Multi-Indic Pack',
                size: '8.5 MB',
                languages: ['hi', 'ta', 'te', 'kn'],
                description: 'All major Indian languages in one pack',
                words: 75000,
                icon: '🇮🇳',
                popular: true
            }
        };

        this.installedPackages = new Set();
        this.currentMode = CONFIG.DEFAULT_MODE;
        this.storageQuota = 0;
        this.storageUsed = 0;
        
        this.init();
    }

    async init() {
        await this.checkStorageQuota();
        await this.loadInstalledPackages();
        this.renderPackageGrid();
        this.updateStorageDisplay();
        this.updateActivePackages();
        this.setupEventListeners();
    }

    async checkStorageQuota() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            this.storageQuota = estimate.quota;
            this.storageUsed = estimate.usage;
        }
    }

    updateStorageDisplay() {
        const usedMB = (this.storageUsed / (1024 * 1024)).toFixed(1);
        const availableMB = (this.storageQuota / (1024 * 1024)).toFixed(1);
        
        const storageUsedEl = document.getElementById('storageUsed');
        const storageAvailableEl = document.getElementById('storageAvailable');
        
        if (storageUsedEl) storageUsedEl.textContent = `${usedMB} MB`;
        if (storageAvailableEl) storageAvailableEl.textContent = `${availableMB} MB`;
    }

    renderPackageGrid() {
        const grid = document.getElementById('packageGrid');
        if (!grid) return;

        grid.innerHTML = '';

        Object.entries(this.availablePackages).forEach(([id, pack]) => {
            const isInstalled = this.installedPackages.has(id);
            
            const packageCard = document.createElement('div');
            packageCard.className = `package-card ${pack.popular ? 'popular' : ''} ${isInstalled ? 'installed' : ''}`;
            packageCard.innerHTML = `
                <div class="package-header">
                    <span class="package-icon">${pack.icon}</span>
                    <span class="package-name">${pack.name}</span>
                    ${pack.popular ? '<span class="popular-badge">🔥 Popular</span>' : ''}
                </div>
                <div class="package-details">
                    <p>${pack.description}</p>
                    <div class="package-stats">
                        <span>📊 ${pack.words.toLocaleString()} words</span>
                        <span>💾 ${pack.size}</span>
                    </div>
                    <div class="package-languages">
                        ${pack.languages.map(lang => `<span class="lang-tag">${lang}</span>`).join('')}
                    </div>
                </div>
                <div class="package-actions">
                    ${isInstalled ? 
                        `<button class="btn btn-remove" onclick="packageManager.uninstallPackage('${id}')">
                            <span class="icon">🗑️</span> Remove
                        </button>` :
                        `<button class="btn btn-primary" onclick="packageManager.downloadPackage('${id}')">
                            <span class="icon">⬇️</span> Download
                        </button>`
                    }
                </div>
            `;
            
            grid.appendChild(packageCard);
        });
    }

    async downloadPackage(packageId) {
        const pack = this.availablePackages[packageId];
        if (!pack) return;

        try {
            this.showLoading(`Downloading ${pack.name}...`);
            
            // Simulate download delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Store package data
            await this.storePackage(packageId, pack);
            
            // Mark as installed
            this.installedPackages.add(packageId);
            
            alert(`✅ ${pack.name} downloaded successfully!`);
            
        } catch (error) {
            console.error('Download error:', error);
            alert(`❌ Failed to download ${pack.name}`);
        }

        this.hideLoading();
        this.renderPackageGrid();
        this.updateStorageDisplay();
        this.updateActivePackages();
    }

    async storePackage(packageId, pack) {
        // Generate mock package data
        const packageData = {
            metadata: {
                id: packageId,
                name: pack.name,
                version: '1.0.0',
                installed: new Date().toISOString(),
                languages: pack.languages
            },
            data: {
                words: this.generateLanguageData(pack.languages),
                version: '1.0.0'
            }
        };

        localStorage.setItem(`package_${packageId}`, JSON.stringify(packageData));
        
        // Update storage usage
        await this.checkStorageQuota();
    }

    generateLanguageData(languages) {
        const data = {};
        languages.forEach(lang => {
            data[lang] = {
                commonWords: this.getCommonWords(lang),
                transliteration: this.getTranslitRules(lang),
                ocrPatterns: this.getOCRPatterns(lang)
            };
        });
        return data;
    }

    getCommonWords(language) {
        const words = {
            'hi': ['रोड', 'मार्ग', 'गली', 'चौक', 'नगर', 'महात्मा गांधी', 'नेहरू'],
            'ta': ['ரோடு', 'தெரு', 'சந்திப்பு', 'நகர்', 'மெயின்'],
            'te': ['రోడ్', 'వీధి', 'క్రాస్', 'నగర్', 'మెయిన్'],
            'kn': ['ರೋಡ್', 'ರಸ್ತೆ', 'ಚೌಕ', 'ನಗರ', 'ಮೈನ್'],
            'en': ['ROAD', 'STREET', 'MAIN', 'CROSS', 'CIRCLE']
        };
        return words[language] || [];
    }

    getTranslitRules(language) {
        const rules = {
            'hi': { 'road': 'रोड', 'street': 'सड़क', 'main': 'मुख्य' },
            'ta': { 'road': 'ரோடு', 'street': 'தெரு', 'main': 'மெயின்' },
            'te': { 'road': 'రోడ్', 'street': 'వీధి', 'main': 'మెయిన్' },
            'kn': { 'road': 'ರೋಡ್', 'street': 'ರಸ್ತೆ', 'main': 'ಮುಖ್ಯ' },
            'en': { 'road': 'ROAD', 'street': 'STREET', 'main': 'MAIN' }
        };
        return rules[language] || {};
    }

    getOCRPatterns(language) {
        const patterns = {
            'hi': ['[ा-्]', '[०-९]'],
            'ta': ['[ா-்]', '[௦-௯]'],
            'te': ['[ా-్]', '[౦-౯]'],
            'kn': ['[ಾ-್]', '[೦-೯]'],
            'en': ['[A-Za-z]', '[0-9]']
        };
        return patterns[language] || [];
    }

    uninstallPackage(packageId) {
        if (!this.installedPackages.has(packageId)) return;

        const pack = this.availablePackages[packageId];
        if (confirm(`Remove ${pack.name}? This will free up ${pack.size} of storage.`)) {
            localStorage.removeItem(`package_${packageId}`);
            this.installedPackages.delete(packageId);
            
            this.renderPackageGrid();
            this.updateStorageDisplay();
            this.updateActivePackages();
            
            alert(`✅ ${pack.name} removed successfully!`);
        }
    }

    updateActivePackages() {
        const activeList = document.getElementById('activeList');
        if (!activeList) return;

        if (this.installedPackages.size === 0) {
            activeList.innerHTML = '<p class="no-packages">No packages installed</p>';
            return;
        }

        activeList.innerHTML = Array.from(this.installedPackages).map(id => {
            const pack = this.availablePackages[id];
            return `
                <div class="active-package">
                    <span class="active-icon">${pack.icon}</span>
                    <span class="active-name">${pack.name}</span>
                    <span class="active-size">${pack.size}</span>
                </div>
            `;
        }).join('');
    }

    setupEventListeners() {
        // Mode selection listeners
        document.querySelectorAll('input[name="mode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.setMode(e.target.value);
            });
        });
    }

    setMode(mode) {
        this.currentMode = mode;
        console.log(`Package Manager: Switched to ${mode} mode`);
        
        // Update OCR engine
        if (window.ocrEngine) {
            window.ocrEngine.setProvider(mode);
        }
        
        // Show/hide package manager based on mode
        const packageManager = document.getElementById('packageManager');
        if (packageManager) {
            packageManager.style.display = mode === 'offline' ? 'block' : 'none';
        }
        
        // Check if packages needed for offline mode
        if (mode === 'offline' && this.installedPackages.size === 0) {
            alert('Please install at least one language pack for offline mode');
        }
    }

    async loadInstalledPackages() {
        // Load from localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('package_')) {
                const packageId = key.replace('package_', '');
                this.installedPackages.add(packageId);
            }
        }
    }

    getInstalledLanguages() {
        const languages = new Set();
        this.installedPackages.forEach(packageId => {
            const pack = this.availablePackages[packageId];
            if (pack) {
                pack.languages.forEach(lang => languages.add(lang));
            }
        });
        return Array.from(languages);
    }

    isPackageInstalled(packageId) {
        return this.installedPackages.has(packageId);
    }

    async getPackageData(packageId) {
        const stored = localStorage.getItem(`package_${packageId}`);
        return stored ? JSON.parse(stored) : null;
    }

    showLoading(message) {
        const loadingText = document.getElementById('loadingText');
        const loadingSpinner = document.getElementById('loadingSpinner');
        if (loadingText) loadingText.textContent = message;
        if (loadingSpinner) loadingSpinner.style.display = 'block';
    }

    hideLoading() {
        const loadingSpinner = document.getElementById('loadingSpinner');
        if (loadingSpinner) loadingSpinner.style.display = 'none';
    }
}

// Initialize package manager
window.packageManager = new PackageManager();