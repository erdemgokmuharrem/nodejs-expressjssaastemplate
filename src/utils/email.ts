import nodemailer from 'nodemailer';

// Email transporter oluşturur
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Şifre sıfırlama emaili gönderir
 */
export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
  firstName?: string
): Promise<void> => {
  const transporter = createTransporter();
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to: email,
    subject: 'Şifre Sıfırlama - ' + process.env.APP_NAME,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Merhaba ${firstName || 'Kullanıcı'},</h2>
        <p>Hesabınız için şifre sıfırlama talebinde bulundunuz.</p>
        <p>Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:</p>
        <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Şifremi Sıfırla
        </a>
        <p>Bu bağlantı 1 saat geçerlidir.</p>
        <p>Eğer bu talebi siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          ${process.env.APP_NAME} - ${process.env.APP_URL}
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Hoş geldin emaili gönderir
 */
export const sendWelcomeEmail = async (
  email: string,
  firstName?: string
): Promise<void> => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to: email,
    subject: 'Hoş Geldiniz - ' + process.env.APP_NAME,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hoş Geldiniz ${firstName || 'Kullanıcı'}!</h2>
        <p>${process.env.APP_NAME} ailesine katıldığınız için teşekkür ederiz.</p>
        <p>Hesabınız başarıyla oluşturuldu ve kullanıma hazır.</p>
        <a href="${process.env.FRONTEND_URL}/dashboard" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Dashboard'a Git
        </a>
        <hr>
        <p style="color: #666; font-size: 12px;">
          ${process.env.APP_NAME} - ${process.env.APP_URL}
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
