const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const notesDir = path.join(__dirname, '../note');

// Ensure notes directory exists
if (!fs.existsSync(notesDir)) {
    fs.mkdirSync(notesDir, { recursive: true });
}

// Enhanced HTML template with improved code editor
const getEnhancedEditorHTML = (uuid, content = '') => {
    return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Note Editor - ${uuid}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600;700&family=Fira+Code:wght@300;400;500;600&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --bg-primary: #fefefe;
            --bg-secondary: #f8f9fa;
            --bg-tertiary: #e9ecef;
            --text-primary: #2d3748;
            --text-secondary: #4a5568;
            --text-muted: #718096;
            --accent-pink: #ff6b9d;
            --accent-mauve: #c44569;
            --accent-blue: #4834d4;
            --accent-green: #00d2d3;
            --accent-yellow: #ff9ff3;
            --accent-red: #ff3838;
            --accent-peach: #ff9f43;
            --surface: #ffffff;
            --overlay: #f1f3f4;
            --border: #e2e8f0;
            --shadow: rgba(0, 0, 0, 0.1);
            --shadow-light: rgba(255, 107, 157, 0.1);
            --shadow-medium: rgba(255, 107, 157, 0.2);
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
            color: var(--text-primary);
            min-height: 100vh;
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, var(--surface), var(--overlay));
            padding: 15px 20px;
            border-bottom: 1px solid var(--border);
            box-shadow: 0 2px 10px var(--shadow-light);
        }

        .header-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 15px;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .logo {
            font-size: 20px;
            font-weight: 700;
            background: linear-gradient(135deg, var(--accent-pink), var(--accent-mauve));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .note-id {
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            color: var(--text-muted);
            background: var(--overlay);
            padding: 4px 8px;
            border-radius: 6px;
            border: 1px solid var(--border);
        }

        .header-right {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .status-indicator {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: var(--text-muted);
            padding: 4px 8px;
            border-radius: 6px;
            background: var(--overlay);
            border: 1px solid var(--border);
            transition: all 0.3s ease;
        }

        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--accent-green);
            transition: all 0.3s ease;
        }

        .status-indicator.unsaved .status-dot {
            background: var(--accent-yellow);
            animation: pulse 2s infinite;
        }

        .status-indicator.saving .status-dot {
            background: var(--accent-blue);
            animation: spin 1s linear infinite;
        }

        .status-indicator.saved .status-dot {
            background: var(--accent-green);
            animation: none;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(0.9); }
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .info-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px;
            background: var(--bg-secondary);
            border-radius: 8px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            color: var(--text-muted);
        }

        .info-left {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .info-right {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .stats {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .stat-item {
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .syntax-highlight {
            color: var(--accent-blue);
            font-weight: 500;
        }

        .editor-container {
            display: flex;
            height: calc(100vh - 120px);
            overflow: hidden;
            margin: 0;
        }

        .line-numbers {
            background: var(--overlay);
            color: var(--text-muted);
            padding: 20px 15px;
            font-family: 'JetBrains Mono', 'Fira Code', monospace;
            font-size: 14px;
            line-height: 1.6;
            text-align: right;
            border-right: 1px solid var(--border);
            user-select: none;
            min-width: 70px;
            overflow-y: auto;
            overflow-x: hidden;
            border-radius: 8px 0 0 8px;
            box-shadow: 2px 0 5px var(--shadow-light);
            white-space: pre;
        }

        .line-number {
            display: block;
            height: 22.4px;
            line-height: 22.4px;
            padding-right: 10px;
            transition: all 0.2s ease;
        }

        .line-number:hover {
            background: var(--shadow-light);
            color: var(--accent-pink);
        }

        .editor-textarea {
            flex: 1;
            background: var(--surface);
            color: var(--text-primary);
            border: none;
            padding: 20px;
            font-family: 'JetBrains Mono', 'Fira Code', monospace;
            font-size: 14px;
            line-height: 1.6;
            resize: none;
            outline: none;
            white-space: pre;
            overflow-wrap: normal;
            overflow-x: auto;
            tab-size: 4;
            box-shadow: inset 0 0 0 1px var(--border);
            border-radius: 0 8px 8px 0;
        }

        .editor-textarea::placeholder {
            color: var(--text-muted);
            font-style: italic;
        }

        .editor-textarea:focus {
            background: var(--bg-primary);
            box-shadow: inset 0 0 0 2px var(--accent-pink);
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
            .header {
                padding: 10px 15px;
            }

            .header-top {
                flex-direction: column;
                gap: 10px;
                margin-bottom: 10px;
            }

            .header-left, .header-right {
                width: 100%;
                justify-content: space-between;
            }

            .info-bar {
                flex-direction: column;
                gap: 8px;
            }

            .info-left, .info-right {
                width: 100%;
                justify-content: space-between;
            }

            .editor-container {
                height: calc(100vh - 140px);
            }

            .line-numbers {
                min-width: 50px;
                padding: 15px 10px;
                font-size: 12px;
            }

            .editor-textarea {
                padding: 15px;
                font-size: 13px;
            }

            .stats {
                gap: 10px;
            }
        }

        /* Scrollbar styling */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }

        ::-webkit-scrollbar-track {
            background: var(--overlay);
        }

        ::-webkit-scrollbar-thumb {
            background: var(--border);
            border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: var(--accent-pink);
        }

        /* Selection styling */
        ::selection {
            background: var(--accent-pink);
            color: var(--surface);
        }

        /* Loading animation */
        .loading {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: var(--bg-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            animation: fadeOut 1s ease-out 0.5s forwards;
        }

        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid var(--border);
            border-top: 3px solid var(--accent-pink);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes fadeOut {
            to {
                opacity: 0;
                visibility: hidden;
            }
        }

        /* Enhanced animations */
        .status-indicator {
            animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .editor-container {
            animation: fadeInUp 0.5s ease-out 0.2s both;
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    </style>
</head>
<body>
    <div class="loading">
        <div class="loading-spinner"></div>
    </div>

    <div class="header">
        <div class="header-top">
            <div class="header-left">
                <div class="logo">📝 Note Editor</div>
                <div class="note-id">${uuid}</div>
            </div>
            <div class="header-right">
                <div class="status-indicator saved" id="status-indicator">
                    <div class="status-dot"></div>
                    <span id="status-text">Đã lưu</span>
                </div>
            </div>
        </div>
        
        <div class="info-bar">
            <div class="info-left">
                <div class="stats">
                    <div class="stat-item">
                        <span>Dòng:</span>
                        <span id="line-count">1</span>
                    </div>
                    <div class="stat-item">
                        <span>Ký tự:</span>
                        <span id="char-count">0</span>
                    </div>
                    <div class="stat-item">
                        <span>Từ:</span>
                        <span id="word-count">0</span>
                    </div>
                </div>
            </div>
            <div class="info-right">
                <span>UTF-8</span>
                <span class="syntax-highlight">JavaScript</span>
                <span>Auto-save: ON</span>
            </div>
        </div>
    </div>

    <div class="editor-container">
        <div class="line-numbers" id="line-numbers">
            <div class="line-number">1</div>
        </div>
        <textarea 
            class="editor-textarea" 
            id="editor-textarea" 
            placeholder="// Bắt đầu viết ghi chú hoặc code của bạn tại đây...
// Editor này hỗ trợ syntax highlighting và auto-save
// Thay đổi sẽ được tự động lưu sau 1 giây không hoạt động

function welcome() {
    console.log('Chào mừng đến với API GHICHU Note Editor!');
    return 'Chúc bạn code vui vẻ! 🚀';
}

welcome();"
            spellcheck="false"
        ></textarea>
    </div>

    <script>
        const textarea = document.getElementById('editor-textarea');
        const lineNumbers = document.getElementById('line-numbers');
        const statusIndicator = document.getElementById('status-indicator');
        const statusText = document.getElementById('status-text');
        const lineCount = document.getElementById('line-count');
        const charCount = document.getElementById('char-count');
        const wordCount = document.getElementById('word-count');

        let saveTimeout;
        let currentStatus = 'saved'; // 'unsaved', 'saving', 'saved'

        // Update status indicator
        function updateStatus(status) {
            currentStatus = status;
            statusIndicator.className = 'status-indicator ' + status;
            
            switch(status) {
                case 'unsaved':
                    statusText.textContent = 'Chưa lưu';
                    break;
                case 'saving':
                    statusText.textContent = 'Đang lưu...';
                    break;
                case 'saved':
                    statusText.textContent = 'Đã lưu';
                    break;
            }
        }

        // Update line numbers with vertical layout
        function updateLineNumbers() {
            const lines = textarea.value.split('\\n');
            const lineNumbersHTML = lines.map((_, index) => 
                '<div class="line-number">' + (index + 1) + '</div>'
            ).join('');
            
            lineNumbers.innerHTML = lineNumbersHTML;
            
            // Update stats
            lineCount.textContent = lines.length;
            charCount.textContent = textarea.value.length;
            wordCount.textContent = textarea.value.trim() ? textarea.value.trim().split(/\\s+/).length : 0;
        }

        // Save content to server
        function saveContent() {
            updateStatus('saving');
            
            fetch(location.href, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                },
                body: textarea.value,
            }).then(response => {
                if (response.ok) {
                    updateStatus('saved');
                } else {
                    updateStatus('unsaved');
                    console.error('Save failed:', response.status);
                }
            }).catch(err => {
                updateStatus('unsaved');
                console.error('Save failed:', err);
            });
        }

        // Load initial content
        const url = new URL(location.href);
        url.searchParams.append('raw', 'true');

        fetch(url.href, { 
            method: 'GET', 
            headers: { 'user-agent': 'fetch' } 
        })
        .then(r => r.text())
        .then(content => {
            textarea.value = content;
            updateLineNumbers();
            updateStatus('saved');
            
            // Setup event listeners
            textarea.addEventListener('input', function() {
                updateStatus('unsaved');
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(saveContent, 1000);
                updateLineNumbers();
            });

            textarea.addEventListener('scroll', function() {
                lineNumbers.scrollTop = this.scrollTop;
            });

            // Keyboard shortcuts
            textarea.addEventListener('keydown', function(e) {
                // Tab key support
                if (e.key === 'Tab') {
                    e.preventDefault();
                    const start = this.selectionStart;
                    const end = this.selectionEnd;
                    
                    if (e.shiftKey) {
                        // Shift+Tab: Remove indentation
                        const beforeCursor = this.value.substring(0, start);
                        const afterCursor = this.value.substring(end);
                        const lines = beforeCursor.split('\\n');
                        const currentLine = lines[lines.length - 1];
                        
                        if (currentLine.startsWith('    ')) {
                            lines[lines.length - 1] = currentLine.substring(4);
                            this.value = lines.join('\\n') + afterCursor;
                            this.selectionStart = this.selectionEnd = start - 4;
                        } else if (currentLine.startsWith('\\t')) {
                            lines[lines.length - 1] = currentLine.substring(1);
                            this.value = lines.join('\\n') + afterCursor;
                            this.selectionStart = this.selectionEnd = start - 1;
                        }
                    } else {
                        // Tab: Add indentation
                        this.value = this.value.substring(0, start) + '    ' + this.value.substring(end);
                        this.selectionStart = this.selectionEnd = start + 4;
                    }
                    
                    updateLineNumbers();
                    updateStatus('unsaved');
                }
                
                // Ctrl+S to save
                if (e.ctrlKey && e.key === 's') {
                    e.preventDefault();
                    clearTimeout(saveTimeout);
                    saveContent();
                }
            });
        })
        .catch(err => {
            console.error('Failed to load content:', err);
            updateLineNumbers();
            updateStatus('saved');
        });

        // Initial line numbers update
        updateLineNumbers();
    </script>
</body>
</html>`;
};

module.exports = {
    info: {
        path: '/note/:UUID',
        title: 'Enhanced Note API',
        desc: 'API for creating and retrieving notes with modern code editor',
        example_url: [
            { method: 'GET', query: '/note/:UUID', desc: 'Retrieve or edit a note' },
            { method: 'PUT', query: '/note/:UUID', desc: 'Create or update a note' },
            { method: 'DELETE', query: '/note/:UUID', desc: 'Delete a note' }
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

            // Return enhanced HTML editor
            res.set('content-type', 'text/html');
            res.end(getEnhancedEditorHTML(uuid, text));
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
                    
                    // Log save activity
                    console.log('📝 Note saved: ' + uuid + ' (' + content.length + ' chars)');
                }

                res.json({ 
                    success: true, 
                    message: 'Note saved successfully',
                    uuid: uuid,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error saving note:', error);
                res.status(500).json({ 
                    error: 'Failed to save note',
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
                    console.log('🗑️ Note deleted: ' + uuid);
                    res.json({ 
                        success: true, 
                        message: 'Note deleted successfully',
                        uuid: uuid 
                    });
                } else {
                    res.status(404).json({ 
                        error: 'Note not found',
                        uuid: uuid 
                    });
                }
            } catch (error) {
                console.error('Error deleting note:', error);
                res.status(500).json({ 
                    error: 'Failed to delete note',
                    message: error.message 
                });
            }
        }
    }
};

