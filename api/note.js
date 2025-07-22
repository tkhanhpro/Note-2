const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const notesDir = path.join(__dirname, '../note');

// Ensure notes directory exists
if (!fs.existsSync(notesDir)) {
    fs.mkdirSync(notesDir, { recursive: true });
}

// Language configurations for syntax highlighting and detection
const languageConfigs = {
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

// Detect language from content
function detectLanguage(content) {
    if (!content || content.trim().length === 0) return 'text';
    
    const lines = content.split('\n').slice(0, 10); // Check first 10 lines
    const text = lines.join(' ').toLowerCase();
    
    // Check for specific patterns
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

// Compact and clean HTML template
const getCompactEditorHTML = (uuid, content = '') => {
    const detectedLang = detectLanguage(content);
    const langConfig = languageConfigs[detectedLang] || languageConfigs.text;
    
    return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Editor - ${uuid}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --bg: #fafafa;
            --surface: #ffffff;
            --border: #e5e7eb;
            --text: #1f2937;
            --text-muted: #6b7280;
            --accent: #3b82f6;
            --accent-light: #dbeafe;
            --success: #10b981;
            --warning: #f59e0b;
            --error: #ef4444;
        }

        body {
            font-family: 'Inter', sans-serif;
            background: var(--bg);
            color: var(--text);
            height: 100vh;
            overflow: hidden;
        }

        .container {
            height: 100vh;
            display: flex;
            flex-direction: column;
        }

        /* Compact Header */
        .header {
            background: var(--surface);
            border-bottom: 1px solid var(--border);
            padding: 6px 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-shrink: 0;
            min-height: 40px;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 4px;
            font-weight: 600;
            color: var(--accent);
            font-size: 14px;
        }

        .note-id {
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            color: var(--text-muted);
            background: var(--accent-light);
            padding: 2px 4px;
            border-radius: 3px;
            max-width: 120px;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .header-center {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 11px;
        }

        .stat-compact {
            display: flex;
            align-items: center;
            gap: 3px;
            color: var(--text-muted);
        }

        .stat-value {
            color: var(--accent);
            font-weight: 500;
            font-family: 'JetBrains Mono', monospace;
        }

        .header-right {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .language-selector {
            display: flex;
            align-items: center;
            gap: 3px;
            padding: 3px 6px;
            background: var(--accent-light);
            border: 1px solid var(--border);
            border-radius: 4px;
            font-size: 11px;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
        }

        .language-selector:hover {
            background: var(--accent);
            color: white;
        }

        .status {
            display: flex;
            align-items: center;
            gap: 3px;
            font-size: 10px;
            color: var(--text-muted);
            padding: 2px 6px;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 4px;
        }

        .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--success);
            transition: all 0.3s ease;
        }

        .status.unsaved .status-dot {
            background: var(--warning);
            animation: pulse 2s infinite;
        }

        .status.saving .status-dot {
            background: var(--accent);
            animation: spin 1s linear infinite;
        }

        .status.saved .status-dot {
            background: var(--success);
        }

        /* Main Editor Area */
        .editor-area {
            flex: 1;
            display: flex;
            min-height: 0;
        }

        .line-numbers {
            background: var(--surface);
            border-right: 1px solid var(--border);
            padding: 12px 6px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 13px;
            line-height: 1.5;
            color: var(--text-muted);
            text-align: right;
            user-select: none;
            min-width: 45px;
            overflow-y: auto;
            white-space: pre;
        }

        .line-number {
            display: block;
            height: 19.5px;
            line-height: 19.5px;
            padding-right: 6px;
            cursor: pointer;
            transition: color 0.2s ease;
        }

        .line-number:hover {
            color: var(--accent);
        }

        .editor {
            flex: 1;
            background: var(--surface);
            border: none;
            padding: 12px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 13px;
            line-height: 1.5;
            color: var(--text);
            resize: none;
            outline: none;
            overflow: auto;
            tab-size: 4;
        }

        .editor::placeholder {
            color: var(--text-muted);
            font-style: italic;
        }

        /* Language Dropdown */
        .language-dropdown {
            position: absolute;
            top: 100%;
            right: 0;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            min-width: 140px;
            max-height: 180px;
            overflow-y: auto;
            display: none;
        }

        .language-option {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 10px;
            font-size: 11px;
            cursor: pointer;
            transition: background 0.2s ease;
        }

        .language-option:hover {
            background: var(--accent-light);
        }

        .language-option.active {
            background: var(--accent);
            color: white;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
            .header {
                padding: 4px 8px;
                flex-wrap: wrap;
                gap: 6px;
                min-height: 35px;
            }

            .header-center {
                order: 3;
                width: 100%;
                justify-content: center;
                gap: 8px;
                margin-top: 2px;
            }

            .note-id {
                max-width: 80px;
                font-size: 9px;
            }

            .line-numbers {
                min-width: 35px;
                padding: 8px 4px;
                font-size: 12px;
            }

            .editor {
                padding: 8px;
                font-size: 12px;
            }

            .logo {
                font-size: 12px;
            }
        }

        /* Scrollbar */
        ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }

        ::-webkit-scrollbar-track {
            background: var(--bg);
        }

        ::-webkit-scrollbar-thumb {
            background: var(--border);
            border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: var(--text-muted);
        }

        /* Selection */
        ::selection {
            background: var(--accent-light);
        }

        /* Animations */
        .language-dropdown {
            animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-4px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(0.9); }
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-left">
                <div class="logo">
                    <span>💻</span>
                    <span>Code Editor</span>
                </div>
                <div class="note-id" title="${uuid}">${uuid}</div>
            </div>
            
            <div class="header-center">
                <div class="stat-compact">
                    <span>Lines:</span>
                    <span class="stat-value" id="line-count">1</span>
                </div>
                <div class="stat-compact">
                    <span>Chars:</span>
                    <span class="stat-value" id="char-count">0</span>
                </div>
                <div class="stat-compact">
                    <span>Size:</span>
                    <span class="stat-value" id="file-size">0 B</span>
                </div>
            </div>
            
            <div class="header-right">
                <div class="language-selector" id="language-selector">
                    <span id="language-icon">${langConfig.icon}</span>
                    <span id="language-name">${langConfig.name}</span>
                    <span style="font-size: 8px;">▼</span>
                    <div class="language-dropdown" id="language-dropdown">
                        ${Object.entries(languageConfigs).map(([key, config]) => 
                            `<div class="language-option ${key === detectedLang ? 'active' : ''}" data-lang="${key}">
                                <span>${config.icon}</span>
                                <span>${config.name}</span>
                            </div>`
                        ).join('')}
                    </div>
                </div>
                <div class="status saved" id="status">
                    <div class="status-dot"></div>
                    <span id="status-text">Ready</span>
                </div>
            </div>
        </div>

        <div class="editor-area">
            <div class="line-numbers" id="line-numbers">
                <div class="line-number">1</div>
            </div>
            <textarea 
                class="editor" 
                id="editor" 
                placeholder="// Start coding here...
// This editor supports multiple programming languages
// Language detection is automatic based on your code

console.log('Welcome to Code Editor!');"
                spellcheck="false"
            ></textarea>
        </div>
    </div>

    <script>
        const editor = document.getElementById('editor');
        const lineNumbers = document.getElementById('line-numbers');
        const languageSelector = document.getElementById('language-selector');
        const languageDropdown = document.getElementById('language-dropdown');
        const languageIcon = document.getElementById('language-icon');
        const languageName = document.getElementById('language-name');
        const lineCount = document.getElementById('line-count');
        const charCount = document.getElementById('char-count');
        const fileSize = document.getElementById('file-size');
        const status = document.getElementById('status');
        const statusText = document.getElementById('status-text');

        let currentLanguage = '${detectedLang}';
        let saveTimeout;
        let lastSavedContent = '';
        let isContentChanged = false;

        const languageConfigs = ${JSON.stringify(languageConfigs)};

        // Update status
        function updateStatus(newStatus) {
            status.className = 'status ' + newStatus;
            switch(newStatus) {
                case 'unsaved':
                    statusText.textContent = 'Unsaved';
                    break;
                case 'saving':
                    statusText.textContent = 'Saving...';
                    break;
                case 'saved':
                    statusText.textContent = 'Saved';
                    lastSavedContent = editor.value;
                    isContentChanged = false;
                    break;
            }
        }

        // Update line numbers and stats
        function updateStats() {
            const lines = editor.value.split('\\n');
            const lineNumbersHTML = lines.map((_, index) => 
                '<div class="line-number">' + (index + 1) + '</div>'
            ).join('');
            
            lineNumbers.innerHTML = lineNumbersHTML;
            
            // Update stats
            lineCount.textContent = lines.length;
            charCount.textContent = editor.value.length;
            
            // Update file size
            const bytes = new Blob([editor.value]).size;
            fileSize.textContent = formatBytes(bytes);
            
            // Check if content changed
            if (editor.value !== lastSavedContent) {
                if (!isContentChanged) {
                    isContentChanged = true;
                    updateStatus('unsaved');
                }
            }
        }

        // Format bytes
        function formatBytes(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
        }

        // Detect language from content
        function detectLanguage(content) {
            if (!content || content.trim().length === 0) return 'text';
            
            const text = content.toLowerCase();
            
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

        // Update language display
        function updateLanguage(lang) {
            currentLanguage = lang;
            const config = languageConfigs[lang];
            languageIcon.textContent = config.icon;
            languageName.textContent = config.name;
            
            // Update active option
            document.querySelectorAll('.language-option').forEach(option => {
                option.classList.toggle('active', option.dataset.lang === lang);
            });
        }

        // Save content with proper error handling
        function saveContent() {
            if (!isContentChanged) return;
            
            updateStatus('saving');
            
            fetch(location.href, {
                method: 'PUT',
                headers: { 'Content-Type': 'text/plain; charset=utf-8' },
                body: editor.value,
            })
            .then(response => {
                if (response.ok) {
                    updateStatus('saved');
                    console.log('✅ Code saved successfully');
                } else {
                    updateStatus('unsaved');
                    console.error('❌ Save failed:', response.status);
                }
            })
            .catch(err => {
                updateStatus('unsaved');
                console.error('❌ Save failed:', err);
            });
        }

        // Language selector toggle
        languageSelector.addEventListener('click', function(e) {
            e.stopPropagation();
            const isVisible = languageDropdown.style.display === 'block';
            languageDropdown.style.display = isVisible ? 'none' : 'block';
        });

        // Language option selection
        languageDropdown.addEventListener('click', function(e) {
            const option = e.target.closest('.language-option');
            if (option) {
                updateLanguage(option.dataset.lang);
                languageDropdown.style.display = 'none';
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function() {
            languageDropdown.style.display = 'none';
        });

        // Load initial content
        fetch(location.href + '?raw=true')
        .then(r => r.text())
        .then(content => {
            editor.value = content;
            lastSavedContent = content;
            updateStats();
            updateStatus('saved');
            
            // Auto-detect language
            const detected = detectLanguage(content);
            if (detected !== currentLanguage) {
                updateLanguage(detected);
            }
        })
        .catch(() => {
            updateStats();
            updateStatus('saved');
        });

        // Editor event listeners
        editor.addEventListener('input', function() {
            updateStats();
            
            // Auto-detect language on content change
            const detected = detectLanguage(this.value);
            if (detected !== currentLanguage) {
                updateLanguage(detected);
            }
            
            // Auto-save after 1.5 seconds of inactivity
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(saveContent, 1500);
        });

        editor.addEventListener('scroll', function() {
            lineNumbers.scrollTop = this.scrollTop;
        });

        // Keyboard shortcuts
        editor.addEventListener('keydown', function(e) {
            // Tab support
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = this.selectionStart;
                const end = this.selectionEnd;
                
                if (e.shiftKey) {
                    // Remove indentation
                    const beforeCursor = this.value.substring(0, start);
                    const lines = beforeCursor.split('\\n');
                    const currentLine = lines[lines.length - 1];
                    
                    if (currentLine.startsWith('    ')) {
                        lines[lines.length - 1] = currentLine.substring(4);
                        this.value = lines.join('\\n') + this.value.substring(end);
                        this.selectionStart = this.selectionEnd = start - 4;
                    }
                } else {
                    // Add indentation
                    this.value = this.value.substring(0, start) + '    ' + this.value.substring(end);
                    this.selectionStart = this.selectionEnd = start + 4;
                }
                
                updateStats();
            }
            
            // Ctrl+S to save immediately
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                clearTimeout(saveTimeout);
                saveContent();
            }
        });

        // Initial stats update
        updateStats();
    </script>
</body>
</html>`;
};

module.exports = {
    info: {
        path: '/note/:UUID',
        title: 'Compact Code Editor API',
        desc: 'API for creating and editing code with compact interface',
        example_url: [
            { method: 'GET', query: '/note/:UUID', desc: 'Open code editor' },
            { method: 'PUT', query: '/note/:UUID', desc: 'Save code content' },
            { method: 'DELETE', query: '/note/:UUID', desc: 'Delete code file' }
        ]
    },
    methods: {
        get: (req, res) => {
            const uuid = req.params.UUID;

            // Generate new UUID if invalid
            if (!uuid || uuid === ':UUID' || uuid.length > 36) {
                const newUuid = uuidv4();
                res.redirect('./' + newUuid);
                return;
            }

            const filePath = path.join(notesDir, uuid + '.txt');
            const text = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';

            // Handle raw file references
            if (fs.existsSync(filePath + '.raw')) {
                const rawFilePath = fs.readFileSync(filePath + '.raw', 'utf8');
                
                if (fs.existsSync(rawFilePath)) {
                    res.set('content-type', 'text/plain');
                    res.end(fs.readFileSync(rawFilePath, 'utf8'));
                    return;
                } else {
                    res.status(404).json({ error: 'Raw file not found' });
                    return;
                }
            }

            // Return raw content for API requests
            if (req.query.raw === 'true' || !/^Mozilla/.test(req.headers['user-agent'])) {
                res.set('content-type', 'text/plain');
                res.end(text);
                return;
            }

            // Return compact HTML editor
            res.set('content-type', 'text/html');
            res.end(getCompactEditorHTML(uuid, text));
        },

        put: async (req, res) => {
            try {
                const chunks = [];
                req.on('data', chunk => chunks.push(chunk));
                await new Promise(resolve => req.on('end', resolve));

                const uuid = req.params.UUID;
                const filePath = path.join(notesDir, uuid + '.txt');

                if (req.query.raw) {
                    if (!fs.existsSync(filePath + '.raw')) {
                        fs.writeFileSync(filePath + '.raw', path.join(notesDir, req.query.raw + '.txt'));
                    }
                } else {
                    const content = Buffer.concat(chunks).toString('utf8');
                    fs.writeFileSync(filePath, content);
                    
                    console.log('💾 Code saved: ' + uuid + ' (' + content.length + ' chars)');
                }

                res.json({ 
                    success: true, 
                    message: 'Code saved successfully',
                    uuid: uuid,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error saving code:', error);
                res.status(500).json({ 
                    error: 'Failed to save code',
                    message: error.message 
                });
            }
        },

        delete: (req, res) => {
            try {
                const uuid = req.params.UUID;
                const filePath = path.join(notesDir, uuid + '.txt');
                const rawFilePath = filePath + '.raw';

                let deleted = false;

                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    deleted = true;
                }

                if (fs.existsSync(rawFilePath)) {
                    fs.unlinkSync(rawFilePath);
                    deleted = true;
                }

                if (deleted) {
                    console.log('🗑️ Code deleted: ' + uuid);
                    res.json({ 
                        success: true, 
                        message: 'Code deleted successfully',
                        uuid: uuid 
                    });
                } else {
                    res.status(404).json({ 
                        error: 'Code not found',
                        uuid: uuid 
                    });
                }
            } catch (error) {
                console.error('Error deleting code:', error);
                res.status(500).json({ 
                    error: 'Failed to delete code',
                    message: error.message 
                });
            }
        }
    }
};

