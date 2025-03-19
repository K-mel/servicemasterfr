import { Request, Response } from "express";
import db from "../config/database";

// Récupérer toutes les formations
export const getAllCourses = async (req: Request, res: Response) => {
  try {
    const result = await db.query(
      "SELECT id, title, description, thumbnail_url, price, level, duration, created_at FROM courses WHERE is_active = true ORDER BY created_at DESC"
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Erreur lors de la récupération des formations:", error);
    res.status(500).json({
      message: "Erreur serveur lors de la récupération des formations",
    });
  }
};

// Récupérer une formation par son ID
export const getCourseById = async (req: Request, res: Response) => {
  try {
    const courseId = req.params.id;

    const result = await db.query(
      "SELECT c.*, array_agg(distinct s.title) as sections FROM courses c " +
        "LEFT JOIN course_sections s ON c.id = s.course_id " +
        "WHERE c.id = $1 AND c.is_active = true " +
        "GROUP BY c.id",
      [courseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Formation non trouvée" });
    }

    const course = result.rows[0];

    // Récupérer les avis sur cette formation
    const reviewsResult = await db.query(
      "SELECT r.rating, r.comment, r.created_at, u.first_name, u.last_name " +
        "FROM reviews r " +
        "JOIN users u ON r.user_id = u.id " +
        "WHERE r.course_id = $1 " +
        "ORDER BY r.created_at DESC",
      [courseId]
    );

    res.status(200).json({
      ...course,
      reviews: reviewsResult.rows,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de la formation:", error);
    res.status(500).json({
      message: "Erreur serveur lors de la récupération de la formation",
    });
  }
};

// Créer une nouvelle formation (admin uniquement)
export const createCourse = async (req: Request, res: Response) => {
  try {
    // Vérifier si l'utilisateur est admin (implémenté dans le middleware)
    const {
      title,
      description,
      thumbnailUrl,
      price,
      level,
      duration,
      content,
    } = req.body;

    // Insérer la formation
    const result = await db.query(
      "INSERT INTO courses (title, description, thumbnail_url, price, level, duration, content, is_active, created_at) " +
        "VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW()) RETURNING *",
      [title, description, thumbnailUrl, price, level, duration, content]
    );

    const newCourse = result.rows[0];

    // Si des sections sont spécifiées, les ajouter également
    if (req.body.sections && Array.isArray(req.body.sections)) {
      for (const section of req.body.sections) {
        await db.query(
          "INSERT INTO course_sections (course_id, title, content, order_index) " +
            "VALUES ($1, $2, $3, $4)",
          [newCourse.id, section.title, section.content, section.orderIndex]
        );
      }
    }

    res.status(201).json({
      message: "Formation créée avec succès",
      course: newCourse,
    });
  } catch (error) {
    console.error("Erreur lors de la création de la formation:", error);
    res
      .status(500)
      .json({ message: "Erreur serveur lors de la création de la formation" });
  }
};

// Mettre à jour une formation (admin uniquement)
export const updateCourse = async (req: Request, res: Response) => {
  try {
    const courseId = req.params.id;
    const {
      title,
      description,
      thumbnailUrl,
      price,
      level,
      duration,
      content,
      isActive,
    } = req.body;

    // Vérifier si la formation existe
    const checkResult = await db.query("SELECT * FROM courses WHERE id = $1", [
      courseId,
    ]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "Formation non trouvée" });
    }

    // Mettre à jour la formation
    const result = await db.query(
      "UPDATE courses SET " +
        "title = COALESCE($1, title), " +
        "description = COALESCE($2, description), " +
        "thumbnail_url = COALESCE($3, thumbnail_url), " +
        "price = COALESCE($4, price), " +
        "level = COALESCE($5, level), " +
        "duration = COALESCE($6, duration), " +
        "content = COALESCE($7, content), " +
        "is_active = COALESCE($8, is_active), " +
        "updated_at = NOW() " +
        "WHERE id = $9 RETURNING *",
      [
        title,
        description,
        thumbnailUrl,
        price,
        level,
        duration,
        content,
        isActive,
        courseId,
      ]
    );

    // Si des sections sont spécifiées, les mettre à jour également
    if (req.body.sections && Array.isArray(req.body.sections)) {
      // D'abord, supprimer les sections existantes
      await db.query("DELETE FROM course_sections WHERE course_id = $1", [
        courseId,
      ]);

      // Ensuite, ajouter les nouvelles sections
      for (const section of req.body.sections) {
        await db.query(
          "INSERT INTO course_sections (course_id, title, content, order_index) " +
            "VALUES ($1, $2, $3, $4)",
          [courseId, section.title, section.content, section.orderIndex]
        );
      }
    }

    res.status(200).json({
      message: "Formation mise à jour avec succès",
      course: result.rows[0],
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la formation:", error);
    res.status(500).json({
      message: "Erreur serveur lors de la mise à jour de la formation",
    });
  }
};

// Supprimer une formation (admin uniquement)
export const deleteCourse = async (req: Request, res: Response) => {
  try {
    const courseId = req.params.id;

    // Vérifier si la formation existe
    const checkResult = await db.query("SELECT * FROM courses WHERE id = $1", [
      courseId,
    ]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "Formation non trouvée" });
    }

    // Supprimer les sections de la formation
    await db.query("DELETE FROM course_sections WHERE course_id = $1", [
      courseId,
    ]);

    // Supprimer la formation
    await db.query("DELETE FROM courses WHERE id = $1", [courseId]);

    res.status(200).json({ message: "Formation supprimée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de la formation:", error);
    res.status(500).json({
      message: "Erreur serveur lors de la suppression de la formation",
    });
  }
};

// Ajouter un avis sur une formation
export const addCourseReview = async (req: Request, res: Response) => {
  try {
    const courseId = req.params.id;
    const userId = (req as any).user.id;
    const { rating, comment } = req.body;

    // Vérifier si la formation existe
    const courseResult = await db.query("SELECT * FROM courses WHERE id = $1", [
      courseId,
    ]);
    if (courseResult.rows.length === 0) {
      return res.status(404).json({ message: "Formation non trouvée" });
    }

    // Vérifier si l'utilisateur a acheté la formation
    const purchaseResult = await db.query(
      "SELECT * FROM orders WHERE user_id = $1 AND course_id = $2 AND status = 'completed'",
      [userId, courseId]
    );

    if (purchaseResult.rows.length === 0) {
      return res.status(403).json({
        message: "Vous devez acheter cette formation avant de pouvoir la noter",
      });
    }

    // Vérifier si l'utilisateur a déjà noté cette formation
    const existingReviewResult = await db.query(
      "SELECT * FROM reviews WHERE user_id = $1 AND course_id = $2",
      [userId, courseId]
    );

    if (existingReviewResult.rows.length > 0) {
      // Mettre à jour l'avis existant
      await db.query(
        "UPDATE reviews SET rating = $1, comment = $2, updated_at = NOW() WHERE user_id = $3 AND course_id = $4",
        [rating, comment, userId, courseId]
      );

      return res.status(200).json({ message: "Avis mis à jour avec succès" });
    }

    // Ajouter un nouvel avis
    await db.query(
      "INSERT INTO reviews (user_id, course_id, rating, comment, created_at) VALUES ($1, $2, $3, $4, NOW())",
      [userId, courseId, rating, comment]
    );

    res.status(201).json({ message: "Avis ajouté avec succès" });
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'avis:", error);
    res
      .status(500)
      .json({ message: "Erreur serveur lors de l'ajout de l'avis" });
  }
};

// Récupérer les formations achetées par l'utilisateur connecté
export const getUserCourses = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const result = await db.query(
      "SELECT c.id, c.title, c.description, c.thumbnail_url, c.level, c.duration, o.created_at as purchase_date " +
        "FROM courses c " +
        "JOIN orders o ON c.id = o.course_id " +
        "WHERE o.user_id = $1 AND o.status = 'completed' " +
        "ORDER BY o.created_at DESC",
      [userId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des formations de l'utilisateur:",
      error
    );
    res.status(500).json({ message: "Erreur serveur" });
  }
};
