const fs = require("fs")
const path = require("path")
const { v4: uuidv4 } = require('uuid')

const notesDir = path.join(__dirname, "../note")

if (!fs.existsSync(notesDir)) {
  fs.mkdirSync(notesDir, { recursive: true })
}

// TTL range: 1 hour to 10 days (in milliseconds)
const MIN_TTL = 60 * 60 * 1000; // 1 hour
const MAX_TTL = 10 * 24 * 60 * 60 * 1000; // 10 days
const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours

const getNoteMetaPath = (uuid) => path.join(notesDir, `${uuid}.json`)
const getNoteContentPath = (uuid) => path.join(notesDir, `${uuid}.txt`)

const updateNoteExpiry = (uuid, ttl = DEFAULT_TTL) => {
  const metaPath = getNoteMetaPath(uuid)
  const meta = {
    uuid: uuid,
    createdAt: Date.now(),
    expiresAt: Date.now() + ttl,
    lastAccessed: Date.now(),
    ttl: Math.min(Math.max(ttl, MIN_TTL), MAX_TTL)
  }
  
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2))
}

const getNoteMeta = (uuid) => {
  const metaPath = getNoteMetaPath(uuid)
  if (fs.existsSync(metaPath)) {
    return JSON.parse(fs.readFileSync(metaPath, 'utf8'))
  }
  return null
}

const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

const formatTTL = (ttl) => {
  const hours = Math.floor(ttl / (60 * 60 * 1000));
  if (hours < 24) {
    return `${hours} giờ`;
  } else {
    const days = (hours / 24).toFixed(1);
    return `${days} ngày`;
  }
}

