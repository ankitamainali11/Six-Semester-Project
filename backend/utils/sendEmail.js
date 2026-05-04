const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text) => {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 587);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const service = process.env.EMAIL_SERVICE;

  let transporter;

  if (service || host) {
    transporter = nodemailer.createTransport(
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
  } else if (process.env.NODE_ENV !== 'production') {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.warn('No SMTP settings found. Using Ethereal test SMTP account for development.');
  } else {
    throw new Error('Email configuration is missing. Set EMAIL_SERVICE or EMAIL_HOST/EMAIL_PORT/EMAIL_USER/EMAIL_PASS.');
  }

  const mail = {
    from: `"Volunteer System" <${user || 'no-reply@volunteer-system.local'}>`,
    to,
    subject,
    text,
  };

  try {
    const info = await transporter.sendMail(mail);
    if (process.env.NODE_ENV !== 'production') {
      console.log('Email sent:', info?.messageId || info);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('Preview URL:', previewUrl);
      }
    }
    return info;
  } catch (err) {
    console.error('sendEmail error:', err?.message || err);
    throw err;
  }
};

module.exports = sendEmail;
