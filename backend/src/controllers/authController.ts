// backend/src/controllers/authController.ts
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User";
import {
  AppError,
  badRequest,
  notFound,
  unauthorized,
} from "../middleware/errorHandler";
import { sendEmail } from "../utils/email";
import speakeasy from "speakeasy";
import qrcode from "qrcode";

// Interface pour les requêtes authentifiées
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    twoFactorEnabled?: boolean;
  };
}

/**
 * Inscription d'un nouvel utilisateur
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password } = req.body;

    // Vérifier si l'email est déjà utilisé
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw badRequest("Cet email est déjà utilisé");
    }

    // Créer le token de vérification d'email
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiration = new Date();
    tokenExpiration.setHours(tokenExpiration.getHours() + 24); // Validité de 24h

    // Créer l'utilisateur
    const user = await User.create({
      name,
      email,
      password,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: tokenExpiration,
      isEmailVerified: false,
    });

    // Construire l'URL de vérification
    const verificationUrl = `${process.env.FRONTEND_URL}/auth/verify-email/${verificationToken}`;

    // Envoyer l'email de vérification
    await sendEmail({
      to: email,
      subject: "ServiceMasterFR - Vérification de votre compte",
      text: `Bienvenue chez ServiceMasterFR ! Veuillez vérifier votre adresse email en cliquant sur le lien suivant: ${verificationUrl}`,
      html: `
        <h1>Bienvenue chez ServiceMasterFR !</h1>
        <p>Veuillez vérifier votre adresse email en cliquant sur le lien ci-dessous:</p>
        <p><a href="${verificationUrl}">Vérifier mon email</a></p>
        <p>Ce lien est valable pendant 24 heures.</p>
        <p>Si vous n'avez pas créé de compte, veuillez ignorer cet email.</p>
      `,
    });

    // Retourner la réponse sans le mot de passe
    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.emailVerificationToken;

    res.status(201).json({
      status: "success",
      message: "Compte créé avec succès. Veuillez vérifier votre email.",
      data: { user: userObject },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Vérification de l'email après inscription
 */
export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.params;

    // Rechercher l'utilisateur avec ce token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      throw badRequest("Le token de vérification est invalide ou a expiré");
    }

    // Mettre à jour l'utilisateur
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({
      status: "success",
      message:
        "Email vérifié avec succès. Vous pouvez maintenant vous connecter.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Renvoyer l'email de vérification
 */
export const resendVerificationEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw badRequest("Email requis");
    }

    // Rechercher l'utilisateur
    const user = await User.findOne({ email });

    if (!user) {
      throw notFound("Aucun utilisateur trouvé avec cet email");
    }

    if (user.isEmailVerified) {
      throw badRequest("Cet email est déjà vérifié");
    }

    // Générer un nouveau token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiration = new Date();
    tokenExpiration.setHours(tokenExpiration.getHours() + 24);

    // Mettre à jour l'utilisateur
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = tokenExpiration;
    await user.save();

    // Construire l'URL de vérification
    const verificationUrl = `${process.env.FRONTEND_URL}/auth/verify-email/${verificationToken}`;

    // Envoyer l'email
    await sendEmail({
      to: email,
      subject: "ServiceMasterFR - Vérification de votre compte (renvoi)",
      text: `Veuillez vérifier votre adresse email en cliquant sur le lien suivant: ${verificationUrl}`,
      html: `
        <h1>Vérification de votre compte</h1>
        <p>Veuillez vérifier votre adresse email en cliquant sur le lien ci-dessous:</p>
        <p><a href="${verificationUrl}">Vérifier mon email</a></p>
        <p>Ce lien est valable pendant 24 heures.</p>
      `,
    });

    res.status(200).json({
      status: "success",
      message: "Email de vérification renvoyé avec succès",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Connexion d'un utilisateur
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, twoFactorCode } = req.body;

    // Vérifier que l'email et le mot de passe sont fournis
    if (!email || !password) {
      throw badRequest("Email et mot de passe requis");
    }

    // Rechercher l'utilisateur
    const user = await User.findOne({ email }).select(
      "+password +twoFactorSecret"
    );

    if (!user) {
      throw unauthorized("Email ou mot de passe incorrect");
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw unauthorized("Email ou mot de passe incorrect");
    }

    // Vérifier si l'email a été vérifié
    if (!user.isEmailVerified) {
      throw unauthorized(
        "Veuillez vérifier votre email avant de vous connecter"
      );
    }

    // Vérifier si l'utilisateur est actif
    if (!user.isActive) {
      throw unauthorized("Votre compte a été désactivé");
    }

    // Vérifier l'authentification à deux facteurs si elle est activée
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        return res.status(200).json({
          status: "requires2FA",
          message:
            "Veuillez fournir le code d'authentification à deux facteurs",
          userId: user._id,
        });
      }

      // Vérifier le code
      const isValid = speakeasy.totp.verify({
        secret: user.twoFactorSecret as string,
        encoding: "base32",
        token: twoFactorCode,
      });

      if (!isValid) {
        throw unauthorized("Code d'authentification à deux facteurs invalide");
      }
    }

    // Générer le token JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "defaultsecret",
      { expiresIn: "7d" }
    );

    // Mettre à jour le dernier login
    user.lastLogin = new Date();
    await user.save();

    // Nettoyer les données sensibles
    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.twoFactorSecret;
    delete userObject.resetPasswordToken;
    delete userObject.resetPasswordExpire;

    // Envoyer la réponse
    res.status(200).json({
      status: "success",
      token,
      data: { user: userObject },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Déconnexion (côté client)
 * Note: En réalité, la déconnexion est gérée côté client en supprimant le token
 */
export const logout = (req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "Déconnexion réussie",
  });
};

