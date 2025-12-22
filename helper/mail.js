// helper/mail.js
import nodemailer from 'nodemailer';

export const sendWelcomeEmail = async (to, tempPassword) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: +process.env.SMTP_PORT,
    secure: true, // or false if you’re using STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Your App Name" <no-reply@yourapp.com>`,
    to,
    subject: "Your new account",
    text: `
      Welcome!  
      Your account has been created and your temporary password is:

      ${tempPassword}

      Please log in and change it ASAP.
    `,
  });
};


//SMTP_HOST=smtp.gmail.com
//SMTP_PORT=465
//SMTP_USER=youremail@gmail.com
//SMTP_PASS=UJkl-12ab-CD34-efgh
