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
                    const newUuid = require('uuid').v4();
                    res.redirect(`./${newUuid}`);
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
                res.end(`
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Note by TKhanh - Nakano Miku</title>
                        <script src="https://cdn.tailwindcss.com"></script>
                        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/dracula.min.css">
                        <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
                        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
                        <style>
                            body {
                                font-family: 'Inter', sans-serif;
                                background: linear-gradient(180deg, #1a3c34 0%, #0a0a0a 100%);
                                animation: fadeIn 0.6s ease-in-out;
                                color: #f9f6ef;
                            }
                            @keyframes fadeIn {
                                from { opacity: 0; }
                                to { opacity: 1; }
                            }
                            @keyframes gradientShift {
                                0% { border-color: #1a3c34; }
                                50% { border-color: #4fd1c5; }
                                100% { border-color: #1a3c34; }
                            }
                            nav {
                                background: rgba(255, 255, 255, 0.05);
                                backdrop-filter: blur(12px);
                                border-bottom: 1px solid rgba(226, 232, 240, 0.2);
                            }
                            .header-container {
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                max-width: 6xl;
                                margin: 0 auto;
                                padding: 1rem;
                            }
                            .action-button {
                                background: rgba(255, 255, 255, 0.05);
                                color: #f9f6ef;
                                transition: all 0.3s ease;
                                border: 2px solid transparent;
                                animation: gradientShift 10s ease infinite;
                                font-weight: 500;
                                letter-spacing: 0.025em;
                                padding: 0.5rem 1rem;
                                border-radius: 0.5rem;
                            }
                            .action-button:hover {
                                background: #4fd1c5;
                                transform: scale(1.03);
                                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                            }
                            .editor-container {
                                display: flex;
                                border-radius: 0.75rem;
                                overflow: hidden;
                                border: 2px solid transparent;
                                background: rgba(255, 255, 255, 0.05);
                                backdrop-filter: blur(12px);
                                animation: gradientShift 10s ease infinite;
                                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                                margin-top: 1rem;
                            }
                            .line-numbers {
                                counter-reset: line;
                                padding: 1rem 0.5rem;
                                background: #1a202c;
                                color: #f9f6ef;
                                text-align: right;
                                min-width: 2.5rem;
                                font-family: 'Fira Code', monospace;
                                font-size: 0.875rem;
                                line-height: 1.5;
                            }
                            .line-numbers div {
                                min-height: 1.5rem;
                                display: flex;
                                align-items: center;
                                justify-content: flex-end;
                                padding-right: 0.5rem;
                            }
                            .line-numbers div:before {
                                counter-increment: line;
                                content: counter(line);
                            }
                            textarea {
                                font-family: 'Fira Code', monospace;
                                background: #1a202c;
                                color: #f8f8f2;
                                border: none;
                                outline: none;
                                resize: both;
                                width: 100%;
                                min-height: 85vh;
                                max-height: 90vh;
                                max-width: 100%;
                                padding: 1rem;
                                font-size: 1rem;
                                line-height: 1.5;
                                scroll-behavior: smooth;
                                overflow: auto;
                            }
                            textarea::-webkit-scrollbar {
                                width: 8px;
                            }
                            textarea::-webkit-scrollbar-thumb {
                                background: linear-gradient(180deg, #1a3c34, #4fd1c5);
                                border-radius: 4px;
                            }
                            textarea::-webkit-scrollbar-track {
                                background: #1a202c;
                            }
                            textarea:focus {
                                box-shadow: 0 0 0 3px #4fd1c5;
                            }
                            .status {
                                background: rgba(255, 255, 255, 0.05);
                                backdrop-filter: blur(12px);
                                padding: 0.5rem 1rem;
                                border-radius: 0.5rem;
                                border: 2px solid transparent;
                                animation: gradientShift 10s ease infinite;
                                font-size: 0.875rem;
                                color: #f9f6ef;
                                font-weight: 500;
                                letter-spacing: 0.025em;
                            }
                            .status.typing { color: #f8c1cc; }
                            .status.saving { color: #a3bffa; }
                            .status.saved { color: #b4f8c8; }
                            .status.error { color: #ff6b6b; }
                            footer {
                                background: rgba(255, 255, 255, 0.05);
                                backdrop-filter: blur(12px);
                                color: #f9f6ef;
                            }
                        </style>
                    </head>
                    <body class="min-h-screen flex flex-col">
                        <nav class="p-4">
                            <div class="header-container">
                                <h1 class="text-lg font-semibold">Note Editor</h1>
                                <p id="status" class="status saved">Đã lưu</p>
                            </div>
                        </nav>
                        <main class="flex-grow max-w-6xl mx-auto p-4">
                            <div class="editor-container">
                                <div class="line-numbers"></div>
                                <textarea id="editor" class="flex-1" placeholder="Start typing your note...">${text.replace(/</g, '<').replace(/>/g, '>')}</textarea>
                            </div>
                        </main>
                        <footer class="p-4">
                            <div class="max-w-6xl mx-auto text-center text-sm">
                                End
                            </div>
                        </footer>
                        <script>
                            const input = document.querySelector('#editor');
                            const lines = document.querySelector('.line-numbers');
                            const status = document.querySelector('#status');

                            function updateLines() {
                                const texts = input.value.split(/\\r?\\n/);
                                lines.innerHTML = texts.map((_, i) => \`<div>\${i + 1}</div>\`).join('');
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

                            fetch(u.href, {
                                method: 'GET',
                                headers: { 'user-agent': 'fetch' }
                            })
                                .then(r => r.text())
                                .then(t => {
                                    input.value = t;
                                    updateLines();
                                    hljs.highlightElement(input);
                                    input.addEventListener('input', () => {
                                        status.textContent = 'Chưa lưu';
                                        status.className = 'status typing';
                                        if (putTimeout) clearTimeout(putTimeout);
                                        putTimeout = setTimeout(() => put(), 1000);
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
                    </html>
                `);
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
