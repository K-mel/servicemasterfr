// backend/src/utils/email.ts
import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Service d'envoi d'emails
 */
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  // Créer un transporteur Nodemailer
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.example.com",
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER || "user@example.com",
      pass: process.env.EMAIL_PASSWORD || "password",
    },
  });

  // Définir les options du mail
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || "ServiceMasterFR"}" <${
      process.env.EMAIL_FROM || "contact@servicemasterfr.fr"
    }>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  // Envoyer l'email
  await transporter.sendMail(mailOptions);
};

/**
 * Génération de templates d'emails
 */
export const emailTemplates = {
  // Template de bienvenue
  welcome: (name: string, actionUrl: string) => ({
    subject: "Bienvenue chez ServiceMasterFR",
    text: `Bonjour ${name}, bienvenue chez ServiceMasterFR ! Cliquez sur le lien suivant pour accéder à votre compte: ${actionUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1a365d; color: white; padding: 20px; text-align: center;">
          <h1>Bienvenue chez ServiceMasterFR</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
          <p>Bonjour ${name},</p>
          <p>Nous sommes ravis de vous accueillir chez ServiceMasterFR !</p>
          <p>Accédez à votre compte pour découvrir nos formations en sécurité et cybersécurité.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${actionUrl}" style="background-color: #2b6cb0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Accéder à mon compte
            </a>
          </div>
          <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
          <p>Cordialement,<br>L'équipe ServiceMasterFR</p>
        </div>
        <div style="background-color: #f7fafc; padding: 15px; font-size: 12px; text-align: center; color: #718096;">
          &copy; ${new Date().getFullYear()} ServiceMasterFR. Tous droits réservés.
        </div>
      </div>
    `,
  }),

  // Template de réinitialisation de mot de passe
  resetPassword: (resetUrl: string) => ({
    subject: "Réinitialisation de votre mot de passe",
    text: `Vous avez demandé une réinitialisation de mot de passe. Cliquez sur le lien suivant pour réinitialiser votre mot de passe: ${resetUrl} (valable 1 heure)`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1a365d; color: white; padding: 20px; text-align: center;">
          <h1>Réinitialisation de mot de passe</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
          <p>Vous avez demandé une réinitialisation de votre mot de passe.</p>
          <p>Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #2b6cb0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Réinitialiser mon mot de passe
            </a>
          </div>
          <p>Ce lien est valable pendant 1 heure.</p>
          <p>Si vous n'avez pas fait cette demande, vous pouvez
          // Suite du fichier backend/src/utils/email.ts

// Template de réinitialisation de mot de passe (suite)
          <p>Si vous n'avez pas fait cette demande, vous pouvez ignorer cet email en toute sécurité.</p>
          <p>Cordialement,<br>L'équipe ServiceMasterFR</p>
        </div>
        <div style="background-color: #f7fafc; padding: 15px; font-size: 12px; text-align: center; color: #718096;">
          &copy; ${new Date().getFullYear()} ServiceMasterFR. Tous droits réservés.
        </div>
      </div>
    `,
  }),

  // Template de confirmation d'achat
  purchaseConfirmation: (
    name: string,
    courseName: string,
    amount: number,
    invoiceUrl: string
  ) => ({
    subject: "Confirmation de votre achat chez ServiceMasterFR",
    text: `Bonjour ${name}, merci pour votre achat de "${courseName}" pour ${amount}€. Vous pouvez consulter votre facture à l'adresse suivante: ${invoiceUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1a365d; color: white; padding: 20px; text-align: center;">
          <h1>Confirmation d'achat</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
          <p>Bonjour ${name},</p>
          <p>Nous vous remercions pour votre achat !</p>
          <div style="background-color: #f7fafc; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin-top: 0;">Détails de votre commande :</h3>
            <p><strong>Formation :</strong> ${courseName}</p>
            <p><strong>Montant :</strong> ${amount}€</p>
          </div>
          <p>Vous pouvez dès maintenant accéder à votre formation dans votre espace personnel.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invoiceUrl}" style="background-color: #2b6cb0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Voir ma facture
            </a>
          </div>
          <p>Si vous avez des questions concernant votre achat, n'hésitez pas à nous contacter.</p>
          <p>Cordialement,<br>L'équipe ServiceMasterFR</p>
        </div>
        <div style="background-color: #f7fafc; padding: 15px; font-size: 12px; text-align: center; color: #718096;">
          &copy; ${new Date().getFullYear()} ServiceMasterFR. Tous droits réservés.
        </div>
      </div>
    `,
  }),

  // Template de notification pour événement important
  notification: (
    name: string,
    message: string,
    actionUrl: string,
    actionLabel: string
  ) => ({
    subject: "Notification importante - ServiceMasterFR",
    text: `Bonjour ${name}, ${message}. Pour en savoir plus: ${actionUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1a365d; color: white; padding: 20px; text-align: center;">
          <h1>Notification importante</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
          <p>Bonjour ${name},</p>
          <p>${message}</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${actionUrl}" style="background-color: #2b6cb0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              ${actionLabel}
            </a>
          </div>
          <p>Cordialement,<br>L'équipe ServiceMasterFR</p>
        </div>
        <div style="background-color: #f7fafc; padding: 15px; font-size: 12px; text-align: center; color: #718096;">
          &copy; ${new Date().getFullYear()} ServiceMasterFR. Tous droits réservés.
        </div>
      </div>
    `,
  }),
};

export default {
  sendEmail,
  emailTemplates,
};