/**
 * Mot de passe oublié - envoi d'un email pour réinitialiser
 */
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw badRequest("Email requis");
    }

    // Rechercher l'utilisateur
    const user = await User.findOne({ email });

    // Si l'utilisateur n'existe pas, ne pas révéler cette information pour des raisons de sécurité
    if (!user) {
      return res.status(200).json({
        status: "success",
        message:
          "Si cet email existe, vous recevrez les instructions de réinitialisation",
      });
    }

    // Générer un token de réinitialisation
    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Enregistrer le token dans la base de données
    user.resetPasswordToken = tokenHash;
    user.resetPasswordExpire = new Date(Date.now() + 3600000); // 1 heure
    await user.save();

    // URL de réinitialisation
    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password/${resetToken}`;

    try {
      // Envoyer l'email
      await sendEmail({
        to: user.email,
        subject: "ServiceMasterFR - Réinitialisation de votre mot de passe",
        text: `Vous avez demandé une réinitialisation de mot de passe. Cliquez sur le lien suivant pour réinitialiser votre mot de passe : ${resetUrl} - Ce lien est valable pendant 1 heure.`,
        html: `
          <h1>Réinitialisation de votre mot de passe</h1>
          <p>Vous avez demandé une réinitialisation de mot de passe.</p>
          <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
          <p><a href="${resetUrl}">Réinitialiser mon mot de passe</a></p>
          <p>Ce lien est valable pendant 1 heure.</p>
          <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.</p>
        `,
      });

      res.status(200).json({
        status: "success",
        message: "Email de réinitialisation envoyé avec succès",
      });
    } catch (error) {
      // En cas d'erreur, réinitialiser le token
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      throw new AppError(
        "Erreur lors de l'envoi de l'email de réinitialisation",
        500
      );
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Réinitialisation du mot de passe avec le token reçu par email
 */
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      throw badRequest("Nouveau mot de passe requis");
    }

    if (password.length < 8) {
      throw badRequest("Le mot de passe doit contenir au moins 8 caractères");
    }

    // Hacher le token reçu
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Rechercher l'utilisateur avec ce token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: new Date() },
    });

    if (!user) {
      throw badRequest("Le token de réinitialisation est invalide ou a expiré");
    }

    // Mettre à jour le mot de passe
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Envoyer un email de confirmation
    await sendEmail({
      to: user.email,
      subject: "ServiceMasterFR - Votre mot de passe a été modifié",
      text: "Votre mot de passe a été réinitialisé avec succès.",
      html: `
        <h1>Mot de passe réinitialisé</h1>
        <p>Votre mot de passe a été réinitialisé avec succès.</p>
        <p>Si vous n'êtes pas à l'origine de cette action, veuillez nous contacter immédiatement.</p>
      `,
    });

    res.status(200).json({
      status: "success",
      message: "Mot de passe réinitialisé avec succès",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Vérification du token JWT
 */
export const verifyToken = (req: AuthRequest, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "Token valide",
    data: { user: req.user },
  });
};

/**
 * Modification du mot de passe (utilisateur connecté)
 */
export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw unauthorized("Utilisateur non authentifié");
    }

    if (!currentPassword || !newPassword) {
      throw badRequest("Mot de passe actuel et nouveau mot de passe requis");
    }

    if (newPassword.length < 8) {
      throw badRequest(
        "Le nouveau mot de passe doit contenir au moins 8 caractères"
      );
    }

    // Récupérer l'utilisateur avec son mot de passe
    const user = await User.findById(userId).select("+password");

    if (!user) {
      throw notFound("Utilisateur non trouvé");
    }

    // Vérifier le mot de passe actuel
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw unauthorized("Mot de passe actuel incorrect");
    }

    // Mettre à jour le mot de passe
    user.password = newPassword;
    await user.save();

    // Envoyer un email de confirmation
    await sendEmail({
      to: user.email,
      subject: "ServiceMasterFR - Votre mot de passe a été modifié",
      text: "Votre mot de passe a été modifié avec succès.",
      html: `
        <h1>Mot de passe modifié</h1>
        <p>Votre mot de passe a été modifié avec succès.</p>
        <p>Si vous n'êtes pas à l'origine de cette action, veuillez nous contacter immédiatement.</p>
      `,
    });

    res.status(200).json({
      status: "success",
      message: "Mot de passe modifié avec succès",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Configuration de l'authentification à deux facteurs
 */
export const setupTwoFactor = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw unauthorized("Utilisateur non authentifié");
    }

    // Récupérer l'utilisateur
    const user = await User.findById(userId);

    if (!user) {
      throw notFound("Utilisateur non trouvé");
    }

    // Générer un secret pour l'authentification à deux facteurs
    const secret = speakeasy.generateSecret({
      length: 20,
      name: `ServiceMasterFR:${user.email}`,
    });

    // Stocker temporairement le secret (il sera activé après vérification)
    user.twoFactorSecret = secret.base32;
    user.twoFactorEnabled = false;
    await user.save();

    // Générer un QR code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url || "");

    res.status(200).json({
      status: "success",
      message: "Configuration de l'authentification à deux facteurs initiée",
      data: {
        secret: secret.base32,
        qrCode: qrCodeUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Vérification de l'authentification à deux facteurs
 */
export const verifyTwoFactor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      throw badRequest("ID utilisateur et token requis");
    }

    // Récupérer l'utilisateur
    const user = await User.findById(userId).select("+twoFactorSecret");

    if (!user) {
      throw notFound("Utilisateur non trouvé");
    }

    // Vérifier le token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret as string,
      encoding: "base32",
      token: token,
    });

    if (!verified) {
      throw badRequest("Code d'authentification invalide");
    }

    // Si c'est une première configuration, activer l'authentification à deux facteurs
    if (!user.twoFactorEnabled) {
      user.twoFactorEnabled = true;
      await user.save();

      // Envoyer un email de confirmation
      await sendEmail({
        to: user.email,
        subject: "ServiceMasterFR - Authentification à deux facteurs activée",
        text: "L'authentification à deux facteurs a été activée sur votre compte.",
        html: `
          <h1>Authentification à deux facteurs activée</h1>
          <p>L'authentification à deux facteurs a été activée sur votre compte.</p>
          <p>Si vous n'êtes pas à l'origine de cette action, veuillez nous contacter immédiatement.</p>
        `,
      });
    }

    // Si c'est pour une connexion, générer un token JWT
    const jwtToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "defaultsecret",
      { expiresIn: "7d" }
    );

    // Mettre à jour le dernier login
    user.lastLogin = new Date();
    await user.save();

    // Nettoyer les données sensibles
    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.twoFactorSecret;
    delete userObject.resetPasswordToken;
    delete userObject.resetPasswordExpire;

    res.status(200).json({
      status: "success",
      message: "Authentification à deux facteurs réussie",
      token: jwtToken,
      data: { user: userObject },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Désactivation de l'authentification à deux facteurs
 */
export const disableTwoFactor = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { password } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw unauthorized("Utilisateur non authentifié");
    }

    if (!password) {
      throw badRequest(
        "Mot de passe requis pour désactiver l'authentification à deux facteurs"
      );
    }

    // Récupérer l'utilisateur avec son mot de passe
    const user = await User.findById(userId).select("+password");

    if (!user) {
      throw notFound("Utilisateur non trouvé");
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw unauthorized("Mot de passe incorrect");
    }

    // Désactiver l'authentification à deux facteurs
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();

    // Envoyer un email de confirmation
    await sendEmail({
      to: user.email,
      subject: "ServiceMasterFR - Authentification à deux facteurs désactivée",
      text: "L'authentification à deux facteurs a été désactivée sur votre compte.",
      html: `
        <h1>Authentification à deux facteurs désactivée</h1>
        <p>L'authentification à deux facteurs a été désactivée sur votre compte.</p>
        <p>Si vous n'êtes pas à l'origine de cette action, veuillez nous contacter immédiatement.</p>
      `,
    });

    res.status(200).json({
      status: "success",
      message: "Authentification à deux facteurs désactivée avec succès",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupération des informations de l'utilisateur connecté
 */
export const getCurrentUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw unauthorized("Utilisateur non authentifié");
    }

    // Récupérer l'utilisateur complet
    const user = await User.findById(userId).select(
      "-password -twoFactorSecret"
    );

    if (!user) {
      throw notFound("Utilisateur non trouvé");
    }

    res.status(200).json({
      status: "success",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mise à jour des informations de l'utilisateur
 */
export const updateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw unauthorized("Utilisateur non authentifié");
    }

    // Champs autorisés pour la mise à jour
    const allowedFields = ["name", "phone", "address"];
    const updateData: Record<string, any> = {};

    // Filtrer les champs autorisés
    Object.keys(req.body).forEach((key) => {
      if (allowedFields.includes(key)) {
        updateData[key] = req.body[key];
      }
    });

    // Mettre à jour l'utilisateur
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password -twoFactorSecret");

    if (!updatedUser) {
      throw notFound("Utilisateur non trouvé");
    }

    res.status(200).json({
      status: "success",
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};
