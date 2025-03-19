// backend/src/routes/userRoutes.ts
import express from "express";
import * as userController from "../controllers/userController";
import { adminMiddleware, authMiddleware } from "../middleware/auth";

const router = express.Router();

// Routes publiques (aucune)

// Routes protégées (nécessitent une authentification)
router.get("/profile", authMiddleware, userController.getUserProfile);
router.put("/profile", authMiddleware, userController.updateUserProfile);
router.get("/courses", authMiddleware, userController.getUserCourses);

// Routes administrateur (nécessitent un rôle admin)
router.get(
  "/admin/users",
  authMiddleware,
  adminMiddleware,
  userController.getAllUsers
);
router.get(
  "/admin/users/:userId",
  authMiddleware,
  adminMiddleware,
  userController.getUserById
);
router.put(
  "/admin/users/:userId",
  authMiddleware,
  adminMiddleware,
  userController.updateUser
);
router.delete(
  "/admin/users/:userId",
  authMiddleware,
  adminMiddleware,
  userController.deleteUser
);

export default router;
