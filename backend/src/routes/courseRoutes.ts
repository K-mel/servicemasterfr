import express from "express";
import * as courseController from "../controllers/courseController";
import {
  adminMiddleware,
  authMiddleware,
  instructorMiddleware,
} from "../middleware/auth";

const router = express.Router();

/**
 * Routes publiques pour les formations
 */

// Récupérer toutes les formations publiées
router.get("/", courseController.getAllPublishedCourses);

// Récupérer les formations en vedette
router.get("/featured", courseController.getFeaturedCourses);

// Récupérer les formations par catégorie
router.get("/category/:category", courseController.getCoursesByCategory);

// Recherche de formations
router.get("/search", courseController.searchCourses);

// Récupérer une formation spécifique par slug
router.get("/:slug", courseController.getCourseBySlug);

/**
 * Routes protégées (utilisateur connecté)
 */

// Récupérer les formations achetées par l'utilisateur
router.get(
  "/my/purchased",
  authMiddleware,
  courseController.getPurchasedCourses
);

// Accéder au contenu d'une formation achetée
router.get(
  "/my/purchased/:courseId",
  authMiddleware,
  courseController.getCourseLessons
);

// Marquer un chapitre comme terminé
router.post(
  "/my/progress",
  authMiddleware,
  courseController.markChapterAsCompleted
);

// Soumettre une demande d'accès pour les formations nécessitant une vérification
router.post(
  "/:courseId/request-access",
  authMiddleware,
  courseController.requestCourseAccess
);

/**
 * Routes administratives (admin et instructeurs)
 */

// Récupérer toutes les formations (publiées et non publiées)
router.get(
  "/admin/all",
  authMiddleware,
  adminMiddleware,
  courseController.getAllCourses
);

// Créer une nouvelle formation
router.post(
  "/",
  authMiddleware,
  instructorMiddleware,
  courseController.createCourse
);

// Mettre à jour une formation
router.put(
  "/:courseId",
  authMiddleware,
  instructorMiddleware,
  courseController.updateCourse
);

// Supprimer une formation
router.delete(
  "/:courseId",
  authMiddleware,
  adminMiddleware,
  courseController.deleteCourse
);

// Gérer le statut de publication d'une formation
router.patch(
  "/:courseId/publish",
  authMiddleware,
  instructorMiddleware,
  courseController.toggleCoursePublished
);

// Gérer le statut "en vedette" d'une formation
router.patch(
  "/:courseId/featured",
  authMiddleware,
  adminMiddleware,
  courseController.toggleCourseFeatured
);

// Ajouter un chapitre à une formation
router.post(
  "/:courseId/chapters",
  authMiddleware,
  instructorMiddleware,
  courseController.addChapter
);

// Mettre à jour un chapitre
router.put(
  "/:courseId/chapters/:chapterId",
  authMiddleware,
  instructorMiddleware,
  courseController.updateChapter
);

// Supprimer un chapitre
router.delete(
  "/:courseId/chapters/:chapterId",
  authMiddleware,
  instructorMiddleware,
  courseController.deleteChapter
);

// Réorganiser les chapitres
router.patch(
  "/:courseId/chapters/reorder",
  authMiddleware,
  instructorMiddleware,
  courseController.reorderChapters
);

// Approuver une demande d'accès à une formation
router.post(
  "/access-requests/:requestId/approve",
  authMiddleware,
  adminMiddleware,
  courseController.approveAccessRequest
);

// Refuser une demande d'accès à une formation
router.post(
  "/access-requests/:requestId/deny",
  authMiddleware,
  adminMiddleware,
  courseController.denyAccessRequest
);

export default router;
