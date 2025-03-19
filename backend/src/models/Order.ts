// backend/src/models/Order.ts
import mongoose, { Document, Schema } from "mongoose";

// Interface pour le document Order
export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  amount: number;
  status:
    | "pending"
    | "awaiting_payment"
    | "processing"
    | "completed"
    | "cancelled"
    | "refunded";
  paymentMethod: "stripe" | "paypal" | "bank_transfer";
  paymentId?: string;
  reference?: string;
  transactionDetails?: string;
  refundReason?: string;
  refundDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "awaiting_payment",
        "processing",
        "completed",
        "cancelled",
        "refunded",
      ],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["stripe", "paypal", "bank_transfer"],
      required: true,
    },
    paymentId: {
      type: String,
    },
    reference: {
      type: String,
    },
    transactionDetails: {
      type: String,
    },
    refundReason: {
      type: String,
    },
    refundDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour améliorer les performances des requêtes fréquentes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentId: 1 });
orderSchema.index({ reference: 1 });

const Order = mongoose.model<IOrder>("Order", orderSchema);

export default Order;
