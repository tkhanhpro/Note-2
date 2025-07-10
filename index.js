const express = require('express');
const ews = require('express-ws');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const count_req_path = `${__dirname}/count_req.json`;
const notesDir = path.join(__dirname, 'note');
let count_req_data = {};

const count_req_save = () => {
    try {
        fs.writeFileSync(count_req_path, JSON.stringify(count_req_data, null, 2), 'utf8');
    } catch (e) {
        console.error(`Failed to save count_req_data: ${e.message}`);
    }
};

const api = [];

if (!fs.existsSync(count_req_path)) count_req_save();
else {
    try {
        count_req_data = require(count_req_path);
    } catch (e) {
        console.error(`Failed to load count_req_data: ${e.message}`);
    }
}

if (!fs.existsSync(notesDir)) {
    fs.mkdirSync(notesDir, { recursive: true });
}

ews(app);
app.set('json spaces', 4);
app.use(cors());
app.use(express.json());

fs.readdirSync('./api').forEach(file => {
    try {
        let file_import = require(`./api/${file}`);
        if (!count_req_data[file_import.info.path]) count_req_data[file_import.info.path] = 0;
        if (!/^\/$/.test(file_import.info.path)) api.push(file_import.info);

        Object.keys(file_import.methods).forEach(method => {
            app[method](file_import.info.path, (req, res, next) => {
                ++count_req_data[file_import.info.path];
                file_import.methods[method](req, res, next);
                count_req_save();
            });
        });
        console.log(`Loaded API: ${file}`);
    } catch (e) {
        console.error(`Load fail: ${file} - Error: ${e.message}`);
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/recent', (req, res) => {
    try {
        const notes = fs.readdirSync(notesDir)
            .filter(file => file.endsWith('.txt') && !file.endsWith('.raw.txt'))
            .map(file => {
                const content = fs.readFileSync(path.join(notesDir, file), 'utf8');
                return {
                    uuid: file.replace('.txt', ''),
                    title: content.split('\n')[0].slice(0, 50) || 'Untitled Note',
                    content: content.slice(0, 100) || 'No content'
                };
            })
            .sort((a, b) => fs.statSync(path.join(notesDir, `${b.uuid}.txt`)).mtime - fs.statSync(path.join(notesDir, `${a.uuid}.txt`)).mtime)
            .slice(0, 6); // Limit to 6 recent notes
        res.json(notes);
    } catch (e) {
        console.error(`Failed to fetch recent notes: ${e.message}`);
        res.status(500).json([]);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
