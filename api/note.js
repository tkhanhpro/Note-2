const fs = require("fs")
const path = require("path")
const { v4: uuidv4 } = require('uuid')

const notesDir = path.join(__dirname, "../note")

if (!fs.existsSync(notesDir)) {
  fs.mkdirSync(notesDir, { recursive: true })
}

// TTL range: 1 hour to 10 days (in milliseconds)
const MIN_TTL = 60 * 60 * 1000;
const MAX_TTL = 10 * 24 * 60 * 60 * 1000;
const DEFAULT_TTL = 24 * 60 * 60 * 1000;

// Cache for frequently accessed files
const fileCache = new Map();
const CACHE_TTL = 30000; // 30 seconds cache

const getNoteMetaPath = (uuid) => path.join(notesDir, `${uuid}.json`)
const getNoteContentPath = (uuid) => path.join(notesDir, `${uuid}.txt`)

// Optimized file operations with caching
const readFileCached = (path) => {
  const cached = fileCache.get(path);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  const data = fs.existsSync(path) ? fs.readFileSync(path, 'utf8') : null;
  fileCache.set(path, { data, timestamp: Date.now() });
  return data;
};

const writeFileCached = (path, data) => {
  fs.writeFileSync(path, data, 'utf8');
  fileCache.set(path, { data, timestamp: Date.now() });
};

const updateNoteExpiry = (uuid, ttl = DEFAULT_TTL) => {
  const metaPath = getNoteMetaPath(uuid)
  const now = Date.now();
  const meta = {
    uuid: uuid,
    createdAt: now,
    expiresAt: now + ttl,
    lastAccessed: now,
    ttl: Math.min(Math.max(ttl, MIN_TTL), MAX_TTL)
  }
  
  writeFileCached(metaPath, JSON.stringify(meta))
}

const getNoteMeta = (uuid) => {
  const metaPath = getNoteMetaPath(uuid)
  const data = readFileCached(metaPath);
  return data ? JSON.parse(data) : null;
}

