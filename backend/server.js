const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const app = express();
const cors = require('cors');

app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: 'healthcare.cyba06om6b84.us-east-1.rds.amazonaws.com',
  user: 'admin',
  password: 'tshewang',
  database: 'healthcare'
});

app.get('/appointments', (req, res) => {
  db.query('SELECT * FROM appointments', (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

app.post('/appointments', (req, res) => {
  const { name, time, contact } = req.body;
  db.query('INSERT INTO appointments (name, time, contact) VALUES (?, ?, ?)', 
    [name, time, contact], (err, result) => {
    if (err) throw err;
    res.send({ success: true });
  });
});

app.listen(3000, () => console.log('Server running on port 3000'));
