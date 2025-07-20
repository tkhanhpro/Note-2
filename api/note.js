const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const notesDir = path.join(__dirname, '../note');

// Ensure notes directory exists
if (!fs.existsSync(notesDir)) {
    fs.mkdirSync(notesDir, { recursive: true });
}

// Enhanced HTML template with improved mobility and professional info panel
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
            overflow-x: hidden;
            overflow-y: auto;
        }

        .container {
            max-width: 100vw;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }

        .header {
            background: linear-gradient(135deg, var(--surface), var(--overlay));
            border-bottom: 1px solid var(--border);
            box-shadow: 0 2px 10px var(--shadow-light);
            position: sticky;
            top: 0;
            z-index: 100;
            backdrop-filter: blur(10px);
        }

        .header-main {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 20px;
            border-bottom: 1px solid var(--border);
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .logo {
            font-size: 18px;
            font-weight: 700;
            background: linear-gradient(135deg, var(--accent-pink), var(--accent-mauve));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .note-id {
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            color: var(--text-muted);
            background: var(--overlay);
            padding: 4px 8px;
            border-radius: 6px;
            border: 1px solid var(--border);
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .header-right {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .status-indicator {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            color: var(--text-muted);
            padding: 6px 10px;
            border-radius: 8px;
            background: var(--overlay);
            border: 1px solid var(--border);
            transition: all 0.3s ease;
            min-width: 80px;
        }

        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--accent-green);
            transition: all 0.3s ease;
            flex-shrink: 0;
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

        .toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 20px;
            background: var(--bg-secondary);
            font-size: 11px;
            color: var(--text-muted);
        }

        .toolbar-left {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .toolbar-right {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .stats-group {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .stat-item {
            display: flex;
            align-items: center;
            gap: 4px;
            font-family: 'JetBrains Mono', monospace;
        }

        .stat-value {
            color: var(--accent-blue);
            font-weight: 500;
        }

        .settings-group {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .setting-item {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 2px 6px;
            border-radius: 4px;
            background: var(--overlay);
            border: 1px solid var(--border);
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .setting-item:hover {
            background: var(--accent-pink);
            color: var(--surface);
            border-color: var(--accent-pink);
        }

        .setting-item.active {
            background: var(--accent-blue);
            color: var(--surface);
            border-color: var(--accent-blue);
        }

        .main-content {
            flex: 1;
            display: flex;
            min-height: 0;
            position: relative;
        }

        .editor-container {
            flex: 1;
            display: flex;
            background: var(--surface);
            border-radius: 12px;
            margin: 20px;
            box-shadow: 0 4px 20px var(--shadow-light);
            overflow: hidden;
            border: 1px solid var(--border);
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
            white-space: pre;
            position: sticky;
            left: 0;
        }

        .line-number {
            display: block;
            height: 22.4px;
            line-height: 22.4px;
            padding-right: 10px;
            transition: all 0.2s ease;
            cursor: pointer;
        }

        .line-number:hover {
            background: var(--shadow-light);
            color: var(--accent-pink);
            border-radius: 4px;
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
            overflow: auto;
            tab-size: 4;
            min-height: calc(100vh - 200px);
        }

        .editor-textarea::placeholder {
            color: var(--text-muted);
            font-style: italic;
        }

        .editor-textarea:focus {
            background: var(--bg-primary);
        }

        .floating-panel {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 15px;
            box-shadow: 0 8px 25px var(--shadow-medium);
            backdrop-filter: blur(10px);
            z-index: 200;
            min-width: 250px;
            opacity: 0.9;
            transition: all 0.3s ease;
        }

        .floating-panel:hover {
            opacity: 1;
            transform: translateY(-2px);
            box-shadow: 0 12px 35px var(--shadow-medium);
        }

        .panel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--border);
        }

        .panel-title {
            font-size: 12px;
            font-weight: 600;
            color: var(--text-secondary);
        }

        .panel-toggle {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: var(--overlay);
            border: 1px solid var(--border);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            transition: all 0.2s ease;
        }

        .panel-toggle:hover {
            background: var(--accent-pink);
            color: var(--surface);
        }

        .panel-content {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .panel-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 11px;
        }

        .panel-label {
            color: var(--text-muted);
        }

        .panel-value {
            color: var(--accent-blue);
            font-family: 'JetBrains Mono', monospace;
            font-weight: 500;
        }

        .quick-actions {
            display: flex;
            gap: 6px;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid var(--border);
        }

        .quick-action {
            flex: 1;
            padding: 4px 8px;
            border-radius: 6px;
            background: var(--overlay);
            border: 1px solid var(--border);
            font-size: 10px;
            cursor: pointer;
            text-align: center;
            transition: all 0.2s ease;
        }

        .quick-action:hover {
            background: var(--accent-pink);
            color: var(--surface);
            border-color: var(--accent-pink);
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
            .header-main {
                padding: 10px 15px;
                flex-direction: column;
                gap: 10px;
            }

            .header-left, .header-right {
                width: 100%;
                justify-content: space-between;
            }

            .toolbar {
                padding: 6px 15px;
                flex-direction: column;
                gap: 8px;
            }

            .toolbar-left, .toolbar-right {
                width: 100%;
                justify-content: space-between;
            }

            .stats-group {
                gap: 10px;
            }

            .editor-container {
                margin: 10px;
                border-radius: 8px;
            }

            .line-numbers {
                min-width: 50px;
                padding: 15px 10px;
                font-size: 12px;
            }

            .editor-textarea {
                padding: 15px;
                font-size: 13px;
                min-height: calc(100vh - 180px);
            }

            .floating-panel {
                bottom: 10px;
                right: 10px;
                left: 10px;
                min-width: auto;
            }

            .panel-content {
                flex-direction: row;
                flex-wrap: wrap;
                gap: 12px;
            }

            .panel-row {
                flex: 1;
                min-width: 80px;
            }
        }

        /* Scrollbar styling */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }

        ::-webkit-scrollbar-track {
            background: var(--overlay);
            border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
            background: var(--border);
            border-radius: 4px;
            transition: background 0.2s ease;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: var(--accent-pink);
        }

        /* Selection styling */
        ::selection {
            background: var(--accent-pink);
            color: var(--surface);
        }

        /* Animations */
        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(0.9); }
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
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

        .header {
            animation: slideIn 0.3s ease-out;
        }

        .editor-container {
            animation: fadeInUp 0.5s ease-out 0.2s both;
        }

        .floating-panel {
            animation: fadeInUp 0.5s ease-out 0.4s both;
        }

        /* Enhanced focus states */
        .editor-textarea:focus {
            box-shadow: inset 0 0 0 2px var(--accent-pink);
        }

        /* Smooth transitions */
        * {
            transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-main">
                <div class="header-left">
                    <div class="logo">
                        📝 Note Editor
                    </div>
                    <div class="note-id" title="${uuid}">${uuid}</div>
                </div>
                <div class="header-right">
                    <div class="status-indicator saved" id="status-indicator">
                        <div class="status-dot"></div>
                        <span id="status-text">Đã lưu</span>
                    </div>
                </div>
            </div>
            
            <div class="toolbar">
                <div class="toolbar-left">
                    <div class="stats-group">
                        <div class="stat-item">
                            <span>Dòng:</span>
                            <span class="stat-value" id="line-count">1</span>
                        </div>
                        <div class="stat-item">
                            <span>Ký tự:</span>
                            <span class="stat-value" id="char-count">0</span>
                        </div>
                        <div class="stat-item">
                            <span>Từ:</span>
                            <span class="stat-value" id="word-count">0</span>
                        </div>
                    </div>
                </div>
                <div class="toolbar-right">
                    <div class="settings-group">
                        <div class="setting-item active" id="auto-save-toggle">
                            <span>Auto-save</span>
                        </div>
                        <div class="setting-item" id="word-wrap-toggle">
                            <span>Word Wrap</span>
                        </div>
                        <div class="setting-item">
                            <span>UTF-8</span>
                        </div>
                        <div class="setting-item">
                            <span>JavaScript</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="main-content">
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
        </div>

        <div class="floating-panel" id="floating-panel">
            <div class="panel-header">
                <div class="panel-title">📊 Thống kê</div>
                <div class="panel-toggle" id="panel-toggle">−</div>
            </div>
            <div class="panel-content" id="panel-content">
                <div class="panel-row">
                    <span class="panel-label">Thời gian tạo:</span>
                    <span class="panel-value" id="created-time">--:--</span>
                </div>
                <div class="panel-row">
                    <span class="panel-label">Lần sửa cuối:</span>
                    <span class="panel-value" id="modified-time">--:--</span>
                </div>
                <div class="panel-row">
                    <span class="panel-label">Kích thước:</span>
                    <span class="panel-value" id="file-size">0 B</span>
                </div>
                <div class="panel-row">
                    <span class="panel-label">Encoding:</span>
                    <span class="panel-value">UTF-8</span>
                </div>
                <div class="quick-actions">
                    <div class="quick-action" id="copy-link">📋 Copy Link</div>
                    <div class="quick-action" id="download-file">💾 Download</div>
                    <div class="quick-action" id="share-note">🔗 Share</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const textarea = document.getElementById('editor-textarea');
        const lineNumbers = document.getElementById('line-numbers');
        const statusIndicator = document.getElementById('status-indicator');
        const statusText = document.getElementById('status-text');
        const lineCount = document.getElementById('line-count');
        const charCount = document.getElementById('char-count');
        const wordCount = document.getElementById('word-count');
        const createdTime = document.getElementById('created-time');
        const modifiedTime = document.getElementById('modified-time');
        const fileSize = document.getElementById('file-size');
        const panelToggle = document.getElementById('panel-toggle');
        const panelContent = document.getElementById('panel-content');
        const autoSaveToggle = document.getElementById('auto-save-toggle');
        const wordWrapToggle = document.getElementById('word-wrap-toggle');

        let saveTimeout;
        let currentStatus = 'saved';
        let autoSaveEnabled = true;
        let wordWrapEnabled = false;

        // Initialize timestamps
        const now = new Date();
        createdTime.textContent = now.toLocaleTimeString('vi-VN');
        modifiedTime.textContent = now.toLocaleTimeString('vi-VN');

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
                    modifiedTime.textContent = new Date().toLocaleTimeString('vi-VN');
                    break;
            }
        }

        // Update line numbers and stats
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
            
            // Update file size
            const bytes = new Blob([textarea.value]).size;
            fileSize.textContent = formatBytes(bytes);
        }

        // Format bytes
        function formatBytes(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
        }

        // Save content to server
        function saveContent() {
            if (!autoSaveEnabled) return;
            
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

        // Panel toggle
        panelToggle.addEventListener('click', function() {
            const isCollapsed = panelContent.style.display === 'none';
            panelContent.style.display = isCollapsed ? 'flex' : 'none';
            panelToggle.textContent = isCollapsed ? '−' : '+';
        });

        // Auto-save toggle
        autoSaveToggle.addEventListener('click', function() {
            autoSaveEnabled = !autoSaveEnabled;
            autoSaveToggle.classList.toggle('active', autoSaveEnabled);
            autoSaveToggle.innerHTML = '<span>Auto-save ' + (autoSaveEnabled ? 'ON' : 'OFF') + '</span>';
        });

        // Word wrap toggle
        wordWrapToggle.addEventListener('click', function() {
            wordWrapEnabled = !wordWrapEnabled;
            wordWrapToggle.classList.toggle('active', wordWrapEnabled);
            textarea.style.whiteSpace = wordWrapEnabled ? 'pre-wrap' : 'pre';
            textarea.style.overflowX = wordWrapEnabled ? 'hidden' : 'auto';
        });

        // Quick actions
        document.getElementById('copy-link').addEventListener('click', function() {
            navigator.clipboard.writeText(location.href);
            this.textContent = '✅ Copied!';
            setTimeout(() => this.textContent = '📋 Copy Link', 2000);
        });

        document.getElementById('download-file').addEventListener('click', function() {
            const blob = new Blob([textarea.value], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = '${uuid}.txt';
            a.click();
            URL.revokeObjectURL(url);
        });

        document.getElementById('share-note').addEventListener('click', function() {
            if (navigator.share) {
                navigator.share({
                    title: 'API GHICHU Note',
                    text: 'Check out this note',
                    url: location.href
                });
            } else {
                navigator.clipboard.writeText(location.href);
                this.textContent = '✅ Link copied!';
                setTimeout(() => this.textContent = '🔗 Share', 2000);
            }
        });

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
                if (autoSaveEnabled) {
                    clearTimeout(saveTimeout);
                    saveTimeout = setTimeout(saveContent, 1000);
                }
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
        desc: 'API for creating and retrieving notes with professional code editor',
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