// HTML template for editor
const getEditorHTML = (uuid, content, currentTTL) => {
  const escapedContent = content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  return `<!DOCTYPE html>
<html data-theme="dark" lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content ? 'Chỉnh sửa: ' + uuid : 'Ghi chú mới'} - API GHICHU</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        :root {
            --primary: #6366f1;
            --primary-dark: #4f46e5;
            --primary-light: #8b5cf6;
            --secondary: #f472b6;
            --accent: #06d6a0;
            --danger: #ef4444;
            --warning: #f59e0b;
            
            --bg-dark: #0f172a;
            --surface-dark: #1e293b;
            --surface-light-dark: #334155;
            --text-dark: #f1f5f9;
            --text-secondary-dark: #94a3b8;
            --border-dark: #334155;
            
            --bg-light: #ffffff;
            --surface-light: #f8fafc;
            --surface-light-light: #e2e8f0;
            --text-light: #1e293b;
            --text-secondary-light: #64748b;
            --border-light: #cbd5e1;
        }
        
        [data-theme="dark"] {
            --bg: var(--bg-dark);
            --surface: var(--surface-dark);
            --surface-light: var(--surface-light-dark);
            --text: var(--text-dark);
            --text-secondary: var(--text-secondary-dark);
            --border: var(--border-dark);
        }
        
        [data-theme="light"] {
            --bg: var(--bg-light);
            --surface: var(--surface-light);
            --surface-light: var(--surface-light-light);
            --text: var(--text-light);
            --text-secondary: var(--text-secondary-light);
            --border: var(--border-light);
        }
        
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        body {
            font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
            background: var(--bg);
            color: var(--text);
            height: 100vh;
            display: flex;
            flex-direction: column;
            transition: all 0.3s ease;
            overflow: hidden;
        }
        
        .editor-header {
            background: var(--surface);
            border-bottom: 1px solid var(--border);
            padding: 1rem 1.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1rem;
            backdrop-filter: blur(10px);
            position: sticky;
            top: 0;
            z-index: 100;
        }
        
        .header-left {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .logo {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, var(--primary), var(--primary-light));
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.9rem;
            color: white;
        }
        
        .editor-info h1 {
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 0.25rem;
        }
        
        .editor-subtitle {
            font-size: 0.8rem;
            color: var(--text-secondary);
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .note-id {
            font-family: 'Fira Code', monospace;
            background: var(--surface-light);
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            border: 1px solid var(--border);
        }
        
        .header-right {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            flex-wrap: wrap;
        }
        
        .control-group {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: var(--surface-light);
            padding: 0.5rem;
            border-radius: 8px;
            border: 1px solid var(--border);
        }
        
        .control-label {
            font-size: 0.8rem;
            color: var(--text-secondary);
            white-space: nowrap;
        }
        
        .ttl-select {
            background: var(--bg);
            color: var(--text);
            border: 1px solid var(--border);
            padding: 0.375rem 0.75rem;
            border-radius: 6px;
            font-size: 0.8rem;
            min-width: 100px;
        }
        
        .btn {
            background: var(--primary);
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.8rem;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.2s ease;
            text-decoration: none;
        }
        
        .btn:hover {
            background: var(--primary-dark);
            transform: translateY(-1px);
        }
        
        .btn-secondary {
            background: var(--surface-light);
            color: var(--text);
            border: 1px solid var(--border);
        }
        
        .btn-secondary:hover {
            background: var(--surface);
        }
        
        .btn-danger {
            background: var(--danger);
        }
        
        .btn-danger:hover {
            background: #dc2626;
        }
        
        .btn-success {
            background: var(--accent);
        }
        
        .btn-success:hover {
            background: #05b589;
        }
        
        .editor-container {
            display: flex;
            flex: 1;
            overflow: hidden;
            position: relative;
        }
        
        .line-numbers {
            background: var(--surface);
            color: var(--text-secondary);
            padding: 1rem 0.75rem;
            text-align: right;
            user-select: none;
            border-right: 1px solid var(--border);
            overflow: hidden;
            min-width: 60px;
            font-family: 'Fira Code', monospace;
            font-size: 0.875rem;
            line-height: 1.5;
        }
        
        .line-number {
            height: 1.5rem;
            display: flex;
            align-items: center;
            justify-content: flex-end;
        }
        
        .editor-content {
            flex: 1;
            display: flex;
            position: relative;
            background: var(--bg);
        }
        
        .editor-textarea {
            width: 100%;
            height: 100%;
            background: transparent;
            color: var(--text);
            border: none;
            resize: none;
            outline: none;
            padding: 1rem 1.5rem;
            font-family: 'Fira Code', 'Cascadia Code', monospace;
            font-size: 0.875rem;
            line-height: 1.5;
            white-space: pre;
            overflow: auto;
            tab-size: 4;
        }
        
        .editor-textarea::-webkit-scrollbar {
            width: 8px;
        }
        
        .editor-textarea::-webkit-scrollbar-track {
            background: var(--surface);
        }
        
        .editor-textarea::-webkit-scrollbar-thumb {
            background: var(--border);
            border-radius: 4px;
        }
        
        .editor-textarea::-webkit-scrollbar-thumb:hover {
            background: var(--text-secondary);
        }
        
        .status-bar {
            background: var(--surface);
            border-top: 1px solid var(--border);
            padding: 0.75rem 1.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.8rem;
        }
        
        .status-left {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .status-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--text-secondary);
        }
        
        .status-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--accent);
        }
        
        .status-indicator.saving {
            background: var(--warning);
            animation: pulse 1s infinite;
        }
        
        .status-indicator.error {
            background: var(--danger);
        }
        
        .file-stats {
            font-family: 'Fira Code', monospace;
        }
        
        .expiry-info {
            background: var(--surface-light);
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            border: 1px solid var(--border);
        }
        
        .language-badge {
            background: var(--primary);
            color: white;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.7rem;
            font-weight: 500;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        @media (max-width: 768px) {
            .editor-header {
                padding: 0.75rem 1rem;
            }
            
            .header-right {
                order: -1;
                width: 100%;
                justify-content: space-between;
            }
            
            .control-group {
                flex: 1;
            }
            
            .ttl-select {
                flex: 1;
            }
        }
    </style>
</head>
<body>
    <div class="editor-header">
        <div class="header-left">
            <div class="logo">📝</div>
            <div class="editor-info">
                <h1>API GHICHU Editor</h1>
                <div class="editor-subtitle">
                    <span>Auto-save • </span>
                    <span class="note-id">${uuid}</span>
                    <span id="languageBadge" class="language-badge" style="display: none;">Text</span>
                </div>
            </div>
        </div>
        
        <div class="header-right">
            <div class="control-group">
                <span class="control-label">Hết hạn sau:</span>
                <select class="ttl-select" id="ttlSelect">
                    <option value="3600000">1 giờ</option>
                    <option value="21600000">6 giờ</option>
                    <option value="43200000">12 giờ</option>
                    <option value="86400000" selected>24 giờ</option>
                    <option value="172800000">2 ngày</option>
                    <option value="259200000">3 ngày</option>
                    <option value="604800000">7 ngày</option>
                    <option value="864000000">10 ngày</option>
                </select>
            </div>
            
            <a href="/raw/${uuid}" class="btn btn-secondary" target="_blank" title="Xem nội dung raw">
                <i class="fas fa-code"></i>
                Raw
            </a>
            
            <button class="btn btn-success" id="saveBtn" title="Lưu thủ công (Ctrl+S)">
                <i class="fas fa-save"></i>
                Lưu
            </button>
            
            <button class="btn btn-danger" id="deleteBtn" title="Xóa ghi chú này">
                <i class="fas fa-trash"></i>
                Xóa
            </button>
            
            <button class="btn btn-secondary" id="themeToggle" title="Chuyển đổi giao diện">
                <i class="fas fa-palette"></i>
                Giao diện
            </button>
        </div>
    </div>
    
    <div class="editor-container">
        <div class="line-numbers" id="lineNumbers">
            <div class="line-number">1</div>
        </div>
        <div class="editor-content">
            <textarea 
                id="editor" 
                class="editor-textarea" 
                placeholder="Bắt đầu nhập nội dung ghi chú của bạn...&#10;Ctrl+S để lưu thủ công • Tab để thụt lề"
                spellcheck="false"
            >${escapedContent}</textarea>
        </div>
    </div>
    
    <div class="status-bar">
        <div class="status-left">
            <div class="status-item">
                <span id="statusIndicator" class="status-indicator"></span>
                <span id="statusText">Sẵn sàng</span>
            </div>
            <div class="status-item">
                <i class="fas fa-clock"></i>
                <span id="expiryInfo">Hết hạn sau: 24 giờ</span>
            </div>
            <div class="status-item file-stats" id="fileStats">
                -
            </div>
        </div>
        <div class="status-item">
            <i class="fas fa-arrows-alt-h"></i>
            <span id="cursorPosition">Dòng 1, Cột 1</span>
        </div>
    </div>

    <script>
        const editor = document.getElementById('editor');
        const lineNumbers = document.getElementById('lineNumbers');
        const statusIndicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        const cursorPosition = document.getElementById('cursorPosition');
        const fileStats = document.getElementById('fileStats');
        const expiryInfo = document.getElementById('expiryInfo');
        const ttlSelect = document.getElementById('ttlSelect');
        const saveBtn = document.getElementById('saveBtn');
        const deleteBtn = document.getElementById('deleteBtn');
        const themeToggle = document.getElementById('themeToggle');
        const languageBadge = document.getElementById('languageBadge');
        const html = document.documentElement;
        
        const NOTE_UUID = '${uuid}';
        let currentTtl = ${currentTTL};
        let autoSaveTimeout;
        let isContentChanged = false;
        let originalContent = editor.value;

        ttlSelect.value = currentTtl.toString();

        function toggleTheme() {
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('editor-theme', newTheme);
        }

        themeToggle.addEventListener('click', toggleTheme);

        const savedTheme = localStorage.getItem('editor-theme') || 'dark';
        html.setAttribute('data-theme', savedTheme);

        function updateLineNumbers() {
            const lines = editor.value.split('\\\\n');
            lineNumbers.innerHTML = '';
            
            for (let i = 0; i < lines.length; i++) {
                const lineNumber = document.createElement('div');
                lineNumber.className = 'line-number';
                lineNumber.textContent = i + 1;
                lineNumbers.appendChild(lineNumber);
            }
        }

        function updateCursorPosition() {
            const text = editor.value;
            const position = editor.selectionStart;
            
            const lines = text.substr(0, position).split('\\\\n');
            const lineNumber = lines.length;
            const columnNumber = lines[lines.length - 1].length + 1;
            
            cursorPosition.textContent = 'Dòng ' + lineNumber + ', Cột ' + columnNumber;
        }

        function updateFileStats() {
            const content = editor.value;
            const lines = content.split('\\\\n').length;
            const words = content.trim() ? content.trim().split(/\\\\s+/).length : 0;
            const chars = content.length;
            const size = new Blob([content]).size;
            
            fileStats.textContent = lines + ' dòng • ' + words + ' từ • ' + chars + ' ký tự • ' + formatBytes(size);
        }

        function formatBytes(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
        }

        function detectLanguage(content) {
            if (!content || content.trim().length === 0) return 'text';
            
            const patterns = {
                javascript: [/function\\\\s+\\\\w+\\\\s*\\\\(/i, /const\\\\s+\\\\w+/i, /let\\\\s+\\\\w+/i, /var\\\\s+\\\\w+/i],
                python: [/def\\\\s+\\\\w+\\\\s*\\\\(/i, /import\\\\s+\\\\w+/i, /from\\\\s+\\\\w+\\\\s+import/i],
                html: [/<!doctype/i, /<html>/i, /<head>/i, /<body>/i],
                css: [/\\\\w+\\\\s*\\\\{[^}]*\\\\}/m, /@media/i, /@import/i],
                json: [/^\\\\s*\\\\{/, /^\\\\s*\\\\[/, /"[\\\\w-]+"\\\\s*:/],
                markdown: [/^#+\\\\s/m, /\\\\*\\\\*.*\\\\*\\\\*/m, /\\`\\`\\`/m]
            };

            const firstLines = content.split('\\\\n').slice(0, 5).join(' ').toLowerCase();
            
            for (const [lang, langPatterns] of Object.entries(patterns)) {
                if (langPatterns.some(pattern => pattern.test(firstLines))) {
                    return lang;
                }
            }
            return 'text';
        }

        function updateLanguageBadge() {
            const lang = detectLanguage(editor.value);
            if (lang !== 'text') {
                languageBadge.textContent = lang.toUpperCase();
                languageBadge.style.display = 'inline-block';
            } else {
                languageBadge.style.display = 'none';
            }
        }

        function saveNote() {
            if (!isContentChanged) return;

            statusIndicator.classList.add('saving');
            statusText.textContent = 'Đang lưu...';
            
            fetch('/edit/' + NOTE_UUID + '?ttl=' + currentTtl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                },
                body: editor.value,
            }).then(response => {
                if (response.ok) {
                    statusIndicator.classList.remove('saving');
                    statusText.textContent = 'Đã lưu';
                    isContentChanged = false;
                    originalContent = editor.value;
                    
                    setTimeout(() => {
                        if (statusText.textContent === 'Đã lưu') {
                            statusText.textContent = 'Sẵn sàng';
                        }
                    }, 2000);
                } else {
                    throw new Error('Save failed');
                }
            }).catch(error => {
                statusIndicator.classList.add('error');
                statusText.textContent = 'Lỗi lưu';
                console.error('Save error:', error);
            });
        }

        function updateExpiryInfo() {
            const ttlText = ttlSelect.options[ttlSelect.selectedIndex].text;
            expiryInfo.textContent = 'Hết hạn sau: ' + ttlText;
        }

        deleteBtn.addEventListener('click', () => {
            if (confirm('Bạn có chắc chắn muốn xóa ghi chú này? Hành động này không thể hoàn tác.')) {
                fetch('/edit/' + NOTE_UUID, {
                    method: 'DELETE'
                }).then(() => {
                    window.location.href = '/';
                });
            }
        });

        saveBtn.addEventListener('click', () => {
            clearTimeout(autoSaveTimeout);
            saveNote();
        });

        ttlSelect.addEventListener('change', () => {
            currentTtl = parseInt(ttlSelect.value);
            updateExpiryInfo();
            if (isContentChanged) {
                clearTimeout(autoSaveTimeout);
                autoSaveTimeout = setTimeout(saveNote, 500);
            }
        });

        function handleContentChange() {
            updateLineNumbers();
            updateCursorPosition();
            updateFileStats();
            updateLanguageBadge();

            if (editor.value !== originalContent) {
                isContentChanged = true;
                clearTimeout(autoSaveTimeout);
                autoSaveTimeout = setTimeout(saveNote, 1000);
            }
        }

        editor.addEventListener('input', handleContentChange);
        editor.addEventListener('paste', handleContentChange);

        editor.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = editor.selectionStart;
                const end = editor.selectionEnd;
                
                editor.value = editor.value.substring(0, start) + '    ' + editor.value.substring(end);
                editor.selectionStart = editor.selectionEnd = start + 4;
                handleContentChange();
            }
            
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                clearTimeout(autoSaveTimeout);
                saveNote();
            }
        });

        editor.addEventListener('click', updateCursorPosition);
        editor.addEventListener('keyup', updateCursorPosition);

        editor.addEventListener('scroll', () => {
            lineNumbers.scrollTop = editor.scrollTop;
        });

        updateLineNumbers();
        updateCursorPosition();
        updateFileStats();
        updateLanguageBadge();
        updateExpiryInfo();
        statusIndicator.style.backgroundColor = '#06d6a0';
        statusText.textContent = 'Sẵn sàng';

        editor.focus();
    </script>
