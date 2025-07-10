const fs = require('fs');
const path = require('path');

const notesDir = path.join(__dirname, '../note');

if (!fs.existsSync(notesDir)) {
    fs.mkdirSync(notesDir, { recursive: true });
}

module.exports = {
    info: {
        path: '/note/:UUID',
        title: 'Note API',
        desc: 'API for creating and retrieving notes',
        example_url: [
            { method: 'GET', query: '/note/:UUID', desc: 'Retrieve a note' },
            { method: 'PUT', query: '/note/:UUID', desc: 'Create or update a note' }
        ]
    },
    methods: {
        get: (req, res) => {
            try {
                const uuid = req.params.UUID;

                if (!uuid || uuid === ':UUID' || uuid === 'new') {
                    res.redirect(`./${require('uuid').v4()}`);
                    return;
                }

                const filePath = path.join(notesDir, `${uuid}.txt`);
                const text = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';

                if (fs.existsSync(filePath + '.raw')) {
                    const rawFilePath = fs.readFileSync(filePath + '.raw', 'utf8');
                    if (fs.existsSync(rawFilePath)) {
                        res.set('content-type', 'text/plain');
                        res.end(fs.readFileSync(rawFilePath, 'utf8'));
                        return;
                    } else {
                        res.status(404).end();
                        return;
                    }
                }

                if (req.query.raw === 'true' || !/^Mozilla/.test(req.headers['user-agent'])) {
                    res.set('content-type', 'text/plain');
                    res.end(text);
                    return;
                }

                res.set('content-type', 'text/html');
                res.end(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Note by TKhanh - Nakano Miku</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/dracula.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Fira+Code:wght@400&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #f9f6ef;
            animation: fadeIn 0.6s ease-in-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes gradientShift {
            0% { border-color: #fce7ec; }
            50% { border-color: #e6f3ff; }
            100% { border-color: #fce7ec; }
        }
        nav {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(8px);
            border-bottom: 1px solid #e2e8f0;
        }
        .action-button {
            background-color: #fce7ec;
            color: #4a5568;
            transition: all 0.2s ease;
            border: 2px solid transparent;
            animation: gradientShift 10s ease infinite;
        }
        .action-button:hover {
            background-color: #f8c1cc;
            transform: scale(1.02);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .editor-container {
            display: flex;
            border-radius: 0.5rem;
            overflow: hidden;
            border: 2px solid transparent;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(8px);
            animation: gradientShift 10s ease infinite;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        .line-numbers {
            counter-reset: line;
            padding: 1rem;
            background: #2b2a33;
            color: #fce7ec;
            text-align: right;
            border-right: 1px solid #e2e8f0;
            min-width: 3rem;
        }
        .line-numbers div:before {
            counter-increment: line;
            content: counter(line);
            display: block;
        }
        textarea {
            font-family: 'Fira Code', monospace;
            background: #2b2a33;
            color: #f8f8f2;
            border: none;
            outline: none;
            resize: none;
            white-space: pre;
            overflow-wrap: normal;
            scroll-behavior: smooth;
            min-height: 70vh;
            font-size: 0.875rem;
        }
        textarea:focus {
            box-shadow: 0 0 0 2px #e6f3ff;
        }
        .status {
            background: rgba(255, 255, 255, 0.8);
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            color: #4a5568;
        }
        .status.typing { color: #f8c1cc; }
        .status.saving { color: #a3bffa; }
        .status.saved { color: #b4f8c8; }
        .status.error { color: #ff6b6b; }
        footer {
            background-color: #e6f3ff;
            color: #4a5568;
        }
    </style>
</head>
<body class="min-h-screen flex flex-col">
    <nav class="p-4">
        <div class="max-w-6xl mx-auto flex justify-between items-center">
            <h1 class="text-xl font-semibold text-gray-800">Note by TKhanh</h1>
            <a href="/" class="action-button px-4 py-1.5 rounded-md text-sm font-medium">Home</a>
        </div>
    </nav>
    <main class="flex-grow max-w-6xl mx-auto p-4">
        <div class="editor-container">
            <div class="line-numbers"></div>
            <textarea id="editor" class="flex-1 p-4 text-sm" placeholder="Start typing your note...">${text}</textarea>
        </div>
        <p id="status" class="status saved text-sm mt-2">Đã lưu</p>
    </main>
    <footer class="p-4">
        <div class="max-w-6xl mx-auto text-center text-sm">
            © 2025 Note App by TKhanh - Inspired by Nakano Miku
        </div>
    </footer>
    <script>
        const input = document.querySelector('#editor');
        const lines = document.querySelector('.line-numbers');
        const status = document.querySelector('#status');

        function updateLines() {
            const texts = input.value.split('\n');
            lines.innerHTML = texts.map((_, i) => `<div>${i + 1}</div>`).join('');
        }

        function put() {
            status.textContent = 'Đang lưu';
            status.className = 'status saving';
            return fetch(location.href, {
                method: 'PUT',
                headers: {
                    'content-type': 'text/plain; charset=utf-8'
                },
                body: input.value
            }).then(() => {
                status.textContent = 'Đã lưu';
                status.className = 'status saved';
            }).catch(err => {
                status.textContent = 'Lỗi khi lưu';
                status.className = 'status error';
                console.error('Save error:', err);
            });
        }

        let putTimeout;
        const u = new URL(location.href);
        u.searchParams.append('raw', 'true');

        fetch(u.href, { method: 'GET', headers: { 'user-agent': 'fetch' } })
            .then(r => r.text())
            .then(t => {
                input.value = t;
                updateLines();
                hljs.highlightElement(input);
                input.addEventListener('input', () => {
                    status.textContent = 'Đang nhập';
                    status.className = 'status typing';
                    if (putTimeout) clearTimeout(putTimeout);
                    putTimeout = setTimeout(put, 1000);
                    updateLines();
                    hljs.highlightElement(input);
                });
            })
            .catch(err => {
                status.textContent = 'Lỗi khi tải';
                status.className = 'status error';
                console.error('Load error:', err);
            });

        hljs.configure({ languages: ['javascript', 'python', 'html', 'css'] });
        hljs.highlightElement(input);
    </script>
</body>
</html>`);
            } catch (e) {
                console.error(`Error in api/note.js GET: ${e.message}`);
                res.status(500).end();
            }
        },
        put: async (req, res) => {
            try {
                const chunks = [];
                req.on('data', chunk => chunks.push(chunk));
                await new Promise(resolve => req.once('end', resolve));

                const uuid = req.params.UUID;
                const filePath = path.join(notesDir, `${uuid}.txt`);

                if (req.query.raw) {
                    if (!fs.existsSync(filePath + '.raw')) {
                        fs.writeFileSync(filePath + '.raw', path.join(notesDir, `${req.query.raw}.txt`));
                    }
                } else {
                    fs.writeFileSync(filePath, Buffer.concat(chunks));
                }

                res.end();
            } catch (e) {
                console.error(`Error in api/note.js PUT: ${e.message}`);
                res.status(500).end();
            }
        }
    }
};
