import express from "express";
import * as authController from "../controllers/authController";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

/**
 * Routes d'authentification
 */

// Inscription
router.post("/register", authController.register);

// Vérification d'email
router.get("/verify-email/:token", authController.verifyEmail);

// Demande de renvoi du mail de vérification
router.post("/resend-verification", authController.resendVerificationEmail);

// Connexion
router.post("/login", authController.login);

// Déconnexion
router.post("/logout", authMiddleware, authController.logout);

// Mot de passe oublié
router.post("/forgot-password", authController.forgotPassword);

// Réinitialisation du mot de passe
router.post("/reset-password/:token", authController.resetPassword);

// Vérification du token JWT
router.get("/verify-token", authMiddleware, authController.verifyToken);

// Modification du mot de passe
router.post("/change-password", authMiddleware, authController.changePassword);

// Configuration de l'authentification à deux facteurs
router.post("/2fa/setup", authMiddleware, authController.setupTwoFactor);

// Vérification de l'authentification à deux facteurs
router.post("/2fa/verify", authController.verifyTwoFactor);

// Désactivation de l'authentification à deux facteurs
router.post("/2fa/disable", authMiddleware, authController.disableTwoFactor);

// Récupération des informations utilisateur
router.get("/me", authMiddleware, authController.getCurrentUser);

// Mise à jour des informations utilisateur
router.put("/me", authMiddleware, authController.updateUser);

export default router;
