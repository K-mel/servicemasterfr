// backend/src/server.ts
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import morgan from "morgan";

// Import des routes
import authRoutes from "./routes/authRoutes";
import courseRoutes from "./routes/courseRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import userRoutes from "./routes/userRoutes";

// Import des middlewares
import { errorHandler, notFound } from "./middleware/errorHandler";

// Configuration des variables d'environnement
dotenv.config();

// Création de l'application Express
const app = express();
const port = process.env.PORT || 5000;

// Connexion à la base de données MongoDB
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/servicemasterfr"
  )
  .then(() => {
    console.log("✅ Connexion à MongoDB établie avec succès");
  })
  .catch((err) => {
    console.error("❌ Erreur de connexion à MongoDB:", err);
    process.exit(1);
  });

// Middleware de sécurité et de base
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL || "https://servicemasterfr.fr"
        : "http://localhost:3000",
    credentials: true,
  })
);

// Configuration de Helmet pour la sécurité
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: [
        "'self'",
        "data:",
        "https://servicemasterfr.fr",
        "https://res.cloudinary.com",
      ],
      connectSrc: ["'self'", "https://api.stripe.com"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
    },
  })
);

// Middleware pour parser les requêtes
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Logging des requêtes HTTP - uniquement en développement
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Routes API
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payments", paymentRoutes);

// Route de test/santé
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "API ServiceMasterFR opérationnelle",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// Gestion des routes inexistantes - utilisation de la fonction notFound du errorHandler
app.use("*", (req, res, next) => {
  next(notFound(`Route ${req.originalUrl} non trouvée`));
});

// Middleware de gestion des erreurs - doit être après toutes les routes
app.use(errorHandler);

// Démarrage du serveur
const server = app.listen(port, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${port}`);
  console.log(`🌍 Environnement: ${process.env.NODE_ENV || "development"}`);
});

// Gestion gracieuse de l'arrêt du serveur
process.on("SIGTERM", () => {
  console.log("SIGTERM reçu. Arrêt gracieux du serveur...");
  server.close(() => {
    console.log("Serveur arrêté");
    mongoose.connection.close(() => {
      console.log("Connexion MongoDB fermée");
      process.exit(0);
    });
  });
});

// Gestion des erreurs non capturées
process.on("unhandledRejection", (reason: any) => {
  console.error("Promesse non gérée:", reason);
  // En production, on pourrait vouloir arrêter le serveur également ici
});

process.on("uncaughtException", (error) => {
  console.error("Exception non capturée:", error);
  // Arrêt du serveur en cas d'exception non capturée pour éviter un état instable
  server.close(() => {
    mongoose.connection.close(() => {
      process.exit(1);
    });
  });
});

export default app;
