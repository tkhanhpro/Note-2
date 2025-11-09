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

// Ensure directories exist
[notesDir, path.dirname(count_req_path)].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Optimized file operations
const count_req_save = () => {
  try {
    fs.writeFileSync(count_req_path, JSON.stringify(count_req_data));
  } catch (e) {
    // Silent fail for performance
  }
};

// Fast cleanup with bulk operations
const cleanupExpiredNotes = () => {
  try {
    const now = Date.now();
    const files = fs.readdirSync(notesDir, { withFileTypes: true });
    const toDelete = [];

    // First pass: identify files to delete
    for (const file of files) {
      if (file.isFile() && file.name.endsWith('.json')) {
        try {
          const filePath = path.join(notesDir, file.name);
          const data = fs.readFileSync(filePath, 'utf8');
          const meta = JSON.parse(data);
          
          if (meta.expiresAt && now > meta.expiresAt) {
            const uuid = file.name.replace('.json', '');
            toDelete.push({
              meta: filePath,
              content: path.join(notesDir, `${uuid}.txt`)
            });
          }
        } catch (e) {
          // Skip invalid files
          continue;
        }
      }
    }

    // Second pass: bulk delete
    for (const file of toDelete) {
      try {
        if (fs.existsSync(file.content)) fs.unlinkSync(file.content);
        if (fs.existsSync(file.meta)) fs.unlinkSync(file.meta);
      } catch (e) {
        // Continue with other files
      }
    }

    if (toDelete.length > 0) {
      console.log(`🗑️ Cleaned up ${toDelete.length} expired notes`);
    }
  } catch (error) {
    console.log('Cleanup error:', error.message);
  }
};

// Run cleanup every hour
setInterval(cleanupExpiredNotes, 60 * 60 * 1000);
// Initial cleanup after startup
setTimeout(cleanupExpiredNotes, 5000);

// Load request count data
try {
  if (fs.existsSync(count_req_path)) {
    count_req_data = JSON.parse(fs.readFileSync(count_req_path, 'utf8'));
  }
} catch (e) {
  count_req_data = {};
}

ews(app);
app.set('json spaces', 2); // Reduced for performance
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.text({ type: 'text/plain', limit: '10mb' }));

// Serve static files with cache headers
app.use(express.static(__dirname, {
  maxAge: '1h',
  etag: false // Disable etag for better performance
}));

// Pre-load API endpoints for faster startup
const api = [];
const apiFiles = fs.readdirSync('./api').filter(file => file.endsWith('.js'));

apiFiles.forEach(file => {
  try {
    const file_import = require(`./api/${file}`);
    
    if (!count_req_data[file_import.info.path]) {
      count_req_data[file_import.info.path] = 0;
    }
    
    if (file_import.info.path !== '/') {
      api.push(file_import.info);
    }

    // Register routes with optimized handler
    Object.keys(file_import.methods).forEach(method => {
      app[method](file_import.info.path, (req, res, next) => {
        // Fast path counter
        count_req_data[file_import.info.path] = (count_req_data[file_import.info.path] || 0) + 1;
        
        // Defer save to avoid blocking
        setImmediate(count_req_save);
        
        file_import.methods[method](req, res, next);
      });
    });
  } catch (e) {
    console.log(`Load fail: ${file}`, e.message);
  }
});

// Optimized root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Fast UUID redirect
app.get('/note/:UUID?', (req, res) => {
  const uuid = req.params.UUID;
  if (!uuid || uuid === ':UUID') {
    res.redirect(`/edit/${uuidv4()}`);
  } else {
    // Fast UUID validation
    if (uuid.length === 36 && uuid.split('-').length === 5) {
      res.redirect(`/edit/${uuid}`);
    } else {
      res.redirect(`/edit/${uuidv4()}`);
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: Date.now(),
    notesCount: Object.keys(count_req_data).length 
  });
});

const PORT = process.env.PORT || 4000;

// Optimized server startup
app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
  console.log(`📝 Optimized note service ready`);
  console.log(`⚡ Performance mode: MAXIMUM`);
});
