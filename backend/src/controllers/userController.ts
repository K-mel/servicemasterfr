// backend/src/controllers/userController.ts
import { Request, Response, NextFunction } from "express";
import User from "../models/User";
import {
  AppError,
  notFound,
  unauthorized,
  badRequest,
} from "../middleware/errorHandler";

// Type pour les requêtes authentifiées
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Récupérer le profil de l'utilisateur connecté
 */
export const getUserProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw unauthorized("Utilisateur non authentifié");
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      throw notFound("Utilisateur non trouvé");
    }

    res.status(200).json({
      status: "success",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mettre à jour le profil de l'utilisateur connecté
 */
export const updateUserProfile = async (
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
    const allowedFields = ["name", "email", "phone", "address"];
    const updateData: Record<string, any> = {};

    // Filtrer les champs autorisés
    Object.keys(req.body).forEach((key) => {
      if (allowedFields.includes(key)) {
        updateData[key] = req.body[key];
      }
    });

    // Options: new = true retourne le document mis à jour
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      throw notFound("Utilisateur non trouvé");
    }

    res.status(200).json({
      status: "success",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer les formations de l'utilisateur connecté
 */
export const getUserCourses = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw unauthorized("Utilisateur non authentifié");
    }

    const user = await User.findById(userId)
      .populate("courses.courseId")
      .select("courses");

    if (!user) {
      throw notFound("Utilisateur non trouvé");
    }

    res.status(200).json({
      status: "success",
      data: user.courses,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer tous les utilisateurs (admin)
 */
export const getAllUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find().select("-password").skip(skip).limit(limit);

    const total = await User.countDocuments();

    res.status(200).json({
      status: "success",
      results: users.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer un utilisateur par son ID (admin)
 */
export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      throw notFound("Utilisateur non trouvé");
    }

    res.status(200).json({
      status: "success",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mettre à jour un utilisateur (admin)
 */
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    // Vérifier si l'utilisateur existe
    const userExists = await User.findById(userId);

    if (!userExists) {
      throw notFound("Utilisateur non trouvé");
    }

    // Champs autorisés pour la mise à jour (admin a plus de droits)
    const allowedFields = [
      "name",
      "email",
      "role",
      "phone",
      "address",
      "isActive",
    ];
    const updateData: Record<string, any> = {};

    // Filtrer les champs autorisés
    Object.keys(req.body).forEach((key) => {
      if (allowedFields.includes(key)) {
        updateData[key] = req.body[key];
      }
    });

    // Mise à jour de l'utilisateur
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json({
      status: "success",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Supprimer un utilisateur (admin)
 */
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      throw notFound("Utilisateur non trouvé");
    }

    res.status(200).json({
      status: "success",
      message: "Utilisateur supprimé avec succès",
    });
  } catch (error) {
    next(error);
  }
};
