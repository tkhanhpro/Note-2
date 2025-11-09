/**
 * API GHICHU Client Utilities - Optimized Version
 * Ultra-fast client-side utilities for API GHICHU service
 */

class APIGhichuClient {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.cache = new Map();
    }

    /**
     * Fast UUID v4 generator
     */
    generateUUID() {
        const crypto = window.crypto || window.msCrypto;
        if (crypto && crypto.getRandomValues) {
            const buffer = new Uint8Array(16);
            crypto.getRandomValues(buffer);
            buffer[6] = (buffer[6] & 0x0f) | 0x40;
            buffer[8] = (buffer[8] & 0x3f) | 0x80;
            
            const hex = Array.from(buffer, byte => 
                byte.toString(16).padStart(2, '0')
            ).join('');
            
            return `${hex.substr(0,8)}-${hex.substr(8,4)}-${hex.substr(12,4)}-${hex.substr(16,4)}-${hex.substr(20,12)}`;
        }
        
        // Fallback
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    /**
     * Fast UUID validation
     */
    isValidUUID(uuid) {
        return typeof uuid === 'string' && 
               uuid.length === 36 && 
               uuid.split('-').length === 5;
    }

    /**
     * Create note with cache
     */
    async createNote(content = '', ttl = 86400000) {
        const uuid = this.generateUUID();
        const cacheKey = `note-${uuid}`;
        
        if (content) {
            await this.saveNote(uuid, content, ttl);
        }
        
        const result = {
            uuid: uuid,
            editUrl: `${this.baseUrl}/edit/${uuid}`,
            rawUrl: `${this.baseUrl}/raw/${uuid}`
        };
        
        this.cache.set(cacheKey, result);
        return result;
    }

    /**
     * Get note with cache support
     */
    async getNote(uuid) {
        if (!this.isValidUUID(uuid)) {
            throw new Error('Invalid UUID format');
        }

        const cacheKey = `content-${uuid}`;
        const cached = this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(`${this.baseUrl}/raw/${uuid}`, {
                method: 'GET',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const content = await response.text();
                this.cache.set(cacheKey, content);
                return content;
            } else if (response.status === 404) {
                return '';
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }

    /**
     * Optimized save with retry
     */
    async saveNote(uuid, content, ttl = 86400000) {
        if (!this.isValidUUID(uuid)) {
            throw new Error('Invalid UUID format');
        }

        try {
            const response = await fetch(`${this.baseUrl}/edit/${uuid}?ttl=${ttl}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'text/plain; charset=utf-8' },
                body: content
            });

            if (response.ok) {
                const result = await response.json();
                // Update cache
                this.cache.set(`content-${uuid}`, content);
                this.cache.set(`note-${uuid}`, result);
                return result;
            } else {
                throw new Error(`Save failed: ${response.status}`);
            }
        } catch (error) {
            throw error;
        }
    }

    /**
     * Fast delete operation
     */
    async deleteNote(uuid) {
        if (!this.isValidUUID(uuid)) {
            throw new Error('Invalid UUID format');
        }

        try {
            const response = await fetch(`${this.baseUrl}/edit/${uuid}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // Clear cache
                this.cache.delete(`content-${uuid}`);
                this.cache.delete(`note-${uuid}`);
                return { success: true };
            } else {
                throw new Error(`Delete failed: ${response.status}`);
            }
        } catch (error) {
            throw error;
        }
    }

    /**
     * Optimized content stats
     */
    getContentStats(content) {
        const lines = content.split('\n').length;
        const words = content.trim() ? content.trim().split(/\s+/).length : 0;
        const chars = content.length;
        const bytes = new TextEncoder().encode(content).length;

        return {
            lines: lines,
            words: words,
            characters: chars,
            bytes: bytes,
            size: this.formatBytes(bytes)
        };
    }

    /**
     * Fast byte formatter
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 10) / 10 + ' ' + sizes[i];
    }

    /**
     * Setup auto-save with performance optimizations
     */
    setupAutoSave(textarea, uuid, options = {}) {
        const {
            delay = 1000,
            ttl = 86400000,
            onSaving = () => {},
            onSaved = () => {},
            onError = () => {},
            onStatsUpdate = () => {}
        } = options;

        let saveTimeout;
        let lastSavedContent = textarea.value;
        let isSaving = false;

        const saveContent = async () => {
            if (isSaving || textarea.value === lastSavedContent) return;

            isSaving = true;
            onSaving();

            try {
                await this.saveNote(uuid, textarea.value, ttl);
                lastSavedContent = textarea.value;
                onSaved();
            } catch (error) {
                onError(error);
            } finally {
                isSaving = false;
            }
        };

        const handleInput = () => {
            const stats = this.getContentStats(textarea.value);
            onStatsUpdate(stats);

            if (textarea.value !== lastSavedContent) {
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(saveContent, delay);
            }
        };

        // Event listeners
        textarea.addEventListener('input', handleInput);
        
        // Ctrl+S save
        textarea.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                clearTimeout(saveTimeout);
                saveContent();
            }
        });

        // Initial stats
        onStatsUpdate(this.getContentStats(textarea.value));

        return {
            save: saveContent,
            destroy: () => {
                clearTimeout(saveTimeout);
                textarea.removeEventListener('input', handleInput);
            }
        };
    }

    /**
     * Optimized line numbers
     */
    setupLineNumbers(textarea, lineNumbersContainer) {
        const update = () => {
            const lines = textarea.value.split('\n').length;
            let html = '';
            
            for (let i = 1; i <= lines; i++) {
                html += `<div class="line-number">${i}</div>`;
            }
            
            lineNumbersContainer.innerHTML = html;
        };

        const syncScroll = () => {
            lineNumbersContainer.scrollTop = textarea.scrollTop;
        };

        textarea.addEventListener('input', update);
        textarea.addEventListener('scroll', syncScroll);

        update();

        return {
            update: update,
            destroy: () => {
                textarea.removeEventListener('input', update);
                textarea.removeEventListener('scroll', syncScroll);
            }
        };
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            const start = performance.now();
            const response = await fetch(`${this.baseUrl}/health`);
            const end = performance.now();

            return {
                status: response.ok ? 'healthy' : 'unhealthy',
                responseTime: Math.round(end - start),
                timestamp: Date.now()
            };
        } catch (error) {
            return {
                status: 'error',
                error: error.message,
                timestamp: Date.now()
            };
        }
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Preload note
     */
    preloadNote(uuid) {
        return this.getNote(uuid).catch(() => null);
    }
}

// Browser and Node.js support
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIGhichuClient;
} 
if (typeof window !== 'undefined') {
    window.APIGhichuClient = APIGhichuClient;
    // Auto-initialize
    window.apiGhichu = new APIGhichuClient();
}
