// note.js - Client-side utilities for API GHICHU
// This file provides helper functions for interacting with the note API

class APIGhichuClient {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl;
        this.currentNoteId = null;
        this.autoSaveTimeout = null;
        this.autoSaveDelay = 1000; // 1 second
    }

    // Generate a new UUID
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Create a new note
    async createNote(content = '', noteId = null) {
        try {
            const uuid = noteId || this.generateUUID();
            const response = await fetch(`${this.baseUrl}/note/${uuid}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                },
                body: content
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            this.currentNoteId = uuid;
            return { success: true, uuid, ...result };
        } catch (error) {
            console.error('Error creating note:', error);
            return { success: false, error: error.message };
        }
    }

    // Get note content
    async getNote(noteId, raw = false) {
        try {
            const url = raw 
                ? `${this.baseUrl}/note/${noteId}?raw=true`
                : `${this.baseUrl}/note/${noteId}`;
            
            const response = await fetch(url, {
                headers: raw ? { 'user-agent': 'fetch' } : {}
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            if (raw) {
                return await response.text();
            } else {
                return await response.text(); // HTML content
            }
        } catch (error) {
            console.error('Error getting note:', error);
            return null;
        }
    }

    // Update note content
    async updateNote(noteId, content) {
        try {
            const response = await fetch(`${this.baseUrl}/note/${noteId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                },
                body: content
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return { success: true, ...result };
        } catch (error) {
            console.error('Error updating note:', error);
            return { success: false, error: error.message };
        }
    }

    // Delete note
    async deleteNote(noteId) {
        try {
            const response = await fetch(`${this.baseUrl}/note/${noteId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (this.currentNoteId === noteId) {
                this.currentNoteId = null;
            }
            return { success: true, ...result };
        } catch (error) {
            console.error('Error deleting note:', error);
            return { success: false, error: error.message };
        }
    }

    // Auto-save functionality
    setupAutoSave(textarea, noteId) {
        if (!textarea || !noteId) return;

        this.currentNoteId = noteId;

        const autoSave = () => {
            clearTimeout(this.autoSaveTimeout);
            this.autoSaveTimeout = setTimeout(async () => {
                const content = textarea.value;
                const result = await this.updateNote(noteId, content);
                
                if (result.success) {
                    this.showSaveIndicator('💾 Saved');
                } else {
                    this.showSaveIndicator('❌ Save failed', true);
                }
            }, this.autoSaveDelay);
        };

        textarea.addEventListener('input', autoSave);
        
        // Manual save with Ctrl+S
        textarea.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                clearTimeout(this.autoSaveTimeout);
                this.updateNote(noteId, textarea.value).then(result => {
                    if (result.success) {
                        this.showSaveIndicator('💾 Saved manually');
                    } else {
                        this.showSaveIndicator('❌ Save failed', true);
                    }
                });
            }
        });

        return autoSave;
    }

    // Show save indicator
    showSaveIndicator(message, isError = false) {
        const indicator = document.getElementById('save-indicator') || 
                         document.querySelector('.save-indicator');
        
        if (indicator) {
            indicator.textContent = message;
            indicator.style.color = isError ? '#f38ba8' : '#f9e2af';
            indicator.classList.add('saving');
            
            setTimeout(() => {
                indicator.classList.remove('saving');
            }, 2000);
        }
    }

    // Get API info
    async getAPIInfo() {
        try {
            const response = await fetch(`${this.baseUrl}/api`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error getting API info:', error);
            return null;
        }
    }

    // Health check
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error checking health:', error);
            return null;
        }
    }

    // Utility: Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Utility: Count words, lines, characters
    getTextStats(text) {
        const lines = text.split('\n').length;
        const characters = text.length;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const charactersNoSpaces = text.replace(/\s/g, '').length;
        
        return {
            lines,
            characters,
            charactersNoSpaces,
            words,
            size: this.formatFileSize(new Blob([text]).size)
        };
    }

    // Utility: Update stats display
    updateStatsDisplay(text) {
        const stats = this.getTextStats(text);
        
        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        };

        updateElement('line-count', stats.lines);
        updateElement('char-count', stats.characters);
        updateElement('word-count', stats.words);
        updateElement('char-no-spaces-count', stats.charactersNoSpaces);
        updateElement('file-size', stats.size);
    }

    // Enhanced line numbers
    updateLineNumbers(textarea) {
        const lineNumbers = document.getElementById('line-numbers');
        if (!lineNumbers || !textarea) return;

        const lines = textarea.value.split('\n');
        const lineNumbersHTML = lines.map((_, index) => 
            `<div class="line-number">${index + 1}</div>`
        ).join('');
        
        lineNumbers.innerHTML = lineNumbersHTML;
        
        // Sync scroll
        lineNumbers.scrollTop = textarea.scrollTop;
    }

    // Setup enhanced editor
    setupEnhancedEditor(textarea, noteId) {
        if (!textarea) return;

        // Setup auto-save
        this.setupAutoSave(textarea, noteId);

        // Setup line numbers
        textarea.addEventListener('input', () => {
            this.updateLineNumbers(textarea);
            this.updateStatsDisplay(textarea.value);
        });

        textarea.addEventListener('scroll', () => {
            this.updateLineNumbers(textarea);
        });

        // Tab key support
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                
                if (e.shiftKey) {
                    // Shift+Tab: Remove indentation
                    const lines = textarea.value.split('\n');
                    const startLine = textarea.value.substring(0, start).split('\n').length - 1;
                    const endLine = textarea.value.substring(0, end).split('\n').length - 1;
                    
                    for (let i = startLine; i <= endLine; i++) {
                        if (lines[i].startsWith('    ')) {
                            lines[i] = lines[i].substring(4);
                        } else if (lines[i].startsWith('\t')) {
                            lines[i] = lines[i].substring(1);
                        }
                    }
                    
                    textarea.value = lines.join('\n');
                } else {
                    // Tab: Add indentation
                    textarea.value = textarea.value.substring(0, start) + 
                                   '    ' + 
                                   textarea.value.substring(end);
                    textarea.selectionStart = textarea.selectionEnd = start + 4;
                }
                
                this.updateLineNumbers(textarea);
                this.updateStatsDisplay(textarea.value);
            }
        });

        // Initial setup
        this.updateLineNumbers(textarea);
        this.updateStatsDisplay(textarea.value);
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.APIGhichuClient = APIGhichuClient;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIGhichuClient;
}

