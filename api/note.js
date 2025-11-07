const fs = require("fs")
const path = require("path")
const { v4: uuidv4 } = require('uuid')

const notesDir = path.join(__dirname, "../note")

if (!fs.existsSync(notesDir)) {
  fs.mkdirSync(notesDir, { recursive: true })
}

// Default TTL: 24 hours
const DEFAULT_TTL = 24 * 60 * 60 * 1000

const getNoteMetaPath = (uuid) => path.join(notesDir, `${uuid}.json`)
const getNoteContentPath = (uuid) => path.join(notesDir, `${uuid}.txt`)

const updateNoteExpiry = (uuid, ttl = DEFAULT_TTL) => {
  const metaPath = getNoteMetaPath(uuid)
  const meta = {
    uuid: uuid,
    createdAt: Date.now(),
    expiresAt: Date.now() + ttl,
    lastAccessed: Date.now(),
    ttl: ttl
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

      // Validate UUID
      if (!isValidUUID(uuid)) {
        if (action === 'edit') {
          return res.redirect(`/edit/${uuidv4()}`)
        } else {
          return res.status(400).json({ error: 'Invalid UUID format' })
        }
      }

      const contentPath = getNoteContentPath(uuid)
      const contentExists = fs.existsSync(contentPath)

      // Update last accessed time
      if (contentExists) {
        const meta = getNoteMeta(uuid)
        if (meta) {
          meta.lastAccessed = Date.now()
          fs.writeFileSync(getNoteMetaPath(uuid), JSON.stringify(meta, null, 2))
        }
      }

      if (action === 'raw') {
        // Raw content endpoint
        if (!contentExists) {
          return res.status(404).json({ error: 'Note not found' })
        }
        
        res.set("content-type", "text/plain; charset=utf-8")
        res.set("Cache-Control", "no-cache")
        res.end(fs.readFileSync(contentPath, "utf8"))
        return
      }

      if (action === 'edit') {
        // Web editor interface
        res.set("content-type", "text/html")
        res.end(`<!DOCTYPE html>
<html data-theme="dark">
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${contentExists ? 'Editing: ' + uuid : 'New Note'} - API GHICHU</title>
    <style>
        :root {
            /* Light theme variables */
            --bg-light: #ffffff;
            --editor-bg-light: #f5f5f5;
            --text-light: #333333;
            --line-numbers-light: #858585;
            --line-numbers-bg-light: #f0f0f0;
            --border-light: #e0e0e0;
            --header-bg-light: #f3f3f3;
            --header-text-light: #333333;
            --active-line-light: #e3e8ec;
            --scrollbar-light: #c1c1c1;
            --button-bg-light: #007acc;
            --button-hover-light: #005a9e;
            
            /* Dark theme variables */
            --bg-dark: #1e1e1e;
            --editor-bg-dark: #1e1e1e;
            --text-dark: #d4d4d4;
            --line-numbers-dark: #858585;
            --line-numbers-bg-dark: #1e1e1e;
            --border-dark: #444444;
            --header-bg-dark: #252526;
            --header-text-dark: #cccccc;
            --active-line-dark: #282828;
            --scrollbar-dark: #424242;
            --button-bg-dark: #007acc;
            --button-hover-dark: #005a9e;
        }
        
        [data-theme="light"] {
            --bg: var(--bg-light);
            --editor-bg: var(--editor-bg-light);
            --text: var(--text-light);
            --line-numbers: var(--line-numbers-light);
            --line-numbers-bg: var(--line-numbers-bg-light);
            --border: var(--border-light);
            --header-bg: var(--header-bg-light);
            --header-text: var(--header-text-light);
            --active-line: var(--active-line-light);
            --scrollbar: var(--scrollbar-light);
            --button-bg: var(--button-bg-light);
            --button-hover: var(--button-hover-light);
        }
        
        [data-theme="dark"] {
            --bg: var(--bg-dark);
            --editor-bg: var(--editor-bg-dark);
            --text: var(--text-dark);
            --line-numbers: var(--line-numbers-dark);
            --line-numbers-bg: var(--line-numbers-bg-dark);
            --border: var(--border-dark);
            --header-bg: var(--header-bg-dark);
            --header-text: var(--header-text-dark);
            --active-line: var(--active-line-dark);
            --scrollbar: var(--scrollbar-dark);
            --button-bg: var(--button-bg-dark);
            --button-hover: var(--button-hover-dark);
        }
        
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Consolas', 'Monaco', 'Menlo', monospace;
        }
        
        body {
            margin: 0;
            padding: 0;
            background-color: var(--bg);
            color: var(--text);
            height: 100vh;
            display: flex;
            flex-direction: column;
            transition: background-color 0.3s, color 0.3s;
        }
        
        .editor-header {
            background-color: var(--header-bg);
            color: var(--header-text);
            padding: 8px 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border);
            flex-wrap: wrap;
            gap: 8px;
        }
        
        .header-left {
            display: flex;
            flex-direction: column;
            flex: 1;
        }
        
        .editor-title {
            font-size: 14px;
            font-weight: normal;
        }
        
        .editor-subtitle {
            font-size: 12px;
            opacity: 0.7;
            margin-top: 4px;
        }
        
        .note-id {
            font-family: monospace;
            background: rgba(0, 0, 0, 0.1);
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 11px;
        }
        
        .header-right {
            display: flex;
            gap: 8px;
            align-items: center;
            flex-wrap: wrap;
        }
        
        .ttl-selector {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
        }
        
        .ttl-select {
            background: var(--bg);
            color: var(--text);
            border: 1px solid var(--border);
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 11px;
        }
        
        .theme-toggle, .action-btn {
            background: var(--button-bg);
            border: 1px solid var(--border);
            color: white;
            padding: 6px 12px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 4px;
            text-decoration: none;
        }
        
        .theme-toggle:hover, .action-btn:hover {
            background: var(--button-hover);
        }
        
        .action-btn.delete {
            background: #d32f2f;
        }
        
        .action-btn.delete:hover {
            background: #b71c1c;
        }
        
        .editor-container {
            display: flex;
            flex-grow: 1;
            overflow: hidden;
            position: relative;
        }
        
        .line-numbers {
            background-color: var(--line-numbers-bg);
            color: var(--line-numbers);
            padding: 8px 8px 8px 12px;
            text-align: right;
            user-select: none;
            border-right: 1px solid var(--border);
            overflow: hidden;
            min-width: 40px;
        }
        
        .line-number {
            font-size: 13px;
            line-height: 20px;
            white-space: nowrap;
        }
        
        .editor-content {
            flex-grow: 1;
            display: flex;
            position: relative;
        }
        
        .editor-textarea {
            width: 100%;
            height: 100%;
            background-color: var(--editor-bg);
            color: var(--text);
            border: none;
            resize: none;
            outline: none;
            padding: 8px 12px;
            font-size: 13px;
            line-height: 20px;
            white-space: pre;
            overflow: auto;
            tab-size: 4;
        }
        
        .editor-textarea:focus {
            outline: none;
        }
        
        /* VS Code-like scrollbar */
        .editor-textarea::-webkit-scrollbar {
            width: 14px;
            height: 14px;
        }
        
        .editor-textarea::-webkit-scrollbar-thumb {
            background-color: var(--scrollbar);
            border-radius: 7px;
            border: 3px solid var(--editor-bg);
        }
        
        .editor-textarea::-webkit-scrollbar-track {
            background-color: var(--editor-bg);
        }
        
        .status-bar {
            background-color: var(--header-bg);
            color: var(--line-numbers);
            padding: 4px 12px;
            font-size: 12px;
            display: flex;
            justify-content: space-between;
            border-top: 1px solid var(--border);
        }
        
        .status-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .status-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #4caf50;
            margin-right: 4px;
        }
        
        .status-indicator.saving {
            background-color: #ff9800;
        }
        
        .status-indicator.error {
            background-color: #f44336;
        }
        
        .expiry-info {
            font-size: 11px;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="editor-header">
        <div class="header-left">
            <h3 class="editor-title">API GHICHU - Enhanced Note Editor</h3>
            <div class="editor-subtitle">
                Note ID: <span class="note-id">${uuid}</span> • Auto-save enabled • TTL: <span id="currentTTL">24h</span>
            </div>
        </div>
        <div class="header-right">
            <div class="ttl-selector">
                <label>Expires in:</label>
                <select class="ttl-select" id="ttlSelect">
                    <option value="3600000">1 hour</option>
                    <option value="21600000">6 hours</option>
                    <option value="43200000">12 hours</option>
                    <option value="86400000" selected>24 hours</option>
                    <option value="172800000">48 hours</option>
                    <option value="604800000">7 days</option>
                    <option value="0">Never</option>
                </select>
            </div>
            <a href="/raw/${uuid}" class="action-btn" target="_blank">Raw</a>
            <button class="action-btn delete" id="deleteBtn">Delete</button>
            <button class="theme-toggle" id="themeToggle">
                <svg id="theme-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
                <span id="theme-text">Light Mode</span>
            </button>
        </div>
    </div>
    
    <div class="editor-container">
        <div class="line-numbers" id="lineNumbers"></div>
        <div class="editor-content">
            <textarea id="editor" class="editor-textarea" placeholder="Start typing...">${contentExists ? fs.readFileSync(contentPath, "utf8") : ''}</textarea>
        </div>
    </div>
    
    <div class="status-bar">
        <div class="status-item">
            <span id="statusIndicator" class="status-indicator"></span>
            <span id="statusText">Ready</span>
            <span class="expiry-info" id="expiryInfo"></span>
        </div>
        <div class="status-item">
            <span id="fileStats">-</span>
            <span id="cursorPosition">Ln 1, Col 1</span>
        </div>
    </div>
    
    <script>
        const editor = document.getElementById('editor');
        const lineNumbers = document.getElementById('lineNumbers');
        const themeToggle = document.getElementById('themeToggle');
        const themeText = document.getElementById('theme-text');
        const themeIcon = document.getElementById('theme-icon');
        const statusIndicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        const cursorPosition = document.getElementById('cursorPosition');
        const fileStats = document.getElementById('fileStats');
        const expiryInfo = document.getElementById('expiryInfo');
        const ttlSelect = document.getElementById('ttlSelect');
        const deleteBtn = document.getElementById('deleteBtn');
        const currentTTL = document.getElementById('currentTTL');
        const html = document.documentElement;
        
        const NOTE_UUID = '${uuid}';
        let currentTtl = 86400000; // 24 hours default
        
        // Theme management
        themeToggle.addEventListener('click', () => {
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('editor-theme', newTheme);
            
            if (newTheme === 'light') {
                themeText.textContent = 'Dark Mode';
                themeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
            } else {
                themeText.textContent = 'Light Mode';
                themeIcon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
            }
        });
        
        // Load saved theme
        const savedTheme = localStorage.getItem('editor-theme') || 'dark';
        html.setAttribute('data-theme', savedTheme);
        if (savedTheme === 'light') {
            themeText.textContent = 'Dark Mode';
            themeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
        }
        
        // Line numbers
        const updateLineNumbers = () => {
            const lines = editor.value.split('\\n');
            lineNumbers.innerHTML = '';
            
            for (let i = 0; i < lines.length; i++) {
                const lineNumber = document.createElement('div');
                lineNumber.className = 'line-number';
                lineNumber.textContent = i + 1;
                lineNumbers.appendChild(lineNumber);
            }
        };
        
        // Cursor position
        const updateCursorPosition = () => {
            const text = editor.value;
            const position = editor.selectionStart;
            
            const lines = text.substr(0, position).split('\\n');
            const lineNumber = lines.length;
            const columnNumber = lines[lines.length - 1].length + 1;
            
            cursorPosition.textContent = 'Ln ' + lineNumber + ', Col ' + columnNumber;
        };
        
        // File statistics
        const updateFileStats = () => {
            const content = editor.value;
            const lines = content.split('\\n').length;
            const words = content.trim() ? content.trim().split(/\\s+/).length : 0;
            const chars = content.length;
            const size = new Blob([content]).size;
            
            fileStats.textContent = lines + ' lines • ' + words + ' words • ' + chars + ' chars • ' + formatBytes(size);
        };
        
        const formatBytes = (bytes) => {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
        };
        
        // TTL management
        ttlSelect.addEventListener('change', () => {
            currentTtl = parseInt(ttlSelect.value);
            const ttlText = ttlSelect.options[ttlSelect.selectedIndex].text;
            currentTTL.textContent = ttlText;
        });
        
        // Auto-save with TTL
        let saveTimeout;
        const saveNote = () => {
            statusIndicator.classList.add('saving');
            statusText.textContent = 'Saving...';
            
            fetch('/edit/' + NOTE_UUID + '?ttl=' + currentTtl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                },
                body: editor.value,
            }).then(response => {
                if (response.ok) {
                    statusIndicator.classList.remove('saving');
                    statusText.textContent = 'Saved';
                    updateExpiryInfo();
                    
                    setTimeout(() => {
                        if (statusText.textContent === 'Saved') {
                            statusText.textContent = 'Ready';
                        }
                    }, 2000);
                } else {
                    throw new Error('Save failed');
                }
            }).catch(error => {
                statusIndicator.classList.add('error');
                statusText.textContent = 'Save failed';
                console.error('Save error:', error);
            });
        };
        
        // Update expiry info
        const updateExpiryInfo = () => {
            fetch('/edit/' + NOTE_UUID + '?meta=true')
                .then(r => r.json())
                .then(meta => {
                    if (meta && meta.expiresAt) {
                        const expires = new Date(meta.expiresAt);
                        const now = new Date();
                        const diff = expires - now;
                        
                        if (diff > 0) {
                            const hours = Math.floor(diff / (1000 * 60 * 60));
                            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                            expiryInfo.textContent = 'Expires in: ' + hours + 'h ' + minutes + 'm';
                        } else {
                            expiryInfo.textContent = 'Expired';
                        }
                    }
                })
                .catch(() => {
                    expiryInfo.textContent = '';
                });
        };
        
        // Delete note
        deleteBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
                fetch('/edit/' + NOTE_UUID, {
                    method: 'DELETE'
                }).then(() => {
                    window.location.href = '/';
                });
            }
        });
        
        // Editor event listeners
        editor.addEventListener('input', () => {
            updateLineNumbers();
            updateCursorPosition();
            updateFileStats();
            
            if (saveTimeout) clearTimeout(saveTimeout);
            saveTimeout = setTimeout(saveNote, 1000);
        });
        
        editor.addEventListener('keydown', (e) => {
            // Tab support
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = editor.selectionStart;
                const end = editor.selectionEnd;
                
                editor.value = editor.value.substring(0, start) + '    ' + editor.value.substring(end);
                editor.selectionStart = editor.selectionEnd = start + 4;
                
                updateLineNumbers();
                updateCursorPosition();
                updateFileStats();
                
                if (saveTimeout) clearTimeout(saveTimeout);
                saveTimeout = setTimeout(saveNote, 1000);
            }
            
            // Ctrl+S to save
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                clearTimeout(saveTimeout);
                saveNote();
            }
        });
        
        editor.addEventListener('click', updateCursorPosition);
        editor.addEventListener('keyup', updateCursorPosition);
        
        editor.addEventListener('scroll', () => {
            lineNumbers.scrollTop = editor.scrollTop;
        });
        
        // Initialize
        updateLineNumbers();
        updateCursorPosition();
        updateFileStats();
        updateExpiryInfo();
        statusIndicator.style.backgroundColor = '#4caf50';
        statusText.textContent = 'Ready';
    </script>
</body>
</html>`)
      }
    },

    put: (req, res) => {
      const { uuid } = req.params
      const ttl = parseInt(req.query.ttl) || DEFAULT_TTL

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
          ttl: ttl
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