const isValidUUID = (uuid) => {
  // Optimized UUID validation without regex for speed
  if (typeof uuid !== 'string' || uuid.length !== 36) return false;
  
  const parts = uuid.split('-');
  if (parts.length !== 5) return false;
  
  return parts[0].length === 8 && 
         parts[1].length === 4 && 
         parts[2].length === 4 && 
         parts[3].length === 4 && 
         parts[4].length === 12;
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

// Pre-compiled HTML template parts for faster rendering
const HTML_TEMPLATE = {
  header: `<!DOCTYPE html>
<html data-theme="dark" lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>`,
  middle: ` - API GHICHU</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        /* Optimized CSS - Critical styles first */
        :root {
            --primary: #6366f1; --primary-dark: #4f46e5; --primary-light: #8b5cf6;
            --secondary: #f472b6; --accent: #06d6a0; --danger: #ef4444; --warning: #f59e0b;
            --bg-dark: #0f172a; --surface-dark: #1e293b; --surface-light-dark: #334155;
            --text-dark: #f1f5f9; --text-secondary-dark: #94a3b8; --border-dark: #334155;
            --bg-light: #ffffff; --surface-light: #f8fafc; --surface-light-light: #e2e8f0;
            --text-light: #1e293b; --text-secondary-light: #64748b; --border-light: #cbd5e1;
        }
        
        [data-theme="dark"] {
            --bg: var(--bg-dark); --surface: var(--surface-dark); 
            --surface-light: var(--surface-light-dark); --text: var(--text-dark);
            --text-secondary: var(--text-secondary-dark); --border: var(--border-dark);
        }
        
        [data-theme="light"] {
            --bg: var(--bg-light); --surface: var(--surface-light);
            --surface-light: var(--surface-light-light); --text: var(--text-light);
            --text-secondary: var(--text-secondary-light); --border: var(--border-light);
        }
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', system-ui, sans-serif; background: var(--bg); color: var(--text); 
               height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
        
        /* Critical mobile-first styles */
        .editor-header { background: var(--surface); border-bottom: 1px solid var(--border); 
                        padding: 0.5rem; position: sticky; top: 0; z-index: 100; }
        
        .header-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; }
        .header-left { display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 0; }
        .logo { width: 28px; height: 28px; background: linear-gradient(135deg, var(--primary), var(--primary-light));
                border-radius: 6px; display: flex; align-items: center; justify-content: center; 
                font-size: 0.8rem; color: white; flex-shrink: 0; }
        
        .editor-info { min-width: 0; flex: 1; }
        .editor-info h1 { font-size: 0.9rem; font-weight: 600; margin-bottom: 0.1rem; 
                         white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .editor-subtitle { font-size: 0.7rem; color: var(--text-secondary); display: flex; 
                          align-items: center; gap: 0.3rem; flex-wrap: wrap; }
        
        .note-id { font-family: 'Courier New', monospace; background: var(--surface-light);
                  padding: 0.1rem 0.3rem; border-radius: 3px; font-size: 0.65rem; 
                  border: 1px solid var(--border); max-width: 100px; overflow: hidden; text-overflow: ellipsis; }
        
        .header-right { display: flex; align-items: center; gap: 0.3rem; flex-shrink: 0; }
        
        .info-bar { display: flex; justify-content: space-between; align-items: center; 
                   gap: 0.5rem; padding: 0.3rem 0; border-top: 1px solid var(--border); flex-wrap: wrap; }
        .info-left { display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 0; }
        .info-item { display: flex; align-items: center; gap: 0.3rem; color: var(--text-secondary); 
                    font-size: 0.7rem; white-space: nowrap; }
        
        .status-indicator { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }
        .status-indicator.saving { background: var(--warning); }
        .status-indicator.error { background: var(--danger); }
        
        .file-stats { font-family: 'Courier New', monospace; font-size: 0.65rem; }
        .expiry-info { background: var(--surface-light); padding: 0.1rem 0.3rem; 
                      border-radius: 3px; border: 1px solid var(--border); font-size: 0.65rem; }
        
        .controls-bar { display: flex; align-items: center; gap: 0.5rem; justify-content: space-between; 
                       flex-wrap: wrap; margin-top: 0.3rem; }
        .control-group { display: flex; align-items: center; gap: 0.3rem; background: var(--surface-light);
                        padding: 0.3rem 0.5rem; border-radius: 4px; border: 1px solid var(--border); flex: 1; }
        .control-label { font-size: 0.7rem; color: var(--text-secondary); white-space: nowrap; }
        
        .ttl-select { background: var(--bg); color: var(--text); border: 1px solid var(--border);
                     padding: 0.2rem 0.4rem; border-radius: 3px; font-size: 0.7rem; flex: 1; }
        
        .btn-group { display: flex; align-items: center; gap: 0.3rem; flex-shrink: 0; }
        .btn { background: var(--primary); color: white; border: none; padding: 0.3rem 0.6rem;
               border-radius: 4px; cursor: pointer; font-size: 0.7rem; font-weight: 500;
               display: flex; align-items: center; gap: 0.3rem; transition: none; text-decoration: none; }
        .btn-secondary { background: var(--surface-light); color: var(--text); border: 1px solid var(--border); }
        .btn-danger { background: var(--danger); }
        .btn-success { background: var(--accent); }
        
        .editor-container { display: flex; flex: 1; overflow: hidden; background: var(--bg); }
        .line-numbers { background: var(--surface); color: var(--text-secondary); padding: 0.5rem 0.3rem;
                       text-align: right; user-select: none; border-right: 1px solid var(--border);
                       overflow: hidden; min-width: 40px; font-family: 'Courier New', monospace;
                       font-size: 0.75rem; line-height: 1.4; flex-shrink: 0; }
        .line-number { height: 1.4rem; display: flex; align-items: center; justify-content: flex-end; }
        
        .editor-content { flex: 1; display: flex; position: relative; background: var(--bg); min-width: 0; }
        .editor-textarea { width: 100%; height: 100%; background: transparent; color: var(--text);
                          border: none; resize: none; outline: none; padding: 0.5rem;
                          font-family: 'Courier New', monospace; font-size: 0.8rem; line-height: 1.4;
                          white-space: pre; overflow: auto; tab-size: 4; min-width: 0; }
        
        /* Desktop enhancements */
        @media (min-width: 768px) {
            .editor-header { padding: 0.75rem 1rem; }
            .logo { width: 32px; height: 32px; font-size: 0.9rem; }
            .editor-info h1 { font-size: 1rem; }
            .editor-subtitle, .note-id { font-size: 0.75rem; }
            .note-id { max-width: 120px; }
            .header-right { gap: 0.5rem; }
            .btn { padding: 0.4rem 0.8rem; font-size: 0.75rem; }
            .btn-text { display: inline; }
            .line-numbers { min-width: 50px; padding: 1rem 0.5rem; }
            .editor-textarea { padding: 1rem; font-size: 0.85rem; }
        }
    </style>
</head>
<body>
    <div class="editor-header">
        <div class="header-top">
            <div class="header-left">
                <div class="logo">📝</div>
                <div class="editor-info">
                    <h1>`,
  title: `</h1>
                    <div class="editor-subtitle">
                        <span>Auto-save • </span>
                        <span class="note-id">`,
  uuid_display: `</span>
                        <span id="languageBadge" class="language-badge" style="display: none;">Text</span>
                    </div>
                </div>
            </div>
            
            <div class="header-right">
                <button class="btn btn-secondary" id="themeToggle" title="Chuyển đổi giao diện">
                    <i class="fas fa-palette"></i>
                    <span class="btn-text">Giao diện</span>
                </button>
                
                <a href="/raw/`,
  raw_link: `" class="btn btn-secondary" target="_blank" title="Xem nội dung raw">
                    <i class="fas fa-code"></i>
                    <span class="btn-text">Raw</span>
                </a>
                
                <button class="btn btn-danger" id="deleteBtn" title="Xóa ghi chú này">
                    <i class="fas fa-trash"></i>
                    <span class="btn-text">Xóa</span>
                </button>
            </div>
        </div>
        
        <div class="info-bar">
            <div class="info-left">
                <div class="info-item">
                    <span id="statusIndicator" class="status-indicator"></span>
                    <span id="statusText">Sẵn sàng</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-clock"></i>
                    <span id="expiryInfo">Hết hạn sau: 24 giờ</span>
                </div>
                <div class="info-item file-stats" id="fileStats">-</div>
                <div class="info-item">
                    <i class="fas fa-arrows-alt-h"></i>
                    <span id="cursorPosition">Dòng 1, Cột 1</span>
                </div>
            </div>
        </div>
        
        <div class="controls-bar">
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
            
            <div class="btn-group">
                <button class="btn btn-success" id="saveBtn" title="Lưu thủ công (Ctrl+S)">
                    <i class="fas fa-save"></i>
                    <span class="btn-text">Lưu</span>
                </button>
            </div>
        </div>
    </div>
    
    <div class="editor-container">
        <div class="line-numbers" id="lineNumbers"><div class="line-number">1</div></div>
        <div class="editor-content">
            <textarea 
                id="editor" 
                class="editor-textarea" 
                placeholder="Bắt đầu nhập nội dung ghi chú của bạn..."
                spellcheck="false"
            >`,
  content: `</textarea>
        </div>
    </div>

    <script>
        // Optimized JavaScript - Minimal and fast
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
        const html = document.documentElement;
        
        const NOTE_UUID = '`,
  js_uuid: `';
        let currentTtl = `,
  js_ttl: `;
        let autoSaveTimeout;
        let isContentChanged = false;
        let originalContent = editor.value;

        // Initialize
        ttlSelect.value = currentTtl.toString();

        // Theme handling
        function toggleTheme() {
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('editor-theme', newTheme);
        }
        themeToggle.addEventListener('click', toggleTheme);
        const savedTheme = localStorage.getItem('editor-theme') || 'dark';
        html.setAttribute('data-theme', savedTheme);

        // Line numbers - Fixed and optimized
        function updateLineNumbers() {
            const lines = editor.value.split('\\\\n');
            let numbersHTML = '';
            
            for (let i = 0; i < lines.length; i++) {
                numbersHTML += '<div class="line-number">' + (i + 1) + '</div>';
            }
            
            lineNumbers.innerHTML = numbersHTML;
        }

        // Cursor position
        function updateCursorPosition() {
            const text = editor.value;
            const position = editor.selectionStart;
            const lines = text.substr(0, position).split('\\\\n');
            cursorPosition.textContent = 'Dòng ' + lines.length + ', Cột ' + (lines[lines.length - 1].length + 1);
        }

        // File stats - Fixed to match line numbers
        function updateFileStats() {
            const content = editor.value;
            const lines = content.split('\\\\n').length;
            const words = content.trim() ? content.trim().split(/\\\\s+/).length : 0;
            const chars = content.length;
            fileStats.textContent = lines + ' dòng • ' + words + ' từ • ' + chars + ' ký tự';
        }

        // Save function
        function saveNote() {
            if (!isContentChanged) return;

            statusIndicator.classList.add('saving');
            statusText.textContent = 'Đang lưu...';
            
            fetch('/edit/' + NOTE_UUID + '?ttl=' + currentTtl, {
                method: 'PUT',
                headers: { 'Content-Type': 'text/plain; charset=utf-8' },
                body: editor.value,
            }).then(response => {
                if (response.ok) {
                    statusIndicator.classList.remove('saving');
                    statusText.textContent = 'Đã lưu';
                    isContentChanged = false;
                    originalContent = editor.value;
                    setTimeout(() => { if (statusText.textContent === 'Đã lưu') statusText.textContent = 'Sẵn sàng'; }, 2000);
                } else throw new Error('Save failed');
            }).catch(error => {
                statusIndicator.classList.add('error');
                statusText.textContent = 'Lỗi lưu';
            });
        }

        // Event handlers
        function handleContentChange() {
            updateLineNumbers();
            updateCursorPosition();
            updateFileStats();

            if (editor.value !== originalContent) {
                isContentChanged = true;
                clearTimeout(autoSaveTimeout);
                autoSaveTimeout = setTimeout(saveNote, 1000);
            }
        }

        editor.addEventListener('input', handleContentChange);
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
        editor.addEventListener('scroll', () => { lineNumbers.scrollTop = editor.scrollTop; });

        deleteBtn.addEventListener('click', () => {
            if (confirm('Xóa ghi chú này?')) {
                fetch('/edit/' + NOTE_UUID, { method: 'DELETE' }).then(() => {
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
            expiryInfo.textContent = 'Hết hạn sau: ' + ttlSelect.options[ttlSelect.selectedIndex].text;
            if (isContentChanged) {
                clearTimeout(autoSaveTimeout);
                autoSaveTimeout = setTimeout(saveNote, 500);
            }
        });

        // Initial setup
        updateLineNumbers();
        updateCursorPosition();
        updateFileStats();
        expiryInfo.textContent = 'Hết hạn sau: ' + ttlSelect.options[ttlSelect.selectedIndex].text;
        statusIndicator.style.backgroundColor = '#06d6a0';
        editor.focus();
    </script>
</body>
</html>`
};

const getEditorHTML = (uuid, content, currentTTL) => {
  const escapedContent = content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const title = content ? 'Chỉnh sửa: ' + uuid : 'Ghi chú mới';
  
  // Build HTML using pre-compiled template for maximum speed
  return HTML_TEMPLATE.header + 
         title + 
         HTML_TEMPLATE.middle + 
         uuid + 
         HTML_TEMPLATE.title + 
         uuid + 
         HTML_TEMPLATE.uuid_display + 
         uuid + 
         HTML_TEMPLATE.raw_link + 
         uuid + 
         HTML_TEMPLATE.content + 
         escapedContent + 
         HTML_TEMPLATE.js_uuid + 
         uuid + 
         HTML_TEMPLATE.js_ttl + 
         currentTTL + 
         HTML_TEMPLATE.js_uuid + 
         uuid + 
         HTML_TEMPLATE.content;
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

      // Fast UUID validation
      if (!isValidUUID(uuid)) {
        if (action === 'edit') {
          return res.redirect(`/edit/${uuidv4()}`)
        } else {
          return res.status(400).json({ error: 'Invalid UUID format' })
        }
      }

      const contentPath = getNoteContentPath(uuid)
      
      if (action === 'raw') {
        const content = readFileCached(contentPath);
        if (!content) {
          return res.status(404).json({ error: 'Note not found' })
        }
        
        // Update last accessed time asynchronously
        setImmediate(() => {
          try {
            const meta = getNoteMeta(uuid);
            if (meta) {
              meta.lastAccessed = Date.now();
              writeFileCached(getNoteMetaPath(uuid), JSON.stringify(meta, null, 2));
            }
          } catch (e) {
            // Silent fail for performance
          }
        });
        
        res.set("content-type", "text/plain; charset=utf-8")
        res.set("Cache-Control", "no-cache")
        res.end(content)
        return
      }

      if (action === 'edit') {
        const content = readFileCached(contentPath) || '';
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
        writeFileCached(contentPath, content)
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

        // Clear cache
        fileCache.delete(contentPath);
        fileCache.delete(metaPath);

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