</body>
</html>`;
}

module.exports = {
  info: {
    path: "/:action(raw|edit)/:uuid",
    title: "Enhanced Note API",
    desc: "API for creating, retrieving and editing notes with TTL support",
    example_url: [
      { method: "GET", query: "/edit/:uuid", desc: "Edit a note (web interface)" },
      { method: "GET", query: "/raw/:uuid", desc: "Get raw note content" },
      { method: "PUT", query: "/edit/:uuid", desc: "Create or update a note" },
      { method: "DELETE", query: "/edit/:uuid", desc: "Delete a note" },
    ],
  },
  methods: {
    get: (req, res) => {
      const { action, uuid } = req.params

      if (!isValidUUID(uuid)) {
        if (action === 'edit') {
          return res.redirect(`/edit/${uuidv4()}`)
        } else {
          return res.status(400).json({ error: 'Invalid UUID format' })
        }
      }

      const contentPath = getNoteContentPath(uuid)
      const contentExists = fs.existsSync(contentPath)

      if (contentExists) {
        const meta = getNoteMeta(uuid)
        if (meta) {
          meta.lastAccessed = Date.now()
          fs.writeFileSync(getNoteMetaPath(uuid), JSON.stringify(meta, null, 2))
        }
      }

      if (action === 'raw') {
        if (!contentExists) {
          return res.status(404).json({ error: 'Note not found' })
        }
        
        res.set("content-type", "text/plain; charset=utf-8")
        res.set("Cache-Control", "no-cache")
        res.end(fs.readFileSync(contentPath, "utf8"))
        return
      }

      if (action === 'edit') {
        const content = contentExists ? fs.readFileSync(contentPath, "utf8") : '';
        const meta = getNoteMeta(uuid);
        const currentTTL = meta ? meta.ttl : DEFAULT_TTL;
        
        res.set("content-type", "text/html")
        const html = getEditorHTML(uuid, content, currentTTL)
        res.end(html)
      }
    },

    put: (req, res) => {
      const { uuid } = req.params
      let ttl = parseInt(req.query.ttl) || DEFAULT_TTL

      ttl = Math.min(Math.max(ttl, MIN_TTL), MAX_TTL)

      if (!isValidUUID(uuid)) {
        return res.status(400).json({ error: 'Invalid UUID format' })
      }

      const content = req.body
      const contentPath = getNoteContentPath(uuid)

      try {
        fs.writeFileSync(contentPath, content, 'utf8')
        updateNoteExpiry(uuid, ttl)
        res.json({ 
          success: true, 
          uuid: uuid,
          message: 'Note saved successfully',
          ttl: ttl,
          ttlFormatted: formatTTL(ttl)
        })
      } catch (error) {
        res.status(500).json({ error: 'Failed to save note' })
      }
    },

    delete: (req, res) => {
      const { uuid } = req.params

      if (!isValidUUID(uuid)) {
        return res.status(400).json({ error: 'Invalid UUID format' })
      }

      try {
        const contentPath = getNoteContentPath(uuid)
        const metaPath = getNoteMetaPath(uuid)

        if (fs.existsSync(contentPath)) {
          fs.unlinkSync(contentPath)
        }
        if (fs.existsSync(metaPath)) {
          fs.unlinkSync(metaPath)
        }

        res.json({ 
          success: true, 
          message: 'Note deleted successfully' 
        })
      } catch (error) {
        res.status(500).json({ error: 'Failed to delete note' })
      }
    }
  },
}
