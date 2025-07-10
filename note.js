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

            if (req.query.raw == 'true' || !/^Mozilla/.test(req.headers['user-agent'])) {
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
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
            animation: fadeIn 0.8s ease-in-out;
            background: linear-gradient(45deg, #f9f6ef, #f8c1cc, #a3bffa);
            background-size: 200% 200%;
            animation: gradientShift 12s ease infinite;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        .line-numbers {
            counter-reset: line;
            padding: 1rem;
            background: #2b2a33;
            color: #f8c1cc;
            text-align: right;
            border-right: 2px solid #a3bffa;
            min-width: 3rem;
            transition: all 0.4s ease;
        }
        .line-numbers div {
            transition: opacity 0.4s ease, transform 0.4s ease;
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
            transition: all 0.4s ease;
            scroll-behavior: smooth;
            min-height: 70vh;
            font-size: 1rem;
        }
        textarea:focus {
            box-shadow: 0 0 0 4px rgba(163, 191, 250, 0.3);
            transform: scale(1.005);
        }
        .editor-container {
            display: flex;
            border-radius: 0.75rem;
            overflow: hidden;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
            animation: slideUp 0.6s ease-out;
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(12px);
        }
        .status {
            transition: all 0.4s ease;
            animation: pulse 0.6s ease-in-out;
            background: rgba(255, 255, 255, 0.15);
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            font-size: 0.9rem;
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.03); opacity: 0.8; }
        }
        .status.typing { color: #f8c1cc; }
        .status.saving { color: #a3bffa; }
        .status.saved { color: #b4f8c8; }
        .status.error { color: #ff6b6b; }
        nav {
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(12px);
        }
    </style>
</head>
<body class="min-h-screen flex flex-col">
    <nav class="p-4 border-b border-gray-200/20">
        <div class="max-w-7xl mx-auto flex justify-between items-center">
            <h1 class="text-2xl font-bold text-gray-800">Note by TKhanh</h1>
            <a href="/" class="bg-gradient-to-r from-pink-400 to-blue-400 text-white px-6 py-2 rounded-full hover:from-pink-500 hover:to-blue-500 transition transform hover:scale-105">Home</a>
        </div>
    </nav>
    <main class="flex-grow max-w-7xl mx-auto mt-4 p-4">
        <div class="editor-container">
            <div class="line-numbers"></div>
            <textarea id="editor" class="flex-1 p-4 text-sm" placeholder="Start typing your note..."></textarea>
        </div>
        <p id="status" class="status saved text-sm mt-2">Đã lưu</p>
    </main>
    <footer class="bg-gradient-to-r from-pink-400 to-blue-400 text-white p-4">
        <div class="max-w-7xl mx-auto text-center">
            © 2025 Note App by TKhanh - Inspired by Nakano Miku
        </div>
    </footer>
    <script>
        const input = document.querySelector('#editor');
        const lines = document.querySelector('.line-numbers');
        const status = document.querySelector('#status');

        const updateLines = () => {
            const texts = input.value.split('\n');
            lines.innerHTML = texts.map((_, i) => `<div>${i + 1}</div>`).join('');
        };

        const put = () => {
            status.textContent = 'Đang lưu';
            status.className = 'status saving';
            return fetch(location.href, {
                method: 'PUT',
                headers: {
                    'content-type': 'text/plain; charset=utf-8',
                },
                body: input.value,
            }).then(() => {
                status.textContent = 'Đã lưu';
                status.className = 'status saved';
            }).catch(() => {
                status.textContent = 'Lỗi khi lưu';
                status.className = 'status error';
            });
        };

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
            });

        // Initialize highlight.js
        hljs.configure({ languages: ['javascript', 'python', 'html', 'css'] });
        hljs.highlightElement(input);
    </script>
</body>
</html>
`);
        },
        put: async (req, res) => {
            const chunks = [];

            req.on('data', chunk => chunks.push(chunk));
            await new Promise(resolve => req.on('end', resolve));

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
        },
    },
};
