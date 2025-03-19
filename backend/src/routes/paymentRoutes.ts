import express from "express";
import * as paymentController from "../controllers/paymentController";
import { adminMiddleware, authMiddleware } from "../middleware/auth";

const router = express.Router();

/**
 * Routes de paiement pour les utilisateurs
 */

// Créer une session de paiement Stripe
router.post(
  "/create-checkout-session",
  authMiddleware,
  paymentController.createCheckoutSession
);

// Créer une session de paiement PayPal
router.post(
  "/create-paypal-order",
  authMiddleware,
  paymentController.createPayPalOrder
);

// Confirmer un paiement PayPal
router.post(
  "/capture-paypal-order",
  authMiddleware,
  paymentController.capturePayPalOrder
);

// Créer une demande de virement bancaire
router.post(
  "/bank-transfer-request",
  authMiddleware,
  paymentController.createBankTransferRequest
);

// Webhook pour les événements Stripe
router.post("/webhook/stripe", paymentController.handleStripeWebhook);

// Webhook pour les événements PayPal
router.post("/webhook/paypal", paymentController.handlePayPalWebhook);

// Récupérer l'historique des paiements d'un utilisateur
router.get("/history", authMiddleware, paymentController.getUserPaymentHistory);

// Récupérer un reçu/facture spécifique
router.get(
  "/invoices/:invoiceId",
  authMiddleware,
  paymentController.getInvoice
);

// Télécharger une facture au format PDF
router.get(
  "/invoices/:invoiceId/download",
  authMiddleware,
  paymentController.downloadInvoice
);

/**
 * Routes administratives pour les paiements
 */

// Obtenir toutes les commandes
router.get(
  "/admin/orders",
  authMiddleware,
  adminMiddleware,
  paymentController.getAllOrders
);

// Filtrer les commandes par statut
router.get(
  "/admin/orders/status/:status",
  authMiddleware,
  adminMiddleware,
  paymentController.getOrdersByStatus
);

// Rechercher des commandes
router.get(
  "/admin/orders/search",
  authMiddleware,
  adminMiddleware,
  paymentController.searchOrders
);

// Mettre à jour le statut d'une commande
router.patch(
  "/admin/orders/:orderId/status",
  authMiddleware,
  adminMiddleware,
  paymentController.updateOrderStatus
);

// Confirmer manuellement un paiement par virement bancaire
router.post(
  "/admin/orders/:orderId/confirm-bank-transfer",
  authMiddleware,
  adminMiddleware,
  paymentController.confirmBankTransfer
);

// Émettre un remboursement
router.post(
  "/admin/orders/:orderId/refund",
  authMiddleware,
  adminMiddleware,
  paymentController.issueRefund
);

// Obtenir les statistiques des ventes
router.get(
  "/admin/statistics",
  authMiddleware,
  adminMiddleware,
  paymentController.getSalesStatistics
);

export default router;
