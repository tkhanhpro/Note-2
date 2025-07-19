const express = require('express');
const ews = require('express-ws');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const count_req_path = `${__dirname}/count_req.json`;
let count_req_data = {};

const count_req_save = () => fs.writeFileSync(count_req_path, JSON.stringify(count_req_data, null, 2), 'utf8');
const api = [];

// Initialize request counter
if (!fs.existsSync(count_req_path)) {
    count_req_save();
} else {
    try {
        count_req_data = require(count_req_path);
    } catch (e) {
        console.log('Error loading count_req.json, creating new one');
        count_req_data = {};
        count_req_save();
    }
}

// Setup WebSocket and middleware
ews(app);
app.set('json spaces', 4);
app.use(cors());
app.use(express.json());
app.use(express.text());

// Load API routes dynamically
fs.readdirSync('./api').forEach(file => {
    try {
        let file_import = require(`./api/${file}`);
        if (!count_req_data[file_import.info.path]) {
            count_req_data[file_import.info.path] = 0;
        }
        if (!/^\/$/.test(file_import.info.path)) {
            api.push(file_import.info);
        }

        Object.keys(file_import.methods).forEach(method => {
            app[method](file_import.info.path, (req, res, next) => {
                ++count_req_data[file_import.info.path];
                file_import.methods[method](req, res, next);
                count_req_save();
            });
        });
        
        console.log(`✅ Loaded API: ${file_import.info.path} (${Object.keys(file_import.methods).join(', ').toUpperCase()})`);
    } catch (e) {
        console.log(`❌ Load fail: ${file}`);
        console.log(e);
    }
});

// Serve the enhanced index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// API info endpoint
app.get('/api', (req, res) => {
    res.json({
        name: 'API GHICHU',
        version: '2.0.0',
        description: 'Công cụ giúp bạn ghi một đoạn văn bản hay code nào đó',
        endpoints: api,
        stats: count_req_data
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 API GHICHU Server started on port ${PORT}`);
    console.log(`📝 Available endpoints: ${api.length}`);
    console.log(`🌐 Access at: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...');
    count_req_save();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down gracefully...');
    count_req_save();
    process.exit(0);
});

