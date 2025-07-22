// API GHICHU Client Utilities
// Synchronized with api/note.js for consistency

class APIGhichuClient {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl;
        this.currentUUID = null;
        this.autoSaveEnabled = true;
        this.saveTimeout = null;
    }

    // Language configurations matching server-side
    static languageConfigs = {
        javascript: { 
            name: 'JavaScript', 
            icon: '🟨', 
            extensions: ['.js', '.jsx', '.mjs'],
            keywords: ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'class', 'import', 'export']
        },
        typescript: { 
            name: 'TypeScript', 
            icon: '🔷', 
            extensions: ['.ts', '.tsx'],
            keywords: ['interface', 'type', 'enum', 'namespace', 'declare', 'abstract']
        },
        python: { 
            name: 'Python', 
            icon: '🐍', 
            extensions: ['.py', '.pyw'],
            keywords: ['def', 'class', 'import', 'from', 'if', 'elif', 'else', 'for', 'while', 'try', 'except']
        },
        java: { 
            name: 'Java', 
            icon: '☕', 
            extensions: ['.java'],
            keywords: ['public', 'private', 'protected', 'class', 'interface', 'extends', 'implements']
        },
        cpp: { 
            name: 'C++', 
            icon: '⚡', 
            extensions: ['.cpp', '.cc', '.cxx', '.h', '.hpp'],
            keywords: ['#include', 'namespace', 'class', 'struct', 'template', 'typename']
        },
        html: { 
            name: 'HTML', 
            icon: '🌐', 
            extensions: ['.html', '.htm'],
            keywords: ['<!DOCTYPE', '<html>', '<head>', '<body>', '<div>', '<span>']
        },
        css: { 
            name: 'CSS', 
            icon: '🎨', 
            extensions: ['.css', '.scss', '.sass'],
            keywords: ['@import', '@media', 'display:', 'position:', 'color:', 'background:']
        },
        json: { 
            name: 'JSON', 
            icon: '📋', 
            extensions: ['.json'],
            keywords: ['{', '}', '[', ']', '"']
        },
        markdown: { 
            name: 'Markdown', 
            icon: '📝', 
            extensions: ['.md', '.markdown'],
            keywords: ['#', '##', '###', '**', '*', '`', '```']
        },
        sql: { 
            name: 'SQL', 
            icon: '🗄️', 
            extensions: ['.sql'],
            keywords: ['SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER']
        },
        php: { 
            name: 'PHP', 
            icon: '🐘', 
            extensions: ['.php'],
            keywords: ['<?php', 'function', 'class', 'public', 'private', 'protected', '$']
        },
        text: { 
            name: 'Plain Text', 
            icon: '📄', 
            extensions: ['.txt'],
            keywords: []
        }
    };

    // Detect language from content (matching server logic)
    static detectLanguage(content) {
        if (!content || content.trim().length === 0) return 'text';
        
        const lines = content.split('\n').slice(0, 10);
        const text = lines.join(' ').toLowerCase();
        
        if (text.includes('<!doctype') || text.includes('<html>')) return 'html';
        if (text.includes('<?php')) return 'php';
        if (text.includes('def ') && text.includes('import ')) return 'python';
        if (text.includes('function ') && (text.includes('const ') || text.includes('let '))) return 'javascript';
        if (text.includes('interface ') || text.includes('type ')) return 'typescript';
        if (text.includes('public class ') || text.includes('import java.')) return 'java';
        if (text.includes('#include') || text.includes('namespace std')) return 'cpp';
        if (text.includes('select ') && text.includes('from ')) return 'sql';
        if (text.startsWith('{') && text.includes('"')) return 'json';
        if (text.includes('# ') || text.includes('## ')) return 'markdown';
        if (text.includes('display:') || text.includes('@media')) return 'css';
        
        return 'text';
    }

    // Get note content
    async getNote(uuid) {
        try {
            const response = await fetch(`${this.baseUrl}/note/${uuid}?raw=true`, {
                method: 'GET',
                headers: { 'user-agent': 'fetch' }
            });
            
            if (response.ok) {
                const content = await response.text();
                this.currentUUID = uuid;
                return {
                    success: true,
                    content: content,
                    language: APIGhichuClient.detectLanguage(content),
                    uuid: uuid
                };
            } else {
                return {
                    success: false,
                    error: `HTTP ${response.status}`,
                    content: ''
                };
            }
        } catch (error) {
            console.error('Error fetching note:', error);
            return {
                success: false,
                error: error.message,
                content: ''
            };
        }
    }

    // Save note content
    async saveNote(uuid, content) {
        try {
            const response = await fetch(`${this.baseUrl}/note/${uuid}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'text/plain; charset=utf-8' },
                body: content
            });
            
            if (response.ok) {
                const result = await response.json();
                this.currentUUID = uuid;
                return {
                    success: true,
                    message: result.message,
                    uuid: uuid,
                    timestamp: result.timestamp
                };
            } else {
                const error = await response.json();
                return {
                    success: false,
                    error: error.message || `HTTP ${response.status}`
                };
            }
        } catch (error) {
            console.error('Error saving note:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Delete note
    async deleteNote(uuid) {
        try {
            const response = await fetch(`${this.baseUrl}/note/${uuid}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                const result = await response.json();
                if (this.currentUUID === uuid) {
                    this.currentUUID = null;
                }
                return {
                    success: true,
                    message: result.message,
                    uuid: uuid
                };
            } else {
                const error = await response.json();
                return {
                    success: false,
                    error: error.message || `HTTP ${response.status}`
                };
            }
        } catch (error) {
            console.error('Error deleting note:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Setup auto-save for textarea element
    setupAutoSave(textareaElement, uuid, delay = 2000) {
        if (!textareaElement || !uuid) {
            console.error('Invalid textarea element or UUID for auto-save setup');
            return;
        }

        const saveHandler = () => {
            if (!this.autoSaveEnabled) return;
            
            clearTimeout(this.saveTimeout);
            this.saveTimeout = setTimeout(async () => {
                const result = await this.saveNote(uuid, textareaElement.value);
                if (result.success) {
                    console.log('✅ Auto-saved:', uuid);
                } else {
                    console.error('❌ Auto-save failed:', result.error);
                }
            }, delay);
        };

        textareaElement.addEventListener('input', saveHandler);
        
        // Return cleanup function
        return () => {
            textareaElement.removeEventListener('input', saveHandler);
            clearTimeout(this.saveTimeout);
        };
    }

    // Calculate text statistics
    static getTextStats(content) {
        const lines = content.split('\n');
        const words = content.trim() ? content.trim().split(/\s+/).length : 0;
        const chars = content.length;
        const bytes = new Blob([content]).size;
        
        return {
            lines: lines.length,
            words: words,
            characters: chars,
            bytes: bytes,
            size: APIGhichuClient.formatBytes(bytes)
        };
    }

    // Format bytes to human readable
    static formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    // Setup line numbers synchronization
    static setupLineNumbers(textareaElement, lineNumbersElement) {
        if (!textareaElement || !lineNumbersElement) {
            console.error('Invalid elements for line numbers setup');
            return;
        }

        const updateLineNumbers = () => {
            const lines = textareaElement.value.split('\n');
            const lineNumbersHTML = lines.map((_, index) => 
                `<div class="line-number">${index + 1}</div>`
            ).join('');
            
            lineNumbersElement.innerHTML = lineNumbersHTML;
        };

        const syncScroll = () => {
            lineNumbersElement.scrollTop = textareaElement.scrollTop;
        };

        textareaElement.addEventListener('input', updateLineNumbers);
        textareaElement.addEventListener('scroll', syncScroll);
        
        // Initial update
        updateLineNumbers();
        
        // Return cleanup function
        return () => {
            textareaElement.removeEventListener('input', updateLineNumbers);
            textareaElement.removeEventListener('scroll', syncScroll);
        };
    }

    // Setup keyboard shortcuts
    static setupKeyboardShortcuts(textareaElement, callbacks = {}) {
        if (!textareaElement) {
            console.error('Invalid textarea element for keyboard shortcuts setup');
            return;
        }

        const keydownHandler = (e) => {
            // Tab support
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = textareaElement.selectionStart;
                const end = textareaElement.selectionEnd;
                
                if (e.shiftKey) {
                    // Remove indentation
                    const beforeCursor = textareaElement.value.substring(0, start);
                    const lines = beforeCursor.split('\n');
                    const currentLine = lines[lines.length - 1];
                    
                    if (currentLine.startsWith('    ')) {
                        lines[lines.length - 1] = currentLine.substring(4);
                        textareaElement.value = lines.join('\n') + textareaElement.value.substring(end);
                        textareaElement.selectionStart = textareaElement.selectionEnd = start - 4;
                    }
                } else {
                    // Add indentation
                    textareaElement.value = textareaElement.value.substring(0, start) + '    ' + textareaElement.value.substring(end);
                    textareaElement.selectionStart = textareaElement.selectionEnd = start + 4;
                }
                
                if (callbacks.onTabIndent) callbacks.onTabIndent();
            }
            
            // Ctrl+S to save
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                if (callbacks.onSave) callbacks.onSave();
            }
            
            // Ctrl+D to duplicate line
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                const start = textareaElement.selectionStart;
                const beforeCursor = textareaElement.value.substring(0, start);
                const afterCursor = textareaElement.value.substring(start);
                const lines = beforeCursor.split('\n');
                const currentLine = lines[lines.length - 1];
                
                textareaElement.value = beforeCursor + '\n' + currentLine + afterCursor;
                textareaElement.selectionStart = textareaElement.selectionEnd = start + currentLine.length + 1;
                
                if (callbacks.onDuplicateLine) callbacks.onDuplicateLine();
            }
        };

        textareaElement.addEventListener('keydown', keydownHandler);
        
        // Return cleanup function
        return () => {
            textareaElement.removeEventListener('keydown', keydownHandler);
        };
    }

    // Health check
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseUrl}/`, {
                method: 'GET'
            });
            
            return {
                success: response.ok,
                status: response.status,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIGhichuClient;
} else if (typeof window !== 'undefined') {
    window.APIGhichuClient = APIGhichuClient;
}

