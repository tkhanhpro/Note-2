const express = require('express');
const ews = require('express-ws');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const count_req_path = `${__dirname}/count_req.json`;
let count_req_data = {};

const count_req_save = () => fs.writeFileSync(count_req_path, JSON.stringify(count_req_data), 'utf8');
const api = [];

if (!fs.existsSync(count_req_path)) count_req_save();
else count_req_data = require(count_req_path);

ews(app);
app.set('json spaces', 4);
app.use(cors());
app.use(express.json());

// Serve static files
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Load API routes
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    notesCount: fs.existsSync('./note') ? fs.readdirSync('./note').filter(f => f.endsWith('.txt')).length : 0
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    service: 'API GHICHU',
    version: '2.0.0',
    endpoints: api,
    stats: {
      totalRequests: Object.values(count_req_data).reduce((a, b) => a + b, 0),
      endpointStats: count_req_data
    }
  });
});

// Main page
app.get('/', (req, res) => res.sendFile(path.join(__dirname, "index.html")));

// Redirect root to new note
app.get('/:uuid?', (req, res, next) => {
  const uuid = req.params.uuid;
  
  // If no UUID provided, redirect to new note
  if (!uuid) {
    const { v4: uuidv4 } = require('uuid');
    return res.redirect(`/${uuidv4()}`);
  }
  
  // Let the note API handle valid UUIDs
  next();
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 API GHICHU Server started on port ${PORT}`);
  console.log(`📝 Note auto-cleanup: Enabled (7 days)`);
  console.log(`🔗 Access the service: http://localhost:${PORT}`);
});
