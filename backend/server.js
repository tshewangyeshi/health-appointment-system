const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });

const sns = new AWS.SNS();
const SNS_TOPIC_ARN = 'arn:aws:sns:us-east-1:484954965732:appointment-reminders'; // Replace this

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: 'healthcare.cyba06om6b84.us-east-1.rds.amazonaws.com',
  user: 'admin',
  password: 'tshewang',
  database: 'healthcare'
});

db.connect(err => {
  if (err) {
    console.error('Database connection error:', err);
    return;
  }
  console.log('Connected to RDS MySQL');
});

app.post('/appointments', (req, res) => {
  const { name, email, phone, time, mode, notes } = req.body;
  const sql = 'INSERT INTO appointments (name, email, phone, time, mode, notes) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(sql, [name, email, phone, time, mode, notes], (err, result) => {
    if (err) {
      console.error('Insert failed:', err);
      return res.status(500).json({ message: 'Database insert error' });
    }
    res.json({ message: 'Appointment saved' });
  });
});
const message = `New appointment booked by ${name}. Time: ${time}, Mode: ${mode}`;

sns.publish({
  Message: message,
  TopicArn: SNS_TOPIC_ARN
}, (err, data) => {
  if (err) console.error('SNS Error:', err);
  else console.log('SNS Notification Sent:', data);
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
