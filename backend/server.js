const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({ region: 'us-east-1' });
const s3 = new AWS.S3();
const sns = new AWS.SNS();
const SNS_TOPIC_ARN = 'arn:aws:sns:us-east-1:484954965732:appointment-reminders'; // Replace with your actual ARN

// Express app setup
const app = express();
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

// Setup multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Connect to RDS MySQL
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

// Handle appointment submissions
app.post('/appointments', upload.single('document'), async (req, res) => {
  const { name, email, phone, time, mode, notes } = req.body;
  const file = req.file;
  let fileUrl = null;

  // Upload file to S3 if attached
  if (file) {
    const params = {
      Bucket: 'your-s3-bucket-name', // replace with actual bucket
      Key: `documents/${Date.now()}-${file.originalname}`,
      Body: file.buffer
    };

    try {
      const s3Response = await s3.upload(params).promise();
      fileUrl = s3Response.Location;
      console.log('File uploaded to S3:', fileUrl);
    } catch (uploadErr) {
      console.error('S3 upload error:', uploadErr);
      return res.status(500).json({ message: 'Failed to upload document to S3' });
    }
  }

  // Insert into MySQL
  const sql = 'INSERT INTO appointments (name, email, phone, time, mode, notes, file_url) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.query(sql, [name, email, phone, time, mode, notes, fileUrl], async (err, result) => {
    if (err) {
      console.error('MySQL error:', err);
      return res.status(500).json({ message: 'Database insert failed' });
    }

    // Send notification using SNS
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

    res.status(200).json({ message: 'Appointment booked successfully!', fileUrl });
  });
});

// Start server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
