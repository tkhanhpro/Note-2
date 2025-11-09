const fs = require("fs")
const path = require("path")

const notesDir = path.join(__dirname, "../note")

if (!fs.existsSync(notesDir)) {
  fs.mkdirSync(notesDir, { recursive: true })
}

module.exports = {
  info: {
    path: "/note/:UUID",
    title: "Note API",
    desc: "API for creating and retrieving notes",
    example_url: [
      { method: "GET", query: "/note/:UUID", desc: "Retrieve a note" },
      { method: "PUT", query: "/note/:UUID", desc: "Create or update a note" },
    ],
  },
  methods: {
    get: (req, res) => {
      const uuid = req.params.UUID

      if (!uuid || uuid === ":UUID" || uuid.length > 36) {
        res.redirect(`./${require("uuid").v4()}`)
        return
      }

      const filePath = path.join(notesDir, `${uuid}.txt`)
      const text = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : ""

      if (fs.existsSync(filePath + ".raw")) {
        const rawFilePath = fs.readFileSync(filePath + ".raw", "utf8")

        if (fs.existsSync(rawFilePath)) {
          res.set("content-type", "text/plain")
          res.end(fs.readFileSync(rawFilePath, "utf8"))
          return
        } else {
          res.status(404).end()
          return
        }
      }

      if (req.query.raw == "true" || !/^Mozilla/.test(req.headers["user-agent"])) {
        res.set("content-type", "text/plain")
        res.end(text)
        return
      }

      res.set("content-type", "text/html")
      res.end(`<!DOCTYPE html>
<html data-theme="dark">
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VS Code Note Editor</title>
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
        
        .theme-toggle {
            background: none;
            border: 1px solid var(--border);
            color: var(--text);
            padding: 4px 8px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        
        .theme-toggle:hover {
            background-color: rgba(255, 255, 255, 0.1);
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
    </style>
</head>
<body>
    <div class="editor-header">
        <div>
            <h3 class="editor-title">Note Sevice</h3>
            <div class="editor-subtitle">Changes are automatically saved after 1s</div>
        </div>
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
    
    <div class="editor-container">
        <div class="line-numbers" id="lineNumbers"></div>
        <div class="editor-content">
            <textarea id="editor" class="editor-textarea" placeholder="Start typing..."></textarea>
        </div>
    </div>
    
    <div class="status-bar">
        <div class="status-item">
            <span id="statusIndicator" class="status-indicator"></span>
            <span id="statusText">Ready</span>
        </div>
        <div class="status-item">
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
        const html = document.documentElement;
        
        themeToggle.addEventListener('click', () => {
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', newTheme);
            
            if (newTheme === 'light') {
                themeText.textContent = 'Dark Mode';
                themeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
            } else {
                themeText.textContent = 'Light Mode';
                themeIcon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
            }
        });
        // số lượng line
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
        
        // cập nhật position
        const updateCursorPosition = () => {
            const text = editor.value;
            const position = editor.selectionStart;
            
            const lines = text.substr(0, position).split('\\n');
            const lineNumber = lines.length;
            const columnNumber = lines[lines.length - 1].length + 1;
            
            cursorPosition.textContent = 'Ln ' + lineNumber + ', Col ' + columnNumber;
        };
        
        let saveTimeout;
        const saveNote = () => {
            statusIndicator.classList.add('saving');
            statusText.textContent = 'Saving...';
            
            fetch(location.href, {
                method: 'PUT',
                headers: {
                    'content-type': 'text/plain; charset=utf-8',
                },
                body: editor.value,
            }).then(() => {
                statusIndicator.classList.remove('saving');
                statusText.textContent = 'Saved';
                
                setTimeout(() => {
                    statusText.textContent = 'Ready';
                }, 2000);
            });
        };
        
        editor.addEventListener('input', () => {
            updateLineNumbers();
            updateCursorPosition();
            
            if (saveTimeout) clearTimeout(saveTimeout);
            saveTimeout = setTimeout(saveNote, 1000);
        });
        
        editor.addEventListener('keydown', (e) => {
            // làm luôn cái tab cho giống =))
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = editor.selectionStart;
                const end = editor.selectionEnd;
                
                editor.value = editor.value.substring(0, start) + '    ' + editor.value.substring(end);
                editor.selectionStart = editor.selectionEnd = start + 4;
                
                updateLineNumbers();
                updateCursorPosition();
                
                if (saveTimeout) clearTimeout(saveTimeout);
                saveTimeout = setTimeout(saveNote, 1000);
            }
        });
        
        editor.addEventListener('click', updateCursorPosition);
        editor.addEventListener('keyup', updateCursorPosition);
        
        const u = new URL(location.href);
        u.searchParams.append('raw', 'true');
        
        fetch(u.href, { method: 'GET', headers: { 'user-agent': 'fetch' } })
            .then(r => r.text())
            .then(t => {
                editor.value = t;
                updateLineNumbers();
                updateCursorPosition();
            });

        editor.addEventListener('scroll', () => {
            lineNumbers.scrollTop = editor.scrollTop;
        });
    </script>
</body>
</html>
`)
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
