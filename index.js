const express = require('express');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.raw({ type: 'text/plain', limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// API directory
const apiDir = path.join(__dirname, 'api');
const loadedAPIs = new Map();

// Load all API modules
function loadAPIs() {
    if (!fs.existsSync(apiDir)) {
        console.log('❌ API directory not found');
        return;
    }

    const apiFiles = fs.readdirSync(apiDir).filter(file => file.endsWith('.js'));
    
    apiFiles.forEach(file => {
        try {
            const apiPath = path.join(apiDir, file);
            delete require.cache[require.resolve(apiPath)]; // Clear cache for hot reload
            const api = require(apiPath);
            
            if (api.info && api.methods) {
                const routePath = api.info.path;
                loadedAPIs.set(routePath, api);
                
                // Register routes for each HTTP method
                Object.keys(api.methods).forEach(method => {
                    const handler = api.methods[method];
                    
                    switch(method.toLowerCase()) {
                        case 'get':
                            app.get(routePath, handler);
                            break;
                        case 'post':
                            app.post(routePath, handler);
                            break;
                        case 'put':
                            app.put(routePath, handler);
                            break;
                        case 'delete':
                            app.delete(routePath, handler);
                            break;
                        case 'patch':
                            app.patch(routePath, handler);
                            break;
                    }
                });
                
                console.log(`✅ Loaded API: ${routePath} (${Object.keys(api.methods).map(m => m.toUpperCase()).join(', ')})`);
            }
        } catch (error) {
            console.error(`❌ Error loading API ${file}:`, error.message);
        }
    });
}

// Load APIs
loadAPIs();

// Add raw endpoint for backward compatibility and easy access
app.get('/raw/:UUID', (req, res) => {
    const uuid = req.params.UUID;
    const notesDir = path.join(__dirname, 'note');
    const filePath = path.join(notesDir, uuid + '.txt');
    
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        res.set('content-type', 'text/plain; charset=utf-8');
        res.set('cache-control', 'no-cache');
        res.end(content);
    } else {
        res.status(404).set('content-type', 'text/plain').end('Note not found');
    }
});

// Legacy support - redirect old /note/:UUID to new /edit/:UUID
app.get('/note/:UUID', (req, res) => {
    res.redirect(301, '/edit/' + req.params.UUID);
});

app.put('/note/:UUID', (req, res) => {
    res.redirect(307, '/edit/' + req.params.UUID);
});

app.delete('/note/:UUID', (req, res) => {
    res.redirect(307, '/edit/' + req.params.UUID);
});

// Main homepage with enhanced weather effects
app.get('/', (req, res) => {
    res.set('content-type', 'text/html');
    res.end(`<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta property="og:title" content="API GHICHU" />
    <meta property="og:description" content="Công cụ giúp bạn ghi một đoạn văn bản hay code nào đó" />
    <meta property="og:image" content="https://files.catbox.moe/4gbd9v.jpeg" />
    <meta property="og:url" content="https://ghichu.phungtuanhai.site" />
    <meta property="og:site_name" content="API GHICHU" />
    <meta property="og:type" content="website" />
    <link href="https://files.catbox.moe/4gbd9v.jpeg" rel="icon" type="image/x-icon" />
    <title>API GHICHU</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html, body {
            overflow: hidden;
            height: 100vh;
            position: fixed;
            width: 100%;
        }

        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #ffeef8 0%, #f8f4ff 50%, #fff0f5 100%);
            background-size: 400% 400%;
            animation: gradientShift 30s ease infinite;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            position: relative;
            overflow: hidden;
        }

        .weather-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        }

        .weather-particle {
            position: absolute;
            pointer-events: none;
            user-select: none;
            will-change: transform, opacity;
            backface-visibility: hidden;
            transform-style: preserve-3d;
        }

        .time-display {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
            padding: 12px 16px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(255, 107, 157, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            font-family: 'Poppins', sans-serif;
            text-align: center;
            z-index: 1000;
            animation: slideInRight 1s ease-out;
        }

        .time {
            font-size: 18px;
            font-weight: 600;
            color: #2d3748;
            text-shadow: 0 2px 4px rgba(255, 107, 157, 0.3);
            animation: glow 3s ease-in-out infinite alternate;
        }

        .date {
            font-size: 12px;
            color: #718096;
            margin-top: 4px;
            font-weight: 500;
        }

        .container {
            text-align: center;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            padding: 40px;
            border-radius: 24px;
            box-shadow: 
                0 20px 60px rgba(255, 107, 157, 0.15),
                0 8px 32px rgba(0, 0, 0, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.3);
            max-width: 500px;
            width: 90%;
            position: relative;
            z-index: 10;
            animation: fadeInUp 1.2s ease-out;
        }

        .avatar {
            width: 110px;
            height: 110px;
            border-radius: 50%;
            background: linear-gradient(135deg, #ff6b9d, #c44569);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            font-size: 48px;
            color: white;
            box-shadow: 
                0 12px 40px rgba(255, 107, 157, 0.4),
                0 0 0 4px rgba(255, 255, 255, 0.8),
                0 0 0 8px rgba(255, 107, 157, 0.2);
            animation: avatarFloat 6s ease-in-out infinite;
            position: relative;
            overflow: hidden;
            transition: all 0.3s ease;
        }

        .avatar::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent);
            animation: shimmer 3s linear infinite;
        }

        .avatar:hover {
            transform: scale(1.05) rotate(5deg);
            box-shadow: 
                0 16px 50px rgba(255, 107, 157, 0.5),
                0 0 0 4px rgba(255, 255, 255, 0.9),
                0 0 0 8px rgba(255, 107, 157, 0.3);
        }

        h1 {
            margin-bottom: 16px;
            font-size: 32px;
            color: #2d3748;
            font-weight: 700;
            font-family: 'Poppins', sans-serif;
            text-shadow: 0 2px 4px rgba(255, 107, 157, 0.2);
            animation: titleGlow 4s ease-in-out infinite alternate;
        }

        .description {
            margin-bottom: 32px;
            font-size: 16px;
            color: #718096;
            line-height: 1.6;
            font-weight: 400;
        }

        .endpoints-section {
            margin-bottom: 32px;
        }

        .section-title {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-bottom: 20px;
            font-size: 18px;
            color: #4a5568;
            font-weight: 600;
        }

        .endpoint-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin: 16px 0;
            padding: 16px;
            background: rgba(255, 255, 255, 0.7);
            border-radius: 12px;
            border: 1px solid rgba(255, 107, 157, 0.2);
            transition: all 0.3s ease;
        }

        .endpoint-item:hover {
            background: rgba(255, 107, 157, 0.05);
            border-color: rgba(255, 107, 157, 0.4);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(255, 107, 157, 0.15);
        }

        .endpoint-path {
            font-family: 'JetBrains Mono', monospace;
            font-size: 14px;
            color: #2d3748;
            font-weight: 500;
            background: rgba(255, 107, 157, 0.1);
            padding: 4px 8px;
            border-radius: 6px;
        }

        .method-badge {
            background: #48bb78;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .try-button {
            background: linear-gradient(135deg, #ff6b9d, #c44569);
            color: white;
            border: none;
            padding: 16px 32px;
            font-size: 16px;
            font-weight: 600;
            border-radius: 50px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 8px 25px rgba(255, 107, 157, 0.3);
            position: relative;
            overflow: hidden;
            font-family: 'Poppins', sans-serif;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .try-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
            transition: left 0.5s ease;
        }

        .try-button:hover::before {
            left: 100%;
        }

        .try-button:hover {
            transform: translateY(-3px) scale(1.05);
            box-shadow: 0 12px 35px rgba(255, 107, 157, 0.4);
        }

        .try-button:active {
            transform: translateY(-1px) scale(1.02);
        }

        .footer {
            margin-top: 32px;
            font-size: 14px;
            color: #a0aec0;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }

        /* Weather Animations */
        @keyframes smoothSnowFall {
            0% { transform: translateY(-100vh) translateX(0) rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            25% { transform: translateY(25vh) translateX(20px) rotate(90deg); }
            50% { transform: translateY(50vh) translateX(-10px) rotate(180deg); }
            75% { transform: translateY(75vh) translateX(15px) rotate(270deg); }
            90% { opacity: 1; }
            100% { transform: translateY(100vh) translateX(0) rotate(360deg); opacity: 0; }
        }

        @keyframes smoothLeafFall {
            0% { transform: translateY(-100vh) translateX(0) rotate(0deg) scale(1); opacity: 0; }
            10% { opacity: 1; }
            20% { transform: translateY(20vh) translateX(-30px) rotate(45deg) scale(1.1); }
            40% { transform: translateY(40vh) translateX(25px) rotate(90deg) scale(0.9); }
            60% { transform: translateY(60vh) translateX(-20px) rotate(180deg) scale(1.2); }
            80% { transform: translateY(80vh) translateX(15px) rotate(270deg) scale(0.8); }
            90% { opacity: 1; }
            100% { transform: translateY(100vh) translateX(0) rotate(360deg) scale(1); opacity: 0; }
        }

        @keyframes smoothSunFloat {
            0% { transform: translateY(100vh) translateX(0) scale(0.8); opacity: 0; }
            10% { opacity: 1; }
            25% { transform: translateY(75vh) translateX(-15px) scale(1); }
            50% { transform: translateY(50vh) translateX(10px) scale(1.1); }
            75% { transform: translateY(25vh) translateX(-5px) scale(0.9); }
            90% { opacity: 1; }
            100% { transform: translateY(-10vh) translateX(0) scale(0.8); opacity: 0; }
        }

        @keyframes smoothFlowerFall {
            0% { transform: translateY(-100vh) translateX(0) rotate(0deg) scale(1); opacity: 0; }
            15% { opacity: 1; }
            30% { transform: translateY(30vh) translateX(-20px) rotate(60deg) scale(1.1); }
            50% { transform: translateY(50vh) translateX(15px) rotate(120deg) scale(0.9); }
            70% { transform: translateY(70vh) translateX(-10px) rotate(240deg) scale(1.2); }
            85% { opacity: 1; }
            100% { transform: translateY(100vh) translateX(0) rotate(360deg) scale(1); opacity: 0; }
        }

        @keyframes smoothRainFall {
            0% { transform: translateY(-100vh) translateX(0); opacity: 0; }
            5% { opacity: 1; }
            95% { opacity: 1; }
            100% { transform: translateY(100vh) translateX(5px); opacity: 0; }
        }

        /* Other Animations */
        @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(30px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        @keyframes avatarFloat {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            25% { transform: translateY(-8px) rotate(2deg); }
            50% { transform: translateY(-4px) rotate(0deg); }
            75% { transform: translateY(-12px) rotate(-2deg); }
        }

        @keyframes shimmer {
            0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
            100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }

        @keyframes glow {
            from { text-shadow: 0 2px 4px rgba(255, 107, 157, 0.3); }
            to { text-shadow: 0 2px 8px rgba(255, 107, 157, 0.6), 0 0 12px rgba(255, 107, 157, 0.4); }
        }

        @keyframes titleGlow {
            from { text-shadow: 0 2px 4px rgba(255, 107, 157, 0.2); }
            to { text-shadow: 0 2px 8px rgba(255, 107, 157, 0.5), 0 0 16px rgba(255, 107, 157, 0.3); }
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
            .container {
                padding: 24px;
                margin: 20px;
            }

            .avatar {
                width: 80px;
                height: 80px;
                font-size: 36px;
                margin-bottom: 20px;
            }

            h1 {
                font-size: 24px;
                margin-bottom: 12px;
            }

            .description {
                font-size: 14px;
                margin-bottom: 24px;
            }

            .endpoint-item {
                flex-direction: column;
                gap: 8px;
                text-align: center;
            }

            .try-button {
                padding: 14px 28px;
                font-size: 14px;
                width: 100%;
            }

            .time-display {
                top: 10px;
                right: 10px;
                padding: 8px 12px;
            }

            .time {
                font-size: 14px;
            }

            .date {
                font-size: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="weather-container" id="weather-container"></div>
    
    <div class="time-display">
        <div class="time" id="current-time">00:00:00</div>
        <div class="date" id="current-date">Thứ Hai, 01 Tháng 1, 2024</div>
        <div class="date">Hồ Chí Minh, Việt Nam</div>
    </div>

    <div class="container">
        <div class="avatar">
            💻
        </div>
        <h1>API GHICHU</h1>
        <p class="description">Công cụ giúp bạn ghi một đoạn văn bản hay code nào đó</p>
        
        <div class="endpoints-section">
            <div class="section-title">
                <span>🔗</span>
                <span>Available Endpoints</span>
            </div>
            
            <div class="endpoint-item">
                <div class="endpoint-path">/edit/:UUID</div>
                <div class="method-badge">GET</div>
            </div>
        </div>

        <button class="try-button" onclick="createNewNote()">
            Try It
        </button>

        <div class="footer">
            <span>💖</span>
            <span>Được thiết kế với tình yêu và sự chăm sóc</span>
        </div>
    </div>

    <script>
        // Time Display
        function updateTime() {
            const now = new Date();
            const timeOptions = {
                timeZone: 'Asia/Ho_Chi_Minh',
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            };
            
            const dateOptions = {
                timeZone: 'Asia/Ho_Chi_Minh',
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            };

            document.getElementById('current-time').textContent = 
                now.toLocaleTimeString('vi-VN', timeOptions);
            document.getElementById('current-date').textContent = 
                now.toLocaleDateString('vi-VN', dateOptions);
        }

        setInterval(updateTime, 1000);
        updateTime();

        // Weather System
        const weatherContainer = document.getElementById('weather-container');
        let currentWeatherType = '';
        let weatherParticles = [];

        const weatherTypes = {
            snow: {
                particles: ['❄️', '❅', '❆', '🌨️'],
                count: 25,
                animation: 'smoothSnowFall',
                duration: [8, 16],
                style: {
                    textShadow: '0 0 10px rgba(173, 216, 230, 0.8), 0 0 20px rgba(173, 216, 230, 0.6)',
                    filter: 'drop-shadow(0 0 5px rgba(173, 216, 230, 0.7))'
                }
            },
            leaves: {
                particles: ['🍂', '🍁', '🍃', '🌿'],
                count: 20,
                animation: 'smoothLeafFall',
                duration: [10, 18],
                style: {
                    filter: 'drop-shadow(2px 2px 4px rgba(139, 69, 19, 0.3))'
                }
            },
            sun: {
                particles: ['☀️', '🌞', '🌅'],
                count: 8,
                animation: 'smoothSunFloat',
                duration: [12, 20],
                style: {
                    textShadow: '0 0 15px rgba(255, 215, 0, 0.8), 0 0 30px rgba(255, 165, 0, 0.6), 0 0 45px rgba(255, 69, 0, 0.4)',
                    filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.7))'
                }
            },
            flowers: {
                particles: ['🌸', '🌺', '🌼', '🌻', '🌷', '🦋', '✨', '💫'],
                count: 18,
                animation: 'smoothFlowerFall',
                duration: [14, 22],
                style: {
                    filter: 'drop-shadow(1px 1px 3px rgba(255, 182, 193, 0.4))'
                }
            },
            rain: {
                particles: ['🌧️', '🌦️', '☔', '💧'],
                count: 30,
                animation: 'smoothRainFall',
                duration: [3, 6],
                style: {
                    textShadow: '0 0 8px rgba(70, 130, 180, 0.6)',
                    filter: 'drop-shadow(0 0 3px rgba(70, 130, 180, 0.5))'
                }
            }
        };

        function getRandomWeatherType() {
            const types = Object.keys(weatherTypes);
            const hour = new Date().getHours();
            const month = new Date().getMonth() + 1;
            
            // Seasonal and time-based weather logic
            let weights = {};
            
            if (month >= 12 || month <= 2) { // Winter
                weights = { snow: 0.4, flowers: 0.2, sun: 0.2, leaves: 0.1, rain: 0.1 };
            } else if (month >= 3 && month <= 5) { // Spring
                weights = { flowers: 0.4, sun: 0.3, rain: 0.2, leaves: 0.05, snow: 0.05 };
            } else if (month >= 6 && month <= 8) { // Summer
                weights = { sun: 0.5, flowers: 0.3, rain: 0.15, leaves: 0.03, snow: 0.02 };
            } else { // Autumn
                weights = { leaves: 0.5, rain: 0.25, flowers: 0.15, sun: 0.08, snow: 0.02 };
            }
            
            // Time adjustments
            if (hour >= 6 && hour <= 10) { // Morning
                weights.sun *= 1.5;
                weights.flowers *= 1.3;
            } else if (hour >= 18 && hour <= 22) { // Evening
                weights.rain *= 1.4;
                weights.snow *= 1.2;
            }
            
            // Random selection based on weights
            const random = Math.random();
            let cumulative = 0;
            
            for (const [type, weight] of Object.entries(weights)) {
                cumulative += weight;
                if (random <= cumulative) {
                    return type;
                }
            }
            
            return types[Math.floor(Math.random() * types.length)];
        }

        function createWeatherParticle(type, config) {
            const particle = document.createElement('div');
            particle.className = 'weather-particle';
            
            const emoji = config.particles[Math.floor(Math.random() * config.particles.length)];
            particle.textContent = emoji;
            
            // Random positioning
            particle.style.left = Math.random() * 100 + '%';
            particle.style.fontSize = (Math.random() * 8 + 18) + 'px';
            
            // Apply weather-specific styles
            if (config.style) {
                Object.assign(particle.style, config.style);
            }
            
            // Animation
            const duration = Math.random() * (config.duration[1] - config.duration[0]) + config.duration[0];
            particle.style.animation = config.animation + ' ' + duration + 's linear forwards';
            
            weatherContainer.appendChild(particle);
            weatherParticles.push(particle);
            
            // Remove particle after animation
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
                const index = weatherParticles.indexOf(particle);
                if (index > -1) {
                    weatherParticles.splice(index, 1);
                }
            }, duration * 1000);
        }

        function clearWeatherParticles() {
            weatherParticles.forEach(particle => {
                if (particle.parentNode) {
                    particle.style.transition = 'opacity 2s ease-out';
                    particle.style.opacity = '0';
                    setTimeout(() => {
                        if (particle.parentNode) {
                            particle.parentNode.removeChild(particle);
                        }
                    }, 2000);
                }
            });
            weatherParticles = [];
        }

        function updateWeatherEffect() {
            const newWeatherType = getRandomWeatherType();
            
            if (newWeatherType !== currentWeatherType) {
                console.log('🌤️ Weather changing to:', newWeatherType);
                clearWeatherParticles();
                
                setTimeout(() => {
                    currentWeatherType = newWeatherType;
                    startWeatherEffect(newWeatherType);
                }, 1000);
            }
        }

        function startWeatherEffect(type) {
            const config = weatherTypes[type];
            if (!config) return;
            
            console.log('🌈 Starting weather effect:', type);
            
            // Create initial batch
            for (let i = 0; i < config.count; i++) {
                setTimeout(() => {
                    createWeatherParticle(type, config);
                }, Math.random() * 2000);
            }
            
            // Continue creating particles
            const interval = setInterval(() => {
                if (currentWeatherType === type) {
                    createWeatherParticle(type, config);
                } else {
                    clearInterval(interval);
                }
            }, Math.random() * 500 + 300);
        }

        // Initialize weather
        updateWeatherEffect();
        setInterval(updateWeatherEffect, 25000);

        // Create new note function
        function createNewNote() {
            const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
            
            window.open('/edit/' + uuid, '_blank');
        }

        console.log('🚀 API GHICHU Homepage loaded');
        console.log('🌐 Available endpoints: /edit/:UUID, /raw/:UUID');
    </script>
</body>
</html>`);
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        available_endpoints: Array.from(loadedAPIs.keys()),
        suggestion: 'Try /edit/:UUID to create or edit a note'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Loaded API: ${Array.from(loadedAPIs.keys()).join(', ')}`);
    console.log(`🚀 API GHICHU Server started on port ${PORT}`);
    console.log(`📝 Available endpoints: ${loadedAPIs.size}`);
    console.log(`🌐 Access at: http://localhost:${PORT}`);
});

module.exports = app;

