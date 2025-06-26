const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: 'healthcare.cyba06om6b84.us-east-1.rds.amazonaws.com',     // Example: mydb.xxxxxx.us-east-1.rds.amazonaws.com
  user: 'admin',
  password: 'tshewang',
  database: 'healthcare'
});

db.connect(err => {
  if (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
  console.log('✅ Connected to MySQL database');
});

app.post('/appointments', (req, res) => {
  const { name, email, phone, time, mode, notes } = req.body;

  if (!name || !email || !phone || !time || !mode) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const sql = `INSERT INTO appointments (name, email, phone, time, mode, notes)
               VALUES (?, ?, ?, ?, ?, ?)`;
  const values = [name, email, phone, time, mode, notes];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Insert failed:', err);
      return res.status(500).json({ message: 'Database insert error' });
    }
    res.json({ message: '✅ Appointment booked successfully!' });
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
