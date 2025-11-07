const express = require('express');
const ews = require('express-ws');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const count_req_path = `${__dirname}/count_req.json`;
const notesDir = path.join(__dirname, 'note');
let count_req_data = {};

// Ensure notes directory exists
if (!fs.existsSync(notesDir)) {
  fs.mkdirSync(notesDir, { recursive: true });
}

const count_req_save = () => fs.writeFileSync(count_req_path, JSON.stringify(count_req_data), 'utf8');

// Cleanup expired notes function
const cleanupExpiredNotes = () => {
  try {
    const now = Date.now();
    const files = fs.readdirSync(notesDir);
    
    files.forEach(file => {
      if (file.endsWith('.json')) {
        const filePath = path.join(notesDir, file);
        try {
          const meta = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          if (meta.expiresAt && now > meta.expiresAt) {
            // Delete both meta file and content file
            const uuid = file.replace('.json', '');
            const contentFile = path.join(notesDir, `${uuid}.txt`);
            
            if (fs.existsSync(contentFile)) {
              fs.unlinkSync(contentFile);
            }
            fs.unlinkSync(filePath);
            
            console.log(`🗑️ Cleaned up expired note: ${uuid}`);
          }
        } catch (e) {
          console.log('Error reading meta file:', file);
        }
      }
    });
  } catch (error) {
    console.log('Cleanup error:', error);
  }
};

// Run cleanup every hour
setInterval(cleanupExpiredNotes, 60 * 60 * 1000);
// Run initial cleanup
setTimeout(cleanupExpiredNotes, 1000);

if (!fs.existsSync(count_req_path)) count_req_save();
else count_req_data = require(count_req_path);

ews(app);
app.set('json spaces', 4);
app.use(cors());
app.use(express.json());
app.use(express.text({ type: 'text/plain' }));

// Serve static files
app.use(express.static(__dirname));

// Load API endpoints
const api = [];
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
  } catch (e) {
    console.log('Load fail: ' + file);
    console.log(e);
  }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, "index.html")));

// Redirect old /note endpoint to new UUID
app.get('/note/:UUID?', (req, res) => {
  const uuid = req.params.UUID;
  if (!uuid || uuid === ':UUID') {
    res.redirect(`/edit/${uuidv4()}`);
  } else {
    res.redirect(`/edit/${uuid}`);
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
  console.log(`📝 Note service with auto-cleanup enabled`);
});
