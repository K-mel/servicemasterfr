// backend/src/controllers/paymentController.ts
import { NextFunction, Request, Response } from "express";
import Stripe from "stripe";
import {
  AppError,
  badRequest,
  notFound,
  unauthorized,
} from "../middleware/errorHandler";
import Course from "../models/Course";
import Order from "../models/Order";
import User from "../models/User";

// Interface pour les requêtes authentifiées
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Initialisation de Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-02-15", // Utiliser la version actuelle de l'API Stripe
});

/**
 * Création d'une session de paiement Stripe
 */
export const createCheckoutSession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { courseId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw unauthorized("Utilisateur non authentifié");
    }

    if (!courseId) {
      throw badRequest("ID de formation manquant");
    }

    // Récupérer les informations du cours
    const course = await Course.findById(courseId);
    if (!course) {
      throw notFound("Formation non trouvée");
    }

    // Récupérer les informations de l'utilisateur
    const user = await User.findById(userId);
    if (!user) {
      throw notFound("Utilisateur non trouvé");
    }

    // Vérifier si l'utilisateur a déjà acheté ce cours
    const alreadyPurchased = user.courses.some(
      (userCourse) => userCourse.courseId.toString() === courseId
    );

    if (alreadyPurchased) {
      throw badRequest("Vous avez déjà acheté cette formation");
    }

    // Créer la session de paiement Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: course.title,
              description: course.shortDescription,
              images: course.imageUrl ? [course.imageUrl] : [],
            },
            unit_amount: Math.round(course.price * 100), // Montant en centimes
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
      customer_email: user.email,
      client_reference_id: userId,
      metadata: {
        courseId: courseId,
        userId: userId,
      },
    });

    res.status(200).json({
      status: "success",
      data: {
        sessionId: session.id,
        url: session.url,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Création d'une commande PayPal
 */
export const createPayPalOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { courseId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw unauthorized("Utilisateur non authentifié");
    }

    if (!courseId) {
      throw badRequest("ID de formation manquant");
    }

    // Récupérer les informations du cours
    const course = await Course.findById(courseId);
    if (!course) {
      throw notFound("Formation non trouvée");
    }

    // Simuler la création d'une commande PayPal (à implémenter avec le SDK PayPal)
    // Note: Ceci est un exemple simplifié, vous devrez intégrer le SDK PayPal réel
    const paypalOrder = {
      id: `PAYPAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: "CREATED",
      amount: course.price,
      currency: "EUR",
    };

    // Enregistrer l'ordre dans la base de données
    const order = await Order.create({
      user: userId,
      course: courseId,
      amount: course.price,
      paymentMethod: "paypal",
      paymentId: paypalOrder.id,
      status: "pending",
    });

    res.status(200).json({
      status: "success",
      data: {
        orderId: paypalOrder.id,
        order: order,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Capture d'un paiement PayPal
 */
export const capturePayPalOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw unauthorized("Utilisateur non authentifié");
    }

    if (!orderId) {
      throw badRequest("ID de commande PayPal manquant");
    }

    // Simuler la capture d'un paiement PayPal (à implémenter avec le SDK PayPal)
    // Note: Ceci est un exemple simplifié, vous devrez intégrer le SDK PayPal réel
    const captureResult = {
      id: orderId,
      status: "COMPLETED",
    };

    // Mettre à jour la commande dans la base de données
    const order = await Order.findOne({
      paymentId: orderId,
      user: userId,
    });

    if (!order) {
      throw notFound("Commande non trouvée");
    }

    order.status = "completed";
    order.updatedAt = new Date();
    await order.save();

    // Ajouter le cours à l'utilisateur
    await User.findByIdAndUpdate(userId, {
      $push: {
        courses: {
          courseId: order.course,
          purchasedAt: new Date(),
          completed: false,
          progress: 0,
        },
      },
    });

    res.status(200).json({
      status: "success",
      data: {
        order: order,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Création d'une demande de virement bancaire
 */
export const createBankTransferRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { courseId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw unauthorized("Utilisateur non authentifié");
    }

    if (!courseId) {
      throw badRequest("ID de formation manquant");
    }

    // Récupérer les informations du cours
    const course = await Course.findById(courseId);
    if (!course) {
      throw notFound("Formation non trouvée");
    }

    // Récupérer les informations de l'utilisateur
    const user = await User.findById(userId);
    if (!user) {
      throw notFound("Utilisateur non trouvé");
    }

    // Vérifier si l'utilisateur a déjà acheté ce cours
    const alreadyPurchased = user.courses.some(
      (userCourse) => userCourse.courseId.toString() === courseId
    );

    if (alreadyPurchased) {
      throw badRequest("Vous avez déjà acheté cette formation");
    }

    // Créer un numéro de référence unique
    const reference = `BT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // Créer la commande en attente
    const order = await Order.create({
      user: userId,
      course: courseId,
      amount: course.price,
      paymentMethod: "bank_transfer",
      reference: reference,
      status: "awaiting_payment",
    });

    // Informations bancaires pour le virement
    const bankDetails = {
      accountName: "ServiceMasterFR",
      iban: "FR76XXXXXXXXXXXXXXXXXX",
      bic: "XXXXXXXX",
      bank: "Banque Populaire",
      reference: reference,
    };

    res.status(200).json({
      status: "success",
      data: {
        order: order,
        bankDetails: bankDetails,
        instructions:
          "Veuillez effectuer un virement avec la référence indiquée. L'accès à la formation sera débloqué dès réception du paiement.",
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Gestion des webhooks Stripe
 */
export const handleStripeWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sig = req.headers["stripe-signature"] as string;

    if (!sig) {
      return res
        .status(400)
        .json({ status: "error", message: "Signature Stripe manquante" });
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET || ""
      );
    } catch (err) {
      return res
        .status(400)
        .json({ status: "error", message: "Signature invalide" });
    }

    // Traiter l'événement en fonction de son type
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Extraire les métadonnées
      const userId = session.client_reference_id;
      const courseId = session.metadata?.courseId;

      if (userId && courseId) {
        // Mettre à jour le statut de la commande
        const order = await Order.findOneAndUpdate(
          { paymentId: session.id },
          {
            status: "completed",
            updatedAt: new Date(),
          },
          { new: true, upsert: true } // Créer si n'existe pas
        );

        // Ajouter le cours à l'utilisateur
        await User.findByIdAndUpdate(userId, {
          $push: {
            courses: {
              courseId: courseId,
              purchasedAt: new Date(),
              completed: false,
              progress: 0,
            },
          },
        });
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    // Ne pas utiliser next() ici car Stripe attend une réponse 200
    console.error("Erreur webhook Stripe:", error);
    res
      .status(500)
      .json({ status: "error", message: "Erreur interne du serveur" });
  }
};

/**
 * Gestion des webhooks PayPal
 */
export const handlePayPalWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Vérification de l'authenticité du webhook (à implémenter)
    // Note: Vous devrez utiliser le SDK PayPal pour vérifier l'authenticité

    const event = req.body;

    // Traiter l'événement en fonction de son type
    if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
      const paymentId = event.resource.id;

      // Mettre à jour le statut de la commande
      const order = await Order.findOneAndUpdate(
        { paymentId: paymentId },
        {
          status: "completed",
          updatedAt: new Date(),
        },
        { new: true }
      );

      if (order) {
        // Ajouter le cours à l'utilisateur
        await User.findByIdAndUpdate(order.user, {
          $push: {
            courses: {
              courseId: order.course,
              purchasedAt: new Date(),
              completed: false,
              progress: 0,
            },
          },
        });
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    // Ne pas utiliser next() ici car PayPal attend une réponse 200
    console.error("Erreur webhook PayPal:", error);
    res
      .status(500)
      .json({ status: "error", message: "Erreur interne du serveur" });
  }
};

/**
 * Récupération de l'historique des paiements d'un utilisateur
 */
export const getUserPaymentHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw unauthorized("Utilisateur non authentifié");
    }

    // Pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Récupérer les commandes de l'utilisateur
    const orders = await Order.find({ user: userId })
      .populate("course", "title imageUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments({ user: userId });

    res.status(200).json({
      status: "success",
      results: orders.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupération d'une facture
 */
export const getInvoice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { invoiceId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw unauthorized("Utilisateur non authentifié");
    }

    // Récupérer la commande/facture
    const order = await Order.findById(invoiceId)
      .populate("course", "title price")
      .populate("user", "name email");

    if (!order) {
      throw notFound("Facture non trouvée");
    }

    // Vérifier que l'utilisateur est autorisé à voir cette facture
    if (order.user._id.toString() !== userId && req.user?.role !== "admin") {
      throw unauthorized("Vous n'êtes pas autorisé à voir cette facture");
    }

    // Générer les détails de la facture
    const invoice = {
      id: order._id,
      reference: order.reference || order._id,
      date: order.createdAt,
      customer: {
        name: order.user.name,
        email: order.user.email,
      },
      items: [
        {
          description: order.course.title,
          price: order.course.price,
          quantity: 1,
          total: order.amount,
        },
      ],
      total: order.amount,
      status: order.status,
      paymentMethod: order.paymentMethod,
    };

    res.status(200).json({
      status: "success",
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Téléchargement d'une facture au format PDF
 */
export const downloadInvoice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { invoiceId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw unauthorized("Utilisateur non authentifié");
    }

    // Récupérer la commande/facture
    const order = await Order.findById(invoiceId);

    if (!order) {
      throw notFound("Facture non trouvée");
    }

    // Vérifier que l'utilisateur est autorisé à voir cette facture
    if (order.user.toString() !== userId && req.user?.role !== "admin") {
      throw unauthorized("Vous n'êtes pas autorisé à voir cette facture");
    }

    // Note: La génération de PDF doit être implémentée avec une bibliothèque comme PDFKit
    // Ceci est un exemple simplifié pour montrer le concept
    res.status(200).json({
      status: "success",
      message: "Fonctionnalité de téléchargement PDF à implémenter",
      data: {
        invoiceId,
        // Ici, vous renverriez normalement le PDF généré
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupération de toutes les commandes (admin)
 */
export const getAllOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user?.role !== "admin") {
      throw unauthorized("Accès réservé aux administrateurs");
    }

    // Pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Récupérer toutes les commandes
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("course", "title price")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments();

    res.status(200).json({
      status: "success",
      results: orders.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupération des commandes par statut (admin)
 */
export const getOrdersByStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status } = req.params;

    if (req.user?.role !== "admin") {
      throw unauthorized("Accès réservé aux administrateurs");
    }

    // Pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Récupérer les commandes filtrées par statut
    const orders = await Order.find({ status })
      .populate("user", "name email")
      .populate("course", "title price")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments({ status });

    res.status(200).json({
      status: "success",
      results: orders.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Recherche de commandes (admin)
 */
export const searchOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { query } = req.query;

    if (req.user?.role !== "admin") {
      throw unauthorized("Accès réservé aux administrateurs");
    }

    if (!query) {
      throw badRequest("Terme de recherche manquant");
    }

    // Pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Rechercher dans les références et les IDs de commande
    const orders = await Order.find({
      $or: [
        { reference: { $regex: query, $options: "i" } },
        { _id: { $regex: query, $options: "i" } },
      ],
    })
      .populate("user", "name email")
      .populate("course", "title price")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments({
      $or: [
        { reference: { $regex: query, $options: "i" } },
        { _id: { $regex: query, $options: "i" } },
      ],
    });

    res.status(200).json({
      status: "success",
      results: orders.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mise à jour du statut d'une commande (admin)
 */
export const updateOrderStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (req.user?.role !== "admin") {
      throw unauthorized("Accès réservé aux administrateurs");
    }

    if (!status) {
      throw badRequest("Statut manquant");
    }

    // Valider le statut
    const validStatuses = [
      "pending",
      "awaiting_payment",
      "processing",
      "completed",
      "cancelled",
      "refunded",
    ];
    if (!validStatuses.includes(status)) {
      throw badRequest("Statut invalide");
    }

    // Mettre à jour le statut de la commande
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status, updatedAt: new Date() },
      { new: true }
    )
      .populate("user", "name email")
      .populate("course", "title price");

    if (!order) {
      throw notFound("Commande non trouvée");
    }

    // Si la commande est complétée, ajouter le cours à l'utilisateur
    if (status === "completed") {
      // Vérifier si l'utilisateur a déjà ce cours
      const user = await User.findById(order.user);
      if (user) {
        const alreadyHasCourse = user.courses.some(
          (course) => course.courseId.toString() === order.course.toString()
        );

        if (!alreadyHasCourse) {
          await User.findByIdAndUpdate(order.user, {
            $push: {
              courses: {
                courseId: order.course,
                purchasedAt: new Date(),
                completed: false,
                progress: 0,
              },
            },
          });
        }
      }
    }

    res.status(200).json({
      status: "success",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Confirmation manuelle d'un virement bancaire (admin)
 */
export const confirmBankTransfer = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;
    const { transactionDetails } = req.body;

    if (req.user?.role !== "admin") {
      throw unauthorized("Accès réservé aux administrateurs");
    }

    // Récupérer la commande
    const order = await Order.findById(orderId);

    if (!order) {
      throw notFound("Commande non trouvée");
    }

    if (order.paymentMethod !== "bank_transfer") {
      throw badRequest("Cette commande n'est pas un virement bancaire");
    }

    if (order.status === "completed") {
      throw badRequest("Cette commande a déjà été confirmée");
    }

    // Mettre à jour le statut de la commande
    order.status = "completed";
    order.updatedAt = new Date();
    order.transactionDetails = transactionDetails || "Confirmé manuellement";
    await order.save();

    // Ajouter le cours à l'utilisateur
    const user = await User.findById(order.user);
    if (user) {
      const alreadyHasCourse = user.courses.some(
        (course) => course.courseId.toString() === order.course.toString()
      );

      if (!alreadyHasCourse) {
        await User.findByIdAndUpdate(order.user, {
          $push: {
            courses: {
              courseId: order.course,
              purchasedAt: new Date(),
              completed: false,
              progress: 0,
            },
          },
        });
      }
    }

    res.status(200).json({
      status: "success",
      message: "Virement bancaire confirmé avec succès",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Émission d'un remboursement (admin)
 */
export const issueRefund = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    if (req.user?.role !== "admin") {
      throw unauthorized("Accès réservé aux administrateurs");
    }

    // Récupérer la commande
    const order = await Order.findById(orderId)
      .populate("user", "name email")
      .populate("course", "title price");

    if (!order) {
      throw notFound("Commande non trouvée");
    }

    if (order.status === "refunded") {
      throw badRequest("Cette commande a déjà été remboursée");
    }

    // Logique de remboursement selon le mode de paiement
    if (order.paymentMethod === "stripe" && order.paymentId) {
      // Pour Stripe, on utilise l'API de remboursement
      // Note: Ceci est simplifié, vous devez adapter selon votre implémentation Stripe
      try {
        await stripe.refunds.create({
          payment_intent: order.paymentId,
        });
      } catch (stripeError) {
        throw new AppError(
          `Erreur lors du remboursement Stripe: ${stripeError}`,
          500
        );
      }
    } else if (order.paymentMethod === "paypal" && order.paymentId) {
      // Pour PayPal, vous devrez intégrer le SDK PayPal pour les remboursements
      // Ceci est un exemple fictif
      console.log(`Simulation de remboursement PayPal pour ${order.paymentId}`);
    } else if (order.paymentMethod === "bank_transfer") {
      // Pour les virements, le remboursement est généralement manuel
      // On met juste à jour le statut
      console.log(
        `Remboursement manuel à effectuer pour la commande ${order._id}`
      );
    }

    // Mettre à jour le statut de la commande
    order.status = "refunded";
    order.refundReason = reason || "Remboursement demandé par l'administrateur";
    order.refundDate = new Date();
    order.updatedAt = new Date();
    await order.save();

    // Retirer le cours de l'utilisateur si nécessaire
    if (order.status === "completed") {
      await User.findByIdAndUpdate(order.user, {
        $pull: {
          courses: {
            courseId: order.course,
          },
        },
      });
    }

    res.status(200).json({
      status: "success",
      message: "Remboursement effectué avec succès",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupération des statistiques de vente (admin)
 */
export const getSalesStatistics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user?.role !== "admin") {
      throw unauthorized("Accès réservé aux administrateurs");
    }

    // Période de temps (par défaut: 30 derniers jours)
    const period = req.query.period || "30days";
    let startDate = new Date();

    switch (period) {
      case "7days":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30days":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "90days":
        startDate.setDate(startDate.getDate() - 90);
        break;
      case "year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Statistiques globales
    const totalRevenue = await Order.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalOrders = await Order.countDocuments({ status: "completed" });

    // Ventes par période
    const salesByPeriod = await Order.aggregate([
      {
        $match: {
          status: "completed",
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          revenue: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Ventes par méthode de paiement
    const salesByPaymentMethod = await Order.aggregate([
      {
        $match: {
          status: "completed",
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$paymentMethod",
          revenue: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Formations les plus vendues
    const topCourses = await Order.aggregate([
      {
        $match: {
          status: "completed",
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$course",
          revenue: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        // Suite du fichier paymentController.ts - Continuation de la fonction getSalesStatistics

        $sort: { count: -1 },
      },
      { $limit: 5 },
      {
        $lookup: {
          from: "courses",
          localField: "_id",
          foreignField: "_id",
          as: "courseDetails",
        },
      },
      {
        $project: {
          _id: 1,
          revenue: 1,
          count: 1,
          title: { $arrayElemAt: ["$courseDetails.title", 0] },
        },
      },
    ]);

    // Taux de conversion (nombre de ventes / nombre d'utilisateurs)
    const totalUsers = await User.countDocuments();
    const conversionRate =
      totalUsers > 0 ? (totalOrders / totalUsers) * 100 : 0;

    res.status(200).json({
      status: "success",
      data: {
        totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
        totalOrders,
        averageOrderValue:
          totalOrders > 0
            ? totalRevenue.length > 0
              ? totalRevenue[0].total / totalOrders
              : 0
            : 0,
        salesByPeriod,
        salesByPaymentMethod,
        topCourses,
        conversionRate,
        period,
      },
    });
  } catch (error) {
    next(error);
  }
};
