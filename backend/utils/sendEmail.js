const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text) => {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 587);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const service = process.env.EMAIL_SERVICE;

  const transporter = nodemailer.createTransport(
    service
      ? {
          service,
          auth: { user, pass },
        }
      : {
          host,
          port,
          secure: port === 465, 
          auth: { user, pass },
        }
  );

  const mail = {
    from: `"Volunteer System" <${user}>`,
    to,
    subject,
    text,
  };

  try {
    const info = await transporter.sendMail(mail);
    if (process.env.NODE_ENV !== 'production') {
      console.log('Email sent:', info?.messageId || info);
    }
    return info;
  } catch (err) {
    console.error('sendEmail error:', err?.message || err);
    throw err;
  }
};

module.exports = sendEmail;