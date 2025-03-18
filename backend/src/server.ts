import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";

// Configuration des variables d'environnement
dotenv.config();

// Création de l'application Express
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Route de test
app.get("/api/health", (req, res) => {
  res
    .status(200)
    .json({ status: "ok", message: "API ServiceMasterFR opérationnelle" });
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
});
