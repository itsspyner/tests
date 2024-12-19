const mysql = require('mysql2');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(express.json());

app.use(cors({
    origin: 'http://127.0.0.1:5500', // Replace with your frontend's origin
    methods: ['POST'],
    allowedHeaders: ['Content-Type']
}));

const con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'signup'
});

con.connect(function (err) {
    if (err) {
        throw err;
    }
    console.log("Connected successfully");
});

const upload = multer({
    dest: "upload"
});

app.post('/signup', upload.single('json'), (req, res) => {
    const { username, email, password } = req.body;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ fileerr: 'No file uploaded or incorrect format.' });
    }

    // Check for existing username or email
    const checkQuery = 'SELECT * FROM gui WHERE username = ? OR email = ?';
    con.query(checkQuery, [username, email], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error' });

        if (result.length > 0) {
            const existing = result[0];
            if (existing.username === username) {
                return res.status(400).json({ user: 'Username already exists' });
            }
            if (existing.email === email) {
                return res.status(400).json({ email: 'Email already exists' });
            }
        }

        try {
            const fileData = fs.readFileSync(file.path, 'utf-8'); // Synchronous read
            const parsedData = JSON.parse(fileData); // Parse JSON to ensure validity

            // Insert data into the database
            const insertQuery = 'INSERT INTO gui(email, username, password, data) VALUES (?, ?, ?, ?)';
            con.query(insertQuery, [email, username, password, JSON.stringify(parsedData)], (err) => {
                if (err) return res.status(500).json({ error: 'Failed to insert data' });

                return res.status(201).json({ message: 'Signup successful' });
            });
        } catch (error) {
            return res.status(400).json({ error: 'Invalid JSON file or error reading the file' });
        }
    });

});

app.post('/modify/:username', (req, res) => {

    const { skills, education, experience } = req.body;
    const username = req.params.username;
    con.query('SELECT *FROM gui WHERE username = ?', [username], (err, result) => {
        if (err) throw err;
        if (skills != "") {
            const data = result[0].data;
            data.skills = [...data.skills, ...skills];

            con.query('UPDATE gui SET data = ? WHERE username = ?', [JSON.stringify(data), username], (err) => {
                if (err) throw err;
                else {
                    return res.status(200).json({ message: 'Skills updated successfully!' });
                }
            });
        }
        if (education != "") {
            const data = result[0].data;
            data.education.push(education);
            con.query('UPDATE gui SET data = ? WHERE username = ?', [JSON.stringify(data), username], (err) => {
                if (err) throw err;
                else {
                    return res.status(200).json({ message: 'Education updated successfully!' });
                }
            });
        }
        if (experience != "") {
            const data = result[0].data;
            data.experience.push(experience);
            con.query('UPDATE gui SET data = ? WHERE username = ?', [JSON.stringify(data), username], (err) => {
                if (err) throw err;
                else {
                    return res.status(200).json({ message: 'Experience updated successfully!' });
                }
            });
        }
    });
});


app.listen(3000, () => {
    console.log('listening on port 3000');
});
