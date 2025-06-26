const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// configure region and credentials (optional if using IAM role on EC2)
AWS.config.update({ region: 'us-east-1' });

const s3 = new AWS.S3();

const uploadFile = () => {
  const filePath = path.join(__dirname, 'uploads', 'doc.pdf');
  const fileContent = fs.readFileSync(filePath);

  const params = {
    Bucket: 'healthcare-patient-docs',
    Key: 'documents/doc.pdf', // where it will be saved in S3
    Body: fileContent,
    ContentType: 'application/pdf'
  };

  s3.upload(params, (err, data) => {
    if (err) {
      console.error('Upload failed:', err);
    } else {
      console.log('Uploaded successfully:', data.Location);
    }
  });
};

uploadFile();
