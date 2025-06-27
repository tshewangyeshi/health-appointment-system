const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const AWS = require('aws-sdk');

// AWS setup
AWS.config.update({ region: 'us-east-1' });
const s3 = new AWS.S3();
const sns = new AWS.SNS();
const SNS_TOPIC_ARN = 'arn:aws:sns:us-east-1:484954965732:appointment-reminders'; // replace if needed

const app = express();
app.use(cors({ origin: '*' }));

// Multer setup for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// MySQL connection
const db = mysql.createConnection({
  host: 'healthcare.cyba06om6b84.us-east-1.rds.amazonaws.com',
  user: 'admin',
  password: 'tshewang',
  database: 'healthcare'
});

db.connect(err => {
  if (err) console.error('DB connection error:', err);
  else console.log('Connected to RDS MySQL');
});

// Function to insert to DB and then send SNS notification
function insertToDB({ name, email, phone, time, mode, notes, fileUrl }, res) {
  const sql = 'INSERT INTO appointments (name, email, phone, time, mode, notes, file_url) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.query(sql, [name, email, phone, time, mode, notes, fileUrl], async (err, result) => {
    if (err) {
      console.error('MySQL error:', err);
      return res.status(500).json({ message: 'Database insert failed' });
    }

    const message = `🩺 New appointment booked\n👤 Name: ${name}\n📅 Time: ${time}\n🧭 Mode: ${mode}\n📞 Contact: ${email}, ${phone}`;

    try {
      await sns.publish({
        Message: message,
        Subject: 'New Appointment Booking',
        TopicArn: SNS_TOPIC_ARN
      }).promise();
      console.log('SNS notification sent.');
    } catch (snsErr) {
      console.error('SNS publish error:', snsErr);
    }

    res.status(200).json({ message: 'Appointment booked successfully!', fileUrl });
  });
}

// Appointment route
app.post('/appointments', upload.single('document'), (req, res) => {
  const { name, email, phone, time, mode, notes } = req.body;
  const file = req.file;

  const appointmentData = { name, email, phone, time, mode, notes };

  if (file) {
    const params = {
      Bucket: 'healthcare-patient-docs', // replace if needed
      Key: `documents/${Date.now()}-${file.originalname}`,
      Body: file.buffer
    };

    s3.upload(params, (err, data) => {
      if (err) {
        console.error('S3 upload error:', err);
        return res.status(500).json({ message: 'S3 upload failed' });
      }

      appointmentData.fileUrl = data.Location;
      insertToDB(appointmentData, res);
    });
  } else {
    appointmentData.fileUrl = null;
    insertToDB(appointmentData, res);
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
