const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.RECAPTCHA_SECRET;

app.use(express.json());
app.use(cors());

// SQLite Veritabanı Bağlantısı
const db = new sqlite3.Database('./users.db', (err) => {
    if (err) {
        console.error('Veritabanı bağlantı hatası:', err.message);
    } else {
        console.log('✅ SQLite bağlantısı başarılı');
    }
});

db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nickname TEXT NOT NULL,
    status TEXT NOT NULL
)`);

// 🌍 Ana Endpoint
app.get('/', (req, res) => {
    res.send('🚀 API Çalışıyor! Kullanılabilir endpointler: [POST] /submit, [GET] /users');
});

// 🛡️ Kullanıcı ekleme ve reCAPTCHA doğrulama
app.post('/submit', async (req, res) => {
    const { nickname, token } = req.body;

    if (!nickname || !token) {
        return res.status(400).json({ error: 'Eksik veri: nickname ve token gerekli!' });
    }

    try {
        console.log('Gönderilen token:', token); // 🔍 Token'ı kontrol et

        const response = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify`,
            null,
            {
                params: {
                    secret: SECRET_KEY,
                    response: token
                }
            }
        );

        console.log('reCAPTCHA API Yanıtı:', response.data); // 🔍 API'den dönen sonucu kontrol et

        if (!response.data.success) {
            return res.status(400).json({ error: 'reCAPTCHA doğrulaması başarısız', details: response.data });
        }

        const status = 'Geçti';

        db.run(`INSERT INTO users (nickname, status) VALUES (?, ?)`, [nickname, status], (err) => {
            if (err) {
                console.error('Veritabanı hatası:', err.message);
                return res.status(500).json({ error: 'Veritabanı hatası' });
            }
            res.json({ message: 'Kullanıcı eklendi', nickname, status });
        });
    } catch (error) {
        console.error('reCAPTCHA isteği başarısız:', error);
        res.status(500).json({ error: 'reCAPTCHA doğrulama hatası' });
    }
});

// 📜 Tüm kullanıcıları alma
app.get('/users', (req, res) => {
    db.all(`SELECT * FROM users`, [], (err, rows) => {
        if (err) {
            console.error('Veritabanı sorgu hatası:', err.message);
            return res.status(500).json({ error: 'Veritabanı hatası' });
        }
        res.json(rows);
    });
});

// 🚀 Sunucu Başlat
app.listen(PORT, () => console.log(`✅ Sunucu ${PORT} portunda çalışıyor!`));
