import dotenv from "dotenv";
import { Pool } from "pg";

// Charge les variables d'environnement
dotenv.config();

// Configuration de la connexion à PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || "5432"),
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Test de connexion à la base de données
pool.connect((err, client, release) => {
  if (err) {
    return console.error(
      "Erreur lors de la connexion à la base de données:",
      err.stack
    );
  }
  console.log("Connexion à la base de données PostgreSQL établie avec succès");
  release();
});

// Fonction utilitaire pour exécuter des requêtes SQL
const query = (text: string, params?: any[]) => pool.query(text, params);

export default {
  query,
  pool,
};
