// Progressive Image Loading Manager for Jetson Nano Optimization
class ImageManager {
    constructor() {
        this.cache = new Map();
        this.loadingQueue = new Set();
        this.preloadQueue = new Set();
        this.webpSupported = null;
        this.initialized = false;
        
        this.init();
    }

    async init() {
        // Check WebP support
        this.webpSupported = await this.checkWebPSupport();
        
        // Setup intersection observer for lazy loading
        this.setupIntersectionObserver();
        
        this.initialized = true;
        console.log(`Image Manager initialized. WebP supported: ${this.webpSupported}`);
    }

    // Check if browser supports WebP
    checkWebPSupport() {
        return new Promise((resolve) => {
            const webp = new Image();
            webp.onload = webp.onerror = () => {
                resolve(webp.height === 2);
            };
            webp.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
        });
    }

    // Setup intersection observer for viewport-based loading
    setupIntersectionObserver() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        this.loadImage(img);
                        this.observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px' // Start loading 50px before entering viewport
            });
        }
    }

    // Get optimized image path based on size and format support
    getImagePath(cardName, size = 'thumbnail') {
        const sanitizedName = this.sanitizeFilename(cardName);
        const extension = this.webpSupported ? 'webp' : 'png';
        
        const sizeMap = {
            micro: '16x16',
            thumbnail: '64x64', 
            preview: '128x180',
            full: '200x280'
        };
        
        const dimensions = sizeMap[size] || sizeMap.thumbnail;
        return `/assets/images/cards/${sanitizedName}_${dimensions}.${extension}`;
    }

    // Generate Base64 micro image for immediate display
    generateMicroImage(cardName, emoji = '📦') {
        // Create a tiny 16x16 canvas with the emoji
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        
        // Simple gradient background
        const gradient = ctx.createLinearGradient(0, 0, 16, 16);
        gradient.addColorStop(0, '#f0f0f0');
        gradient.addColorStop(1, '#e0e0e0');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 16, 16);
        
        // Add emoji (if font supports it)
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#666';
        ctx.fillText(emoji, 8, 12);
        
        return canvas.toDataURL('image/png');
    }

    // Sanitize card name for filename
    sanitizeFilename(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
    }

    // Enhanced card placeholder with better emoji mapping
    getCardPlaceholder(card) {
        const emojiMap = {
            // Buildings & Landmarks
            'eiffelturm': '🗼',
            'burj_khalifa': '🏗️', 
            'empire_state_building': '🏢',
            'freiheitsstatue': '🗽',
            'kolosseum': '🏛️',
            'taj_mahal': '🕌',
            'schiefer_turm_von_pisa': '🗼',
            'golden_gate_bridge': '🌉',
            'sydney_opera_house': '🏛️',
            'big_ben': '🏰',
            
            // Animals
            'giraffe': '🦒',
            'mammutbaum': '🌲',
            'schwarzer_panther': '🐆',
            'sibirischer_tiger': '🐅',
            'blauwal': '🐋',
            'afrikanischer_elefant': '🐘',
            'anaconda': '🐍',
            'weißer_hai': '🦈',
            'krokodil': '🐊',
            'königspinguin': '🐧',
            
            // Vehicles & Objects
            'stadtbus': '🚌',
            'boeing_747': '✈️',
            'fußballfeld': '⚽',
            'tennisplatz': '🎾',
            'schwimmbecken': '🏊',
            'fußballtor': '⚽',
            
            // Default categories
            'building': '🏢',
            'animal': '🐾',
            'vehicle': '🚗',
            'nature': '🌲',
            'sports': '⚽'
        };
        
        const key = this.sanitizeFilename(card.name);
        return emojiMap[key] || emojiMap[card.category] || '📦';
    }

    // Create optimized card element with progressive loading
    createCardImage(card, size = 'thumbnail', lazy = true) {
        const container = document.createElement('div');
        container.className = `card-image-container ${size}`;
        
        // Immediate emoji placeholder
        const placeholder = document.createElement('div');
        placeholder.className = 'card-placeholder immediate';
        placeholder.textContent = this.getCardPlaceholder(card);
        container.appendChild(placeholder);
        
        // Micro image (Base64 - loads very fast)
        if (size !== 'micro') {
            const microImg = document.createElement('img');
            microImg.className = 'card-micro hidden';
            microImg.src = this.generateMicroImage(card.name, this.getCardPlaceholder(card));
            microImg.onload = () => {
                microImg.classList.remove('hidden');
                placeholder.classList.add('faded');
            };
            container.appendChild(microImg);
        }
        
        // Main image with lazy loading
        const mainImg = document.createElement('img');
        mainImg.className = `card-image ${size} hidden`;
        mainImg.alt = card.name;
        mainImg.setAttribute('data-card-name', card.name);
        mainImg.setAttribute('data-size', size);
        
        if (lazy && this.observer) {
            // Use intersection observer for lazy loading
            this.observer.observe(mainImg);
        } else {
            // Load immediately
            this.loadImage(mainImg);
        }
        
        container.appendChild(mainImg);
        return container;
    }

    // Load image with fallback support
    async loadImage(imgElement) {
        const cardName = imgElement.getAttribute('data-card-name');
        const size = imgElement.getAttribute('data-size') || 'thumbnail';
        
        if (this.loadingQueue.has(imgElement)) {
            return; // Already loading
        }
        
        this.loadingQueue.add(imgElement);
        
        try {
            const imagePath = this.getImagePath(cardName, size);
            
            // Check cache first
            if (this.cache.has(imagePath)) {
                this.applyImageToElement(imgElement, this.cache.get(imagePath));
                return;
            }
            
            // Load image
            const imageUrl = await this.fetchImage(imagePath);
            this.cache.set(imagePath, imageUrl);
            this.applyImageToElement(imgElement, imageUrl);
            
        } catch (error) {
            console.warn(`Failed to load image for ${cardName}:`, error);
            // Keep emoji placeholder
        } finally {
            this.loadingQueue.delete(imgElement);
        }
    }

    // Fetch image with fallback
    fetchImage(imagePath) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                resolve(imagePath);
            };
            
            img.onerror = () => {
                // Try PNG fallback if WebP failed
                if (imagePath.includes('.webp')) {
                    const fallbackPath = imagePath.replace('.webp', '.png');
                    const fallbackImg = new Image();
                    
                    fallbackImg.onload = () => resolve(fallbackPath);
                    fallbackImg.onerror = () => reject(new Error('Both WebP and PNG failed'));
                    fallbackImg.src = fallbackPath;
                } else {
                    reject(new Error('Image load failed'));
                }
            };
            
            img.src = imagePath;
        });
    }

    // Apply loaded image to element with smooth transition
    applyImageToElement(imgElement, imageUrl) {
        imgElement.src = imageUrl;
        imgElement.onload = () => {
            imgElement.classList.remove('hidden');
            
            // Hide micro image and placeholder
            const container = imgElement.parentNode;
            const microImg = container.querySelector('.card-micro');
            const placeholder = container.querySelector('.card-placeholder');
            
            if (microImg) microImg.classList.add('faded');
            if (placeholder) placeholder.classList.add('faded');
        };
    }

    // Preload images for better UX
    preloadImages(cards, size = 'thumbnail') {
        if (!this.initialized) {
            setTimeout(() => this.preloadImages(cards, size), 100);
            return;
        }
        
        cards.forEach(card => {
            const imagePath = this.getImagePath(card.name, size);
            
            if (!this.cache.has(imagePath) && !this.preloadQueue.has(imagePath)) {
                this.preloadQueue.add(imagePath);
                
                // Load with low priority
                setTimeout(() => {
                    this.fetchImage(imagePath)
                        .then(url => {
                            this.cache.set(imagePath, url);
                            this.preloadQueue.delete(imagePath);
                        })
                        .catch(() => {
                            this.preloadQueue.delete(imagePath);
                        });
                }, Math.random() * 1000); // Stagger loads
            }
        });
    }

    // Get cache statistics
    getCacheStats() {
        return {
            cached: this.cache.size,
            loading: this.loadingQueue.size,
            preloading: this.preloadQueue.size,
            webpSupported: this.webpSupported
        };
    }

    // Clear cache (useful for memory management)
    clearCache() {
        this.cache.clear();
        console.log('Image cache cleared');
    }
}

// CSS for progressive loading effects
const progressiveImageCSS = `
<style>
.card-image-container {
    position: relative;
    display: inline-block;
    overflow: hidden;
    border-radius: 8px;
}

.card-image-container.thumbnail {
    width: 64px;
    height: 64px;
}

.card-image-container.preview {
    width: 128px;
    height: 180px;
}

.card-image-container.full {
    width: 200px;
    height: 280px;
}

.card-placeholder {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2em;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    transition: opacity 0.3s ease;
    z-index: 1;
}

.card-micro {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity 0.3s ease;
    z-index: 2;
}

.card-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity 0.5s ease;
    z-index: 3;
}

.hidden {
    opacity: 0;
}

.faded {
    opacity: 0.3;
}

.card-image-container:hover .card-image {
    transform: scale(1.05);
    transition: transform 0.3s ease, opacity 0.5s ease;
}
</style>
`;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageManager;
} else {
    window.ImageManager = ImageManager;
}

// Inject CSS if in browser
if (typeof document !== 'undefined') {
    document.head.insertAdjacentHTML('beforeend', progressiveImageCSS);
}
