/**
 * API GHICHU Client Utilities v2.0
 * Enhanced client-side utilities for the modern note service
 */

class APIGhichuClient {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.defaultHeaders = {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache'
        };
    }

    /**
     * Generate a new UUID v4
     * @returns {string} UUID v4 string
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Create a new note with optional content
     * @param {string} content - Initial content for the note
     * @returns {Promise<{uuid: string, url: string}>} Note creation result
     */
    async createNote(content = '') {
        const uuid = this.generateUUID();
        const url = `${this.baseUrl}/${uuid}`;
        
        if (content) {
            await this.saveNote(uuid, content);
        }
        
        return {
            uuid: uuid,
            url: url,
            rawUrl: `${url}?raw=true`,
            editUrl: url
        };
    }

    /**
     * Get note content by UUID
     * @param {string} uuid - Note UUID
     * @returns {Promise<string>} Note content
     */
    async getNote(uuid) {
        try {
            const response = await fetch(`${this.baseUrl}/${uuid}?raw=true`, {
                method: 'GET',
                headers: this.defaultHeaders
            });

            if (response.ok) {
                return await response.text();
            } else if (response.status === 404) {
                return ''; // New note
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error getting note:', error);
            throw error;
        }
    }

    /**
     * Save note content
     * @param {string} uuid - Note UUID
     * @param {string} content - Note content to save
     * @returns {Promise<boolean>} Save success
     */
    async saveNote(uuid, content) {
        try {
            const response = await fetch(`${this.baseUrl}/${uuid}`, {
                method: 'PUT',
                headers: this.defaultHeaders,
                body: content
            });

            if (response.ok) {
                console.log('✅ Note saved successfully');
                return true;
            } else {
                throw new Error(`Save failed: ${response.statusText}`);
            }
        } catch (error) {
            console.error('❌ Error saving note:', error);
            throw error;
        }
    }

    /**
     * Get note metadata and statistics
     * @param {string} content - Note content
     * @returns {Object} Note statistics
     */
    getContentStats(content) {
        const lines = content.split('\n');
        const words = content.trim() ? content.trim().split(/\s+/).length : 0;
        const chars = content.length;
        const charsNoSpaces = content.replace(/\s/g, '').length;
        const bytes = new Blob([content]).size;

        return {
            lines: lines.length,
            words: words,
            characters: chars,
            charactersNoSpaces: charsNoSpaces,
            bytes: bytes,
            size: this.formatBytes(bytes)
        };
    }

    /**
     * Format bytes to human readable format
     * @param {number} bytes - Number of bytes
     * @returns {string} Formatted size string
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    /**
     * Detect programming language from content
     * @param {string} content - Code content
     * @returns {string} Detected language
     */
    detectLanguage(content) {
        if (!content || content.trim().length === 0) return 'text';
        
        const text = content.toLowerCase();
        const lines = content.split('\n').slice(0, 10);
        const firstLines = lines.join(' ').toLowerCase();
        
        // Enhanced language detection patterns
        const patterns = {
            'html': [/<!doctype/i, /<html/i, /<head/i, /<body/i, /<div/i, /<span/i],
            'php': [/<?php/i, /\\$\\w+/, /echo\\s+/i, /function\\s+\\w+\\s*\\(/i],
            'python': [/^def\\s+\\w+\\s*\\(/m, /^import\\s+\\w+/m, /^from\\s+\\w+\\s+import/m, /^class\\s+\\w+/m],
            'javascript': [/function\\s+\\w+\\s*\\(/i, /const\\s+\\w+/i, /let\\s+\\w+/i, /var\\s+\\w+/i, /=>/],
            'typescript': [/interface\\s+\\w+/i, /type\\s+\\w+/i, /enum\\s+\\w+/i, /:\\s*[^{]/],
            'java': [/public\\s+class\\s+\\w+/i, /import\\s+java\\./i, /private\\s+\\w+\\s+\\w+/i],
            'cpp': [/#include\\s*</i, /namespace\\s+std/i, /using\\s+namespace/i, /std::/],
            'sql': [/select\\s+.*\\s+from/i, /insert\\s+into/i, /update\\s+.*\\s+set/i, /create\\s+table/i],
            'json': [/^\\s*\\{/, /^\\s*\\[/, /"\\w+"\\s*:/],
            'markdown': [/^#+\\s/m, /\\*\\*.*\\*\\*/m, /```/m, /^>-\\s/m],
            'css': [/\\w+\\s*\\{[^}]*\\}/m, /@media/i, /@import/i, /:\\s*[^;]*;/],
            'yaml': [/^\\s*\\w+:/m, /^-\\s/m, /^\\s*#/m]
        };

        for (const [lang, langPatterns] of Object.entries(patterns)) {
            if (langPatterns.some(pattern => pattern.test(firstLines))) {
                return lang.toUpperCase();
            }
        }

        return 'TEXT';
    }

    /**
     * Setup auto-save functionality for a textarea
     * @param {HTMLTextAreaElement} textarea - Textarea element
     * @param {string} uuid - Note UUID
     * @param {Object} options - Auto-save options
     */
    setupAutoSave(textarea, uuid, options = {}) {
        const {
            delay = 1000,
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
            
            try {
                onSaving();
                await this.saveNote(uuid, textarea.value);
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
            const language = this.detectLanguage(textarea.value);
            onStatsUpdate({ ...stats, language });

            if (textarea.value !== lastSavedContent && !isSaving) {
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(saveContent, delay);
            }
        };

        textarea.addEventListener('input', handleInput);
        textarea.addEventListener('paste', handleInput);

        // Manual save with Ctrl+S
        textarea.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                clearTimeout(saveTimeout);
                saveContent();
            }
        });

        // Initial stats
        const initialStats = this.getContentStats(textarea.value);
        const initialLanguage = this.detectLanguage(textarea.value);
        onStatsUpdate({ ...initialStats, language: initialLanguage });

        return {
            save: saveContent,
            destroy: () => {
                clearTimeout(saveTimeout);
                textarea.removeEventListener('input', handleInput);
                textarea.removeEventListener('paste', handleInput);
            }
        };
    }

    /**
     * Setup enhanced editor with line numbers, syntax detection, etc.
     * @param {HTMLTextAreaElement} textarea - Textarea element
     * @param {HTMLElement} lineNumbersContainer - Line numbers container
     * @param {Object} callbacks - Editor callbacks
     */
    setupEnhancedEditor(textarea, lineNumbersContainer, callbacks = {}) {
        const {
            onCursorUpdate = () => {},
            onLanguageChange = () => {},
            onContentChange = () => {}
        } = callbacks;

        // Line numbers
        const updateLineNumbers = () => {
            const lines = textarea.value.split('\n');
            const lineNumbersHTML = lines.map((_, index) => 
                `<div class="line-number">${index + 1}</div>`
            ).join('');
            
            lineNumbersContainer.innerHTML = lineNumbersHTML;
        };

        const syncScroll = () => {
            lineNumbersContainer.scrollTop = textarea.scrollTop;
        };

        // Cursor position
        const updateCursorPosition = () => {
            const text = textarea.value;
            const position = textarea.selectionStart;
            
            const lines = text.substr(0, position).split('\n');
            const lineNumber = lines.length;
            const columnNumber = lines[lines.length - 1].length + 1;
            
            onCursorUpdate({ line: lineNumber, column: columnNumber });
        };

        // Language detection
        const updateLanguage = () => {
            const language = this.detectLanguage(textarea.value);
            onLanguageChange(language);
        };

        // Content change handler
        const handleContentChange = () => {
            updateLineNumbers();
            updateCursorPosition();
            updateLanguage();
            onContentChange(textarea.value);
        };

        // Event listeners
        textarea.addEventListener('input', handleContentChange);
        textarea.addEventListener('scroll', syncScroll);
        textarea.addEventListener('click', updateCursorPosition);
        textarea.addEventListener('keyup', updateCursorPosition);

        // Tab support
        this.setupTabSupport(textarea);

        // Initial setup
        handleContentChange();

        return {
            update: handleContentChange,
            destroy: () => {
                textarea.removeEventListener('input', handleContentChange);
                textarea.removeEventListener('scroll', syncScroll);
                textarea.removeEventListener('click', updateCursorPosition);
                textarea.removeEventListener('keyup', updateCursorPosition);
            }
        };
    }

    /**
     * Add tab support to textarea
     * @param {HTMLTextAreaElement} textarea - Textarea element
     */
    setupTabSupport(textarea) {
        const handleKeyDown = (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                
                if (e.shiftKey) {
                    // Remove indentation (Shift+Tab)
                    const beforeCursor = textarea.value.substring(0, start);
                    const lines = beforeCursor.split('\n');
                    const currentLine = lines[lines.length - 1];
                    
                    if (currentLine.startsWith('    ')) {
                        lines[lines.length - 1] = currentLine.substring(4);
                        const newValue = lines.join('\n') + textarea.value.substring(end);
                        textarea.value = newValue;
                        textarea.selectionStart = textarea.selectionEnd = start - 4;
                        textarea.dispatchEvent(new Event('input'));
                    }
                } else {
                    // Add indentation (Tab)
                    const newValue = textarea.value.substring(0, start) + '    ' + textarea.value.substring(end);
                    textarea.value = newValue;
                    textarea.selectionStart = textarea.selectionEnd = start + 4;
                    textarea.dispatchEvent(new Event('input'));
                }
            }
        };

        textarea.addEventListener('keydown', handleKeyDown);

        return {
            destroy: () => {
                textarea.removeEventListener('keydown', handleKeyDown);
            }
        };
    }

    /**
     * Health check for the API service
     * @returns {Promise<Object>} Service health status
     */
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                headers: { 'Cache-Control': 'no-cache' }
            });

            if (response.ok) {
                const data = await response.json();
                return {
                    status: 'healthy',
                    ...data
                };
            } else {
                return {
                    status: 'unhealthy',
                    statusCode: response.status,
                    timestamp: new Date().toISOString()
                };
            }
        } catch (error) {
            return {
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Get API information and statistics
     * @returns {Promise<Object>} API information
     */
    async getAPIInfo() {
        try {
            const response = await fetch(`${this.baseUrl}/api`, {
                method: 'GET',
                headers: { 'Cache-Control': 'no-cache' }
            });

            if (response.ok) {
                return await response.json();
            } else {
                throw new Error(`API info request failed: ${response.status}`);
            }
        } catch (error) {
            console.error('Error getting API info:', error);
            throw error;
        }
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIGhichuClient;
} else if (typeof window !== 'undefined') {
    window.APIGhichuClient = APIGhichuClient;
}

// Auto-initialize for browser
if (typeof window !== 'undefined') {
    window.apiGhichu = new APIGhichuClient(window.location.origin);
    console.log('🚀 API GHICHU Client v2.0 initialized');
}
