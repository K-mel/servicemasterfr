// backend/src/models/User.ts
import bcrypt from "bcryptjs";
import mongoose, { Document, Schema } from "mongoose";

// Interface pour les formations achetées
interface UserCourse {
  courseId: mongoose.Types.ObjectId;
  purchasedAt: Date;
  accessUntil?: Date;
  completed: boolean;
  progress: number;
}

// Interface pour le document utilisateur
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
  phone?: string;
  address?: string;
  isActive: boolean;
  courses: UserCourse[];
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(enteredPassword: string): Promise<boolean>;
}

// Schéma pour les cours achetés par l'utilisateur
const userCourseSchema = new Schema<UserCourse>({
  courseId: {
    type: Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  purchasedAt: {
    type: Date,
    default: Date.now,
  },
  accessUntil: {
    type: Date,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
});

// Schéma principal de l'utilisateur
const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Veuillez fournir un nom"],
      trim: true,
      maxlength: [50, "Le nom ne peut pas dépasser 50 caractères"],
    },
    email: {
      type: String,
      required: [true, "Veuillez fournir un email"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
        "Veuillez fournir un email valide",
      ],
    },
    password: {
      type: String,
      required: [true, "Veuillez fournir un mot de passe"],
      minlength: [8, "Le mot de passe doit contenir au moins 8 caractères"],
      select: false, // Ne pas inclure par défaut dans les requêtes
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    courses: [userCourseSchema],
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

// Middleware pour hacher le mot de passe avant de l'enregistrer
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function (
  enteredPassword: string
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model<IUser>("User", userSchema);

export default User;
