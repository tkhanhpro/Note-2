const fs = require("fs")
const path = require("path")

const notesDir = path.join(__dirname, "../note")

if (!fs.existsSync(notesDir)) {
  fs.mkdirSync(notesDir, { recursive: true })
}

// Cleanup configuration
const CLEANUP_CONFIG = {
  enabled: true,
  checkInterval: 24 * 60 * 60 * 1000, // 24 hours
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  immediateCleanup: false
}

// Auto cleanup function
const cleanupOldNotes = () => {
  if (!CLEANUP_CONFIG.enabled) return

  try {
    const files = fs.readdirSync(notesDir)
    const now = Date.now()
    let cleanedCount = 0

    files.forEach(file => {
      if (file.endsWith('.txt')) {
        const filePath = path.join(notesDir, file)
        const stats = fs.statSync(filePath)
        const age = now - stats.mtime.getTime()

        if (age > CLEANUP_CONFIG.maxAge) {
          fs.unlinkSync(filePath)
          cleanedCount++
          
          // Clean up associated .raw file if exists
          const rawFilePath = filePath + '.raw'
          if (fs.existsSync(rawFilePath)) {
            fs.unlinkSync(rawFilePath)
          }
        }
      }
    })

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} old notes`)
    }
  } catch (error) {
    console.error('Cleanup error:', error)
  }
}

// Run cleanup on startup if enabled
if (CLEANUP_CONFIG.immediateCleanup) {
  cleanupOldNotes()
}

// Schedule periodic cleanup
setInterval(cleanupOldNotes, CLEANUP_CONFIG.checkInterval)

module.exports = {
  info: {
    path: "/:UUID",
    title: "Note API",
    desc: "API for creating and retrieving notes",
    example_url: [
      { method: "GET", query: "/:UUID", desc: "Retrieve a note" },
      { method: "PUT", query: "/:UUID", desc: "Create or update a note" },
    ],
  },
  methods: {
    get: (req, res) => {
      const uuid = req.params.UUID

      // Redirect to new UUID if invalid
      if (!uuid || uuid === ":UUID" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid)) {
        const { v4: uuidv4 } = require('uuid')
        res.redirect(`/${uuidv4()}`)
        return
      }

      const filePath = path.join(notesDir, `${uuid}.txt`)
      
      // Handle raw file redirection
      if (fs.existsSync(filePath + ".raw")) {
        const rawFilePath = fs.readFileSync(filePath + ".raw", "utf8")
        if (fs.existsSync(rawFilePath)) {
          res.set("content-type", "text/plain")
          res.end(fs.readFileSync(rawFilePath, "utf8"))
          return
        }
      }

      const text = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : ""

      // Return raw content for API clients or raw query
      if (req.query.raw === "true" || !/^Mozilla/.test(req.headers["user-agent"])) {
        res.set("content-type", "text/plain")
        res.end(text)
        return
      }

      // Return HTML editor for browsers
      res.set("content-type", "text/html")
      res.end(`<!DOCTYPE html>
<html data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VS Code Note Editor - ${uuid}</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📝</text></svg>">
    <style>
        :root {
            /* Light theme */
            --bg-light: #ffffff;
            --editor-bg-light: #f8f9fa;
            --text-light: #2c3e50;
            --line-numbers-light: #6c757d;
            --line-numbers-bg-light: #e9ecef;
            --border-light: #dee2e6;
            --header-bg-light: #f1f3f4;
            --header-text-light: #495057;
            --active-line-light: #e3f2fd;
            --scrollbar-light: #c1c1c1;
            --accent-light: #007bff;
            
            /* Dark theme */
            --bg-dark: #1a1a1a;
            --editor-bg-dark: #1e1e1e;
            --text-dark: #e9ecef;
            --line-numbers-dark: #6c757d;
            --line-numbers-bg-dark: #252526;
            --border-dark: #404040;
            --header-bg-dark: #2d2d30;
            --header-text-dark: #cccccc;
            --active-line-dark: #2a2d2e;
            --scrollbar-dark: #424242;
            --accent-dark: #0d6efd;
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
            --accent: var(--accent-light);
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
            --accent: var(--accent-dark);
        }
        
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', 'SF Mono', Monaco, 'Cascadia Code', Consolas, monospace;
        }
        
        body {
            margin: 0;
            padding: 0;
            background: var(--bg);
            color: var(--text);
            height: 100vh;
            display: flex;
            flex-direction: column;
            transition: all 0.3s ease;
        }
        
        .editor-header {
            background: var(--header-bg);
            color: var(--header-text);
            padding: 12px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border);
            backdrop-filter: blur(10px);
        }
        
        .header-left {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        
        .editor-icon {
            font-size: 20px;
        }
        
        .editor-title {
            font-size: 16px;
            font-weight: 600;
        }
        
        .editor-subtitle {
            font-size: 12px;
            opacity: 0.7;
            margin-top: 2px;
        }
        
        .note-info {
            background: var(--accent);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
        }
        
        .header-actions {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .theme-toggle, .action-btn {
            background: transparent;
            border: 1px solid var(--border);
            color: var(--text);
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s ease;
        }
        
        .theme-toggle:hover, .action-btn:hover {
            background: var(--active-line);
            transform: translateY(-1px);
        }
        
        .editor-container {
            display: flex;
            flex-grow: 1;
            overflow: hidden;
            position: relative;
        }
        
        .line-numbers {
            background: var(--line-numbers-bg);
            color: var(--line-numbers);
            padding: 12px 8px 12px 16px;
            text-align: right;
            user-select: none;
            border-right: 1px solid var(--border);
            overflow: hidden;
            min-width: 50px;
            font-size: 13px;
            line-height: 20px;
        }
        
        .line-number {
            height: 20px;
            font-feature-settings: "tnum";
        }
        
        .editor-content {
            flex-grow: 1;
            display: flex;
            position: relative;
        }
        
        .editor-textarea {
            width: 100%;
            height: 100%;
            background: var(--editor-bg);
            color: var(--text);
            border: none;
            resize: none;
            outline: none;
            padding: 12px 16px;
            font-size: 14px;
            line-height: 20px;
            white-space: pre;
            overflow: auto;
            tab-size: 4;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', Consolas, monospace;
        }
        
        .editor-textarea::placeholder {
            color: var(--line-numbers);
            opacity: 0.6;
        }
        
        .editor-textarea:focus {
            outline: none;
        }
        
        /* Enhanced scrollbar */
        .editor-textarea::-webkit-scrollbar {
            width: 16px;
            height: 16px;
        }
        
        .editor-textarea::-webkit-scrollbar-thumb {
            background: var(--scrollbar);
            border-radius: 8px;
            border: 4px solid var(--editor-bg);
        }
        
        .editor-textarea::-webkit-scrollbar-track {
            background: var(--editor-bg);
        }
        
        .editor-textarea::-webkit-scrollbar-corner {
            background: var(--editor-bg);
        }
        
        .status-bar {
            background: var(--header-bg);
            color: var(--line-numbers);
            padding: 8px 16px;
            font-size: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top: 1px solid var(--border);
            gap: 20px;
        }
        
        .status-left {
            display: flex;
            align-items: center;
            gap: 20px;
        }
        
        .status-item {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .status-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #28a745;
            transition: all 0.3s ease;
        }
        
        .status-indicator.saving {
            background: #ffc107;
            animation: pulse 1.5s infinite;
        }
        
        .status-indicator.error {
            background: #dc3545;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .language-badge {
            background: var(--accent);
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: 500;
        }
        
        .copy-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--accent);
            color: white;
            padding: 12px 16px;
            border-radius: 6px;
            font-size: 14px;
            z-index: 1000;
            transform: translateX(150%);
            transition: transform 0.3s ease;
        }
        
        .copy-notification.show {
            transform: translateX(0);
        }
        
        @media (max-width: 768px) {
            .editor-header {
                padding: 8px 12px;
            }
            
            .header-left {
                flex-direction: column;
                align-items: flex-start;
                gap: 4px;
            }
            
            .editor-title {
                font-size: 14px;
            }
            
            .theme-toggle span {
                display: none;
            }
            
            .status-bar {
                padding: 6px 12px;
                font-size: 11px;
            }
        }
    </style>
