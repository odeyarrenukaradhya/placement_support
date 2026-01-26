import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const sendOTPEmail = async (to: string, otp: string) => {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: 'Your Login OTP',
    text: `Your OTP is ${otp}. It is valid for 5 minutes.`
  });
};
