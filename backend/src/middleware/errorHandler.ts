// backend/src/middleware/errorHandler.ts

import { NextFunction, Request, Response } from "express";

// Définition de la classe AppError avec une propriété 'type'
export class AppError extends Error {
  statusCode: number;
  type: string; // Ajout de la propriété manquante 'type'
  isOperational: boolean;

  constructor(message: string, statusCode: number, type: string = "error") {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.isOperational = true;

    // Capture la stack trace (utile pour le débogage)
    Error.captureStackTrace(this, this.constructor);
  }
}

// Middleware de gestion des erreurs
export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  _next: NextFunction // Utilisez '_next' pour indiquer que c'est délibérément non utilisé
) => {
  // Si c'est une instance de AppError, on utilise ses propriétés
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.type,
      message: err.message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }

  // Pour les erreurs non gérées
  console.error("ERREUR NON GÉRÉE:", err);

  return res.status(500).json({
    status: "error",
    message: "Une erreur inattendue s'est produite",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// Fonction pour créer des erreurs 404 facilement
export const notFound = (message: string = "Ressource non trouvée") => {
  return new AppError(message, 404, "fail");
};

// Fonction pour créer des erreurs d'authentification
export const unauthorized = (message: string = "Non autorisé") => {
  return new AppError(message, 401, "fail");
};

// Fonction pour créer des erreurs de validation
export const badRequest = (message: string = "Requête invalide") => {
  return new AppError(message, 400, "fail");
};