</head>
<body>
    <div class="editor-header">
        <div class="header-left">
            <div class="editor-icon">📝</div>
            <div>
                <h1 class="editor-title">VS Code Note Editor</h1>
                <div class="editor-subtitle">Changes are saved automatically • ID: <span class="note-info">${uuid}</span></div>
            </div>
        </div>
        <div class="header-actions">
            <button class="action-btn" id="copyBtn" title="Copy Note URL">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Copy URL</span>
            </button>
            <button class="theme-toggle" id="themeToggle">
                <svg id="theme-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
                <span id="theme-text">Light Mode</span>
            </button>
        </div>
    </div>
    
    <div class="editor-container">
        <div class="line-numbers" id="lineNumbers">
            <div class="line-number">1</div>
        </div>
        <div class="editor-content">
            <textarea id="editor" class="editor-textarea" placeholder="Start typing your note...&#10;Supports auto-save, syntax highlighting, and more!&#10;&#10;Shortcuts:&#10;• Ctrl+S: Manual save&#10;• Tab: Indent&#10;• Shift+Tab: Unindent" spellcheck="false"></textarea>
        </div>
    </div>
    
    <div class="status-bar">
        <div class="status-left">
            <div class="status-item">
                <span id="statusIndicator" class="status-indicator"></span>
                <span id="statusText">Ready</span>
            </div>
            <div class="status-item">
                <span id="cursorPosition">Ln 1, Col 1</span>
            </div>
            <div class="status-item">
                <span id="fileStats">0 lines • 0 words • 0 chars</span>
            </div>
        </div>
        <div class="status-item">
            <span class="language-badge" id="languageBadge">TEXT</span>
        </div>
    </div>
    
    <div class="copy-notification" id="copyNotification">URL copied to clipboard!</div>
    
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
        const languageBadge = document.getElementById('languageBadge');
        const copyBtn = document.getElementById('copyBtn');
        const copyNotification = document.getElementById('copyNotification');
        const html = document.documentElement;
        
        let saveTimeout;
        let isSaving = false;
        
        // Theme management
        const initTheme = () => {
            const savedTheme = localStorage.getItem('editor-theme') || 'dark';
            html.setAttribute('data-theme', savedTheme);
            updateThemeButton(savedTheme);
        };
        
        const updateThemeButton = (theme) => {
            if (theme === 'light') {
                themeText.textContent = 'Dark Mode';
                themeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
            } else {
                themeText.textContent = 'Light Mode';
                themeIcon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
            }
        };
        
        themeToggle.addEventListener('click', () => {
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('editor-theme', newTheme);
            updateThemeButton(newTheme);
        });
        
        // Line numbers
        const updateLineNumbers = () => {
            const lines = editor.value.split('\\n');
            lineNumbers.innerHTML = '';
            
            lines.forEach((_, i) => {
                const lineNumber = document.createElement('div');
                lineNumber.className = 'line-number';
                lineNumber.textContent = i + 1;
                lineNumbers.appendChild(lineNumber);
            });
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
            const text = editor.value;
            const lines = text.split('\\n').length;
            const words = text.trim() ? text.trim().split(/\\s+/).length : 0;
            const chars = text.length;
            
            fileStats.textContent = \`\${lines} lines • \${words} words • \${chars} chars\`;
        };
        
        // Language detection
        const detectLanguage = (content) => {
            if (!content.trim()) return 'TEXT';
            
            const firstLines = content.toLowerCase().split('\\n').slice(0, 5).join(' ');
            
            const patterns = {
                'HTML': [/<!doctype/i, /<html/i, /<head/i, /<body/i],
                'PHP': [/<?php/i, /\\$\\w+/],
                'PYTHON': [/^def\\s+\\w+\\s*\\(/m, /^import\\s+\\w+/m, /^from\\s+\\w+\\s+import/m],
                'JAVASCRIPT': [/function\\s+\\w+\\s*\\(/i, /const\\s+\\w+/i, /let\\s+\\w+/i, /var\\s+\\w+/i],
                'TYPESCRIPT': [/interface\\s+\\w+/i, /type\\s+\\w+/i, /enum\\s+\\w+/i],
                'JAVA': [/public\\s+class\\s+\\w+/i, /import\\s+java\\./i],
                'CPP': [/#include\\s*</i, /namespace\\s+std/i],
                'SQL': [/select\\s+.*\\s+from/i, /insert\\s+into/i],
                'JSON': [/^\\s*\\{/, /^\\s*\\[/],
                'MARKDOWN': [/^#+\\s/m, /\\*\\*.*\\*\\*/m],
                'CSS': [/\\w+\\s*\\{[^}]*\\}/m]
            };
            
            for (const [lang, langPatterns] of Object.entries(patterns)) {
                if (langPatterns.some(pattern => pattern.test(firstLines))) {
                    return lang;
                }
            }
            
            return 'TEXT';
        };
        
        const updateLanguageBadge = () => {
            const language = detectLanguage(editor.value);
            languageBadge.textContent = language;
        };
        
        // Auto-save functionality
        const saveNote = async () => {
            if (isSaving) return;
            
            isSaving = true;
            statusIndicator.classList.add('saving');
            statusText.textContent = 'Saving...';
            
            try {
                await fetch(location.href, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'text/plain; charset=utf-8',
                    },
                    body: editor.value,
                });
                
                statusIndicator.classList.remove('saving');
                statusText.textContent = 'Saved';
                
                setTimeout(() => {
                    if (!isSaving) {
                        statusText.textContent = 'Ready';
                    }
                }, 2000);
            } catch (error) {
                statusIndicator.classList.add('error');
                statusText.textContent = 'Save failed';
                console.error('Save error:', error);
                
                setTimeout(() => {
                    statusIndicator.classList.remove('error');
                    statusText.textContent = 'Ready';
                }, 3000);
            } finally {
                isSaving = false;
            }
        };
        
        // Input handling
        const handleInput = () => {
            updateLineNumbers();
            updateCursorPosition();
            updateFileStats();
            updateLanguageBadge();
            
            if (saveTimeout) clearTimeout(saveTimeout);
            saveTimeout = setTimeout(saveNote, 1000);
        };
        
        editor.addEventListener('input', handleInput);
        
        // Tab support
        editor.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = editor.selectionStart;
                const end = editor.selectionEnd;
                
                if (e.shiftKey) {
                    // Unindent
                    const beforeCursor = editor.value.substring(0, start);
                    const lines = beforeCursor.split('\\n');
                    const currentLine = lines[lines.length - 1];
                    
                    if (currentLine.startsWith('    ')) {
                        lines[lines.length - 1] = currentLine.substring(4);
                        const newValue = lines.join('\\n') + editor.value.substring(end);
                        editor.value = newValue;
                        editor.selectionStart = editor.selectionEnd = start - 4;
                        handleInput();
                    }
                } else {
                    // Indent
                    const newValue = editor.value.substring(0, start) + '    ' + editor.value.substring(end);
                    editor.value = newValue;
                    editor.selectionStart = editor.selectionEnd = start + 4;
                    handleInput();
                }
            }
            
            // Manual save with Ctrl+S
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                clearTimeout(saveTimeout);
                saveNote();
            }
        });
        
        editor.addEventListener('click', updateCursorPosition);
        editor.addEventListener('keyup', updateCursorPosition);
        
        // Copy URL functionality
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(location.href);
                copyNotification.classList.add('show');
                setTimeout(() => {
                    copyNotification.classList.remove('show');
                }, 2000);
            } catch (err) {
                console.error('Copy failed:', err);
            }
        });
        
        // Sync scroll
        editor.addEventListener('scroll', () => {
            lineNumbers.scrollTop = editor.scrollTop;
        });
        
        // Load initial content
        const loadContent = async () => {
            try {
                const url = new URL(location.href);
                url.searchParams.set('raw', 'true');
                
                const response = await fetch(url.href);
                const content = await response.text();
                
                editor.value = content;
                handleInput();
            } catch (error) {
                console.error('Load error:', error);
            }
        };
        
        // Initialize
        initTheme();
        loadContent();
    </script>
</body>
</html>`)
    },
    put: async (req, res) => {
      const chunks = []

      req.on("data", (chunk) => chunks.push(chunk))
      await new Promise((resolve) => req.on("end", resolve))

      const uuid = req.params.UUID
      const filePath = path.join(notesDir, `${uuid}.txt`)

      if (req.query.raw) {
        if (!fs.existsSync(filePath + ".raw")) {
          fs.writeFileSync(filePath + ".raw", path.join(notesDir, `${req.query.raw}.txt`))
        }
      } else {
        fs.writeFileSync(filePath, Buffer.concat(chunks))
      }

      res.end()
    },
  },
}
