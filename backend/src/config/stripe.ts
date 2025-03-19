import dotenv from "dotenv";
import Stripe from "stripe";

// Charger les variables d'environnement
dotenv.config();

// Vérifier que la clé API Stripe est définie
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error(
    "La variable d'environnement STRIPE_SECRET_KEY n'est pas définie"
  );
}

// Initialiser l'instance Stripe avec la clé secrète
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16", // Utiliser la version la plus récente de l'API Stripe
  appInfo: {
    name: "ServiceMasterFR",
    version: "1.0.0",
  },
});

// Fonction pour créer une session de paiement
const createCheckoutSession = async (
  productId: string,
  productName: string,
  amount: number,
  customerId?: string
) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: productName,
            },
            unit_amount: amount * 100, // Stripe utilise les centimes
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/mon-compte/mes-formations?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/formations/${productId}?canceled=true`,
      customer: customerId || undefined,
      metadata: {
        productId,
      },
    });

    return session;
  } catch (error) {
    console.error("Erreur lors de la création de la session Stripe:", error);
    throw error;
  }
};

export default {
  stripe,
  createCheckoutSession,
};
