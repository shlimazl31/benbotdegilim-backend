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
    if (err) console.error(err.message);
    console.log('SQLite bağlantısı başarılı');
});

db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nickname TEXT NOT NULL,
    status TEXT NOT NULL
)`);

// Kullanıcı ekleme ve reCAPTCHA doğrulama
app.post('/submit', async (req, res) => {
    const { nickname, token } = req.body;
    if (!nickname || !token) return res.status(400).json({ error: 'Eksik veri' });

    try {
        const response = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify?secret=${SECRET_KEY}&response=${token}`
        );

        const score = response.data.score;
        const status = score >= 0.5 ? 'Geçti' : 'Başarısız';

        db.run(`INSERT INTO users (nickname, status) VALUES (?, ?)`, [nickname, status], (err) => {
            if (err) return res.status(500).json({ error: 'Veritabanı hatası' });
            res.json({ nickname, status });
        });
    } catch (error) {
        res.status(500).json({ error: 'reCAPTCHA doğrulama hatası' });
    }
});

// Tüm kullanıcıları alma
app.get('/users', (req, res) => {
    db.all(`SELECT * FROM users`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Veritabanı hatası' });
        res.json(rows);
    });
});

app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda çalışıyor!`));
