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

// Express app setup
const app = express();
app.use(cors({ origin: '*' }));

// Multer setup
const upload = multer({ storage: multer.memoryStorage() });

// MySQL DB connection
const db = mysql.createConnection({
  host: 'healthcare.cyba06om6b84.us-east-1.rds.amazonaws.com',
  user: 'admin',
  password: 'tshewang',
  database: 'healthcare'
});

db.connect(err => {
  if (err) {
    console.error('DB connection error:', err);
  } else {
    console.log('Connected to MySQL');
  }
});
function insertToDB(name, email, phone, time, mode, notes, fileUrl, res) {
  const sql = 'INSERT INTO appointments (name, email, phone, time, mode, notes, file_url) VALUES (?, ?, ?, ?, ?, ?, ?)';
  
  db.query(sql, [name, email, phone, time, mode, notes, fileUrl], async (err, result) => {
    if (err) {
      console.error('MySQL error:', err);
      return res.status(500).json({ message: 'Database insert failed' });
    }

    // ✅ Send notification using SNS (NOW VARIABLES ARE AVAILABLE)
    const message = `New appointment booked by ${name}.\nTime: ${time}\nMode: ${mode}\nContact: ${email}, ${phone}`;
    
    try {
      await sns.publish({
        Message: message,
        Subject: 'New Appointment Booking',
        TopicArn: SNS_TOPIC_ARN
      }).promise();
      console.log('SNS Notification sent');
    } catch (snsErr) {
      console.error('SNS publish failed:', snsErr);
    }

    // ✅ Respond to frontend
    res.status(200).json({ message: 'Appointment booked successfully!', fileUrl });
  });
}

// POST route
app.post('/appointments', upload.single('document'), async (req, res) => {
  try {
    const name = req.body.name;
    const email = req.body.email;
    const phone = req.body.phone;
    const time = req.body.time;
    const mode = req.body.mode;
    const notes = req.body.notes;
    const file = req.file;

    let fileUrl = null;

    if (file) {
      const params = {
        Bucket: 'healthcare-patient-docs', // replace with your actual bucket
        Key: `documents/${Date.now()}-${file.originalname}`,
        Body: file.buffer
      };

      s3.upload(params, (err, data) => {
      if (err) return res.status(500).json({ message: 'S3 upload failed' });
      insertToDB(name, email, phone, time, mode, notes, data.Location, res);
    });
  } else {
    insertToDB(name, email, phone, time, mode, notes, null, res);
  }

});

// Start the server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
