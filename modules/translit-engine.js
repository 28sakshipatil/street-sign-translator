class TransliterationEngine {
    constructor() {
        this.provider = 'local';
    }

    setProvider(provider) {
        this.provider = provider;
        console.log(`Transliteration Engine: Switched to ${provider} provider`);
    }

    async transliterate(text, targetLang, sourceLang = 'auto') {
        if (!text || !text.trim()) return '';

        switch (this.provider) {
            case 'api':
                return await this.transliterateOnline(text, targetLang, sourceLang);
            case 'local':
                return await this.transliterateOffline(text, targetLang, sourceLang);
            case 'hybrid':
                try {
                    return await this.transliterateOffline(text, targetLang, sourceLang);
                } catch (error) {
                    console.log('Offline transliteration failed, using fallback');
                    return this.transliterateOffline(text, targetLang, sourceLang);
                }
            default:
                return this.transliterateOffline(text, targetLang, sourceLang);
        }
    }

    async transliterateOffline(text, targetLang, sourceLang) {
        try {
            const cleanText = text.trim();
            
            // Get language data from installed packages
            const langData = await this.getLanguageData(targetLang);
            if (!langData) {
                return this.basicTransliteration(cleanText, targetLang);
            }

            // Apply transliteration rules
            let result = cleanText.toLowerCase();
            
            // Apply word-level mappings first
            if (langData.transliteration) {
                for (const [english, native] of Object.entries(langData.transliteration)) {
                    result = result.replace(new RegExp(`\\b${english}\\b`, 'g'), native);
                }
            }

            // Apply character-level mappings
            result = this.applyCharacterMapping(result, targetLang);

            return result.trim();
        } catch (error) {
            console.error('Transliteration error:', error);
            return text; // Return original text on error
        }
    }

    async getLanguageData(language) {
        // Get data from installed packages
        const installedPackages = packageManager.installedPackages;
        
        for (const packageId of installedPackages) {
            const packageData = await packageManager.getPackageData(packageId);
            if (packageData && packageData.data && packageData.data.words && packageData.data.words[language]) {
                return packageData.data.words[language];
            }
        }
        
        return null;
    }

    basicTransliteration(text, targetLang) {
        // Fallback basic mapping
        const basicMaps = {
            'hi': {
                'a': 'अ', 'b': 'ब', 'c': 'क', 'd': 'द', 'e': 'ए', 'f': 'फ', 'g': 'ग', 'h': 'ह',
                'i': 'इ', 'j': 'ज', 'k': 'क', 'l': 'ल', 'm': 'म', 'n': 'न', 'o': 'ओ', 'p': 'प',
                'q': 'क', 'r': 'र', 's': 'स', 't': 'त', 'u': 'उ', 'v': 'व', 'w': 'व', 'x': 'क्स',
                'y': 'य', 'z': 'ज', 'road': 'रोड', 'street': 'सड़क', 'main': 'मुख्य'
            },
            'ta': {
                'a': 'அ', 'b': 'ப', 'c': 'க', 'd': 'த', 'e': 'எ', 'f': 'ப', 'g': 'க', 'h': 'ஹ',
                'i': 'இ', 'j': 'ஜ', 'k': 'க', 'l': 'ல', 'm': 'ம', 'n': 'ந', 'o': 'ஒ', 'p': 'ப',
                'r': 'ர', 's': 'ஸ', 't': 'த', 'u': 'உ', 'v': 'வ', 'y': 'ய', 'z': 'ஜ',
                'road': 'ரோடு', 'street': 'தெரு', 'main': 'மெயின்'
            },
            'te': {
                'a': 'అ', 'b': 'బ', 'c': 'క', 'd': 'ద', 'e': 'ఎ', 'f': 'ఫ', 'g': 'గ', 'h': 'హ',
                'i': 'ఇ', 'j': 'జ', 'k': 'క', 'l': 'ల', 'm': 'మ', 'n': 'న', 'o': 'ఒ', 'p': 'ప',
                'r': 'ర', 's': 'స', 't': 'త', 'u': 'ఉ', 'v': 'వ', 'y': 'య', 'z': 'జ',
                'road': 'రోడ్', 'street': 'వీధి', 'main': 'మెయిన్'
            },
            'kn': {
                'a': 'ಅ', 'b': 'ಬ', 'c': 'ಕ', 'd': 'ದ', 'e': 'ಎ', 'f': 'ಫ', 'g': 'ಗ', 'h': 'ಹ',
                'i': 'ಇ', 'j': 'ಜ', 'k': 'ಕ', 'l': 'ಲ', 'm': 'ಮ', 'n': 'ನ', 'o': 'ಒ', 'p': 'ಪ',
                'r': 'ರ', 's': 'ಸ', 't': 'ತ', 'u': 'ಉ', 'v': 'ವ', 'y': 'ಯ', 'z': 'ಜ',
                'road': 'ರೋಡ್', 'street': 'ರಸ್ತೆ', 'main': 'ಮುಖ್ಯ'
            },
            'ml': {
                'a': 'അ', 'b': 'ബ', 'c': 'ക', 'd': 'ദ', 'e': 'എ', 'f': 'ഫ', 'g': 'ഗ', 'h': 'ഹ',
                'i': 'ഇ', 'j': 'ജ', 'k': 'ക', 'l': 'ല', 'm': 'മ', 'n': 'ന', 'o': 'ഒ', 'p': 'പ',
                'r': 'ര', 's': 'സ', 't': 'ത', 'u': 'ഉ', 'v': 'വ', 'y': 'യ', 'z': 'ജ',
                'road': 'റോഡ്', 'street': 'തെരുവ്', 'main': 'മുഖ്യ'
            },
            'bn': {
                'a': 'অ', 'b': 'ব', 'c': 'ক', 'd': 'দ', 'e': 'এ', 'f': 'ফ', 'g': 'গ', 'h': 'হ',
                'i': 'ই', 'j': 'জ', 'k': 'ক', 'l': 'ল', 'm': 'ম', 'n': 'ন', 'o': 'ও', 'p': 'প',
                'r': 'র', 's': 'স', 't': 'ত', 'u': 'উ', 'v': 'ভ', 'y': 'য়', 'z': 'জ',
                'road': 'রোড', 'street': 'সড়ক', 'main': 'মুখ্য'
            },
            'gu': {
                'a': 'અ', 'b': 'બ', 'c': 'ક', 'd': 'દ', 'e': 'એ', 'f': 'ફ', 'g': 'ગ', 'h': 'હ',
                'i': 'ઇ', 'j': 'જ', 'k': 'ક', 'l': 'લ', 'm': 'મ', 'n': 'ન', 'o': 'ઓ', 'p': 'પ',
                'r': 'ર', 's': 'સ', 't': 'ત', 'u': 'ઉ', 'v': 'વ', 'y': 'ય', 'z': 'જ',
                'road': 'રોડ', 'street': 'રસ્તો', 'main': 'મુખ્ય'
            },
            'pa': {
                'a': 'ਅ', 'b': 'ਬ', 'c': 'ਕ', 'd': 'ਦ', 'e': 'ਏ', 'f': 'ਫ', 'g': 'ਗ', 'h': 'ਹ',
                'i': 'ਇ', 'j': 'ਜ', 'k': 'ਕ', 'l': 'ਲ', 'm': 'ਮ', 'n': 'ਨ', 'o': 'ਓ', 'p': 'ਪ',
                'r': 'ਰ', 's': 'ਸ', 't': 'ਤ', 'u': 'ਉ', 'v': 'ਵ', 'y': 'ਯ', 'z': 'ਜ',
                'road': 'ਰੋਡ', 'street': 'ਗਲੀ', 'main': 'ਮੁੱਖ'
            },
            'or': {
                'a': 'ଅ', 'b': 'ବ', 'c': 'କ', 'd': 'ଦ', 'e': 'ଏ', 'f': 'ଫ', 'g': 'ଗ', 'h': 'ହ',
                'i': 'ଇ', 'j': 'ଜ', 'k': 'କ', 'l': 'ଲ', 'm': 'ମ', 'n': 'ନ', 'o': 'ଓ', 'p': 'ପ',
                'r': 'ର', 's': 'ସ', 't': 'ତ', 'u': 'ଉ', 'v': 'ଭ', 'y': 'ୟ', 'z': 'ଜ',
                'road': 'ରୋଡ', 'street': 'ଗଳି', 'main': 'ମୁଖ୍ୟ'
            }
        };

        if (targetLang === 'en') {
            return text.toUpperCase();
        }

        const map = basicMaps[targetLang];
        if (!map) return text;

        let result = '';
        const words = text.toLowerCase().split(' ');
        
        for (let word of words) {
            if (map[word]) {
                result += map[word] + ' ';
            } else {
                for (let char of word) {
                    result += map[char] || char;
                }
                result += ' ';
            }
        }
        
        return result.trim();
    }

    applyCharacterMapping(text, targetLang) {
        // Additional character-level mappings can be added here
        return text;
    }

    async transliterateOnline(text, targetLang, sourceLang) {
        // Placeholder for online API (would use Google Translate or similar)
        return this.transliterateOffline(text, targetLang, sourceLang);
    }
}

// Create global instance
window.transliterationEngine = new TransliterationEngine();