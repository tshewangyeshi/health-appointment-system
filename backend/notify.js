const AWS = require('aws-sdk');

// Region must match your topic
AWS.config.update({ region: 'us-east-1' });

const sns = new AWS.SNS();

const params = {
  Message: 'Reminder: You have an appointment in 1 hour.',
  Subject: 'Appointment Reminder',
  TopicArn: 'arn:aws:sns:us-east-1:123456789012:appointment-reminders' // Replace this with your actual ARN
};

sns.publish(params, (err, data) => {
  if (err) {
    console.error('Notification failed:', err);
  } else {
    console.log('Notification sent successfully:', data);
  }
});
