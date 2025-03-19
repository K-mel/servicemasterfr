// backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { unauthorized } from "./errorHandler";

// Interface pour étendre la requête avec les informations utilisateur
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Middleware d'authentification qui vérifie le token JWT
 */
export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Récupérer le token du header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw unauthorized("Accès non autorisé. Token manquant");
    }

    const token = authHeader.split(" ")[1];

    // Vérifier le token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "defaultsecret"
    ) as {
      id: string;
      email: string;
      role: string;
    };

    // Rechercher l'utilisateur dans la base de données
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      throw unauthorized("Utilisateur introuvable ou token invalide");
    }

    // Vérifier si l'utilisateur est actif
    if (user.isActive === false) {
      throw unauthorized("Votre compte a été désactivé");
    }

    // Ajouter les informations utilisateur à la requête
    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(unauthorized("Token invalide ou expiré"));
    } else {
      next(error);
    }
  }
};

/**
 * Middleware pour vérifier si l'utilisateur est admin
 */
export const adminMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(unauthorized("Utilisateur non authentifié"));
  }

  if (req.user.role !== "admin") {
    return next(unauthorized("Accès réservé aux administrateurs"));
  }

  next();
};
