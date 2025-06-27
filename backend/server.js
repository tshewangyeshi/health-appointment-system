const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const AWS = require('aws-sdk');

// AWS Configuration
AWS.config.update({ region: 'us-east-1' });
const s3 = new AWS.S3();
const sns = new AWS.SNS();
const SNS_TOPIC_ARN = 'arn:aws:sns:us-east-1:484954965732:appointment-reminders'; // Replace with your topic ARN

// Express setup
const app = express();
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());
const upload = multer({ storage: multer.memoryStorage() });

// MySQL RDS Connection
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

// POST route to handle appointment booking
app.post('/appointments', upload.single('document'), async (req, res) => {
  try {
    const { name, email, phone, time, mode, notes } = req.body;
    const file = req.file;
    let fileUrl = null;

    // Upload to S3 if file is present
    if (file) {
      const params = {
        Bucket: 'healthcare-patient-docs', // ✅ Replace with your actual bucket name
        Key: `documents/${Date.now()}-${file.originalname}`,
        Body: file.buffer
      };

      const uploadResult = await s3.upload(params).promise();
      fileUrl = uploadResult.Location;
      console.log('File uploaded to S3:', fileUrl);
    }

    // Insert appointment into MySQL
    const sql = `INSERT INTO appointments (name, email, phone, time, mode, notes, file_url) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.query(sql, [name, email, phone, time, mode, notes, fileUrl], async (err, result) => {
      if (err) {
        console.error('MySQL error:', err);
        return res.status(500).json({ message: 'Database insert failed' });
      }

      // Send SNS notification
      const message = `New appointment booked by ${name}.\nTime: ${time}\nMode: ${mode}\nContact: ${email}, ${phone}`;
      try {
        await sns.publish({
          Message: message,
          Subject: 'New Appointment Booking',
          TopicArn: SNS_TOPIC_ARN
        }).promise();
        console.log('SNS notification sent');
      } catch (snsErr) {
        console.error('SNS publish failed:', snsErr);
      }

      res.status(200).json({ message: 'Appointment booked successfully!', fileUrl });
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ message: 'Unexpected server error' });
  }
});

// Start server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
