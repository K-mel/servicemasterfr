// backend/src/models/Course.ts
import mongoose, { Document, Schema } from "mongoose";

// Interface pour les sections de cours
interface CourseSection {
  title: string;
  description?: string;
  order: number;
  lessons: {
    title: string;
    description?: string;
    videoUrl?: string;
    content?: string;
    duration?: number;
    order: number;
    isPreview?: boolean;
  }[];
}

// Interface pour les évaluations/avis sur le cours
interface CourseReview {
  user: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
}

// Interface pour les prérequis du cours
interface CourseRequirement {
  description: string;
}

// Interface pour les objectifs d'apprentissage du cours
interface CourseLearningObjective {
  description: string;
}

// Interface pour le document Course
export interface ICourse extends Document {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  imageUrl?: string;
  price: number;
  discountPrice?: number;
  level: "beginner" | "intermediate" | "advanced" | "all-levels";
  category: string[];
  tags: string[];
  language: string;
  requirements: CourseRequirement[];
  learningObjectives: CourseLearningObjective[];
  sections: CourseSection[];
  reviews: CourseReview[];
  averageRating: number;
  totalReviews: number;
  totalStudents: number;
  isPublished: boolean;
  requiresApproval: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    title: {
      type: String,
      required: [true, "Veuillez fournir un titre"],
      trim: true,
      maxlength: [100, "Le titre ne peut pas dépasser 100 caractères"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    shortDescription: {
      type: String,
      required: [true, "Veuillez fournir une description courte"],
      trim: true,
      maxlength: [
        200,
        "La description courte ne peut pas dépasser 200 caractères",
      ],
    },
    description: {
      type: String,
      required: [true, "Veuillez fournir une description complète"],
      trim: true,
    },
    imageUrl: {
      type: String,
    },
    price: {
      type: Number,
      required: [true, "Veuillez indiquer un prix"],
      min: 0,
    },
    discountPrice: {
      type: Number,
      min: 0,
    },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "all-levels"],
      default: "all-levels",
    },
    category: {
      type: [String],
      required: [true, "Veuillez sélectionner au moins une catégorie"],
    },
    tags: {
      type: [String],
    },
    language: {
      type: String,
      default: "fr",
    },
    requirements: [
      {
        description: {
          type: String,
          required: true,
        },
      },
    ],
    learningObjectives: [
      {
        description: {
          type: String,
          required: true,
        },
      },
    ],
    sections: [
      {
        title: {
          type: String,
          required: true,
        },
        description: {
          type: String,
        },
        order: {
          type: Number,
          required: true,
        },
        lessons: [
          {
            title: {
              type: String,
              required: true,
            },
            description: {
              type: String,
            },
            videoUrl: {
              type: String,
            },
            content: {
              type: String,
            },
            duration: {
              type: Number,
            },
            order: {
              type: Number,
              required: true,
            },
            isPreview: {
              type: Boolean,
              default: false,
            },
          },
        ],
      },
    ],
    reviews: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
        comment: {
          type: String,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    averageRating: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    totalStudents: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    requiresApproval: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware pour mettre à jour la moyenne des évaluations
courseSchema.pre("save", function (next) {
  if (this.reviews.length > 0) {
    const totalRating = this.reviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );
    this.averageRating = totalRating / this.reviews.length;
    this.totalReviews = this.reviews.length;
  }
  next();
});

// Index pour améliorer les performances des requêtes fréquentes
courseSchema.index({ slug: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ tags: 1 });
courseSchema.index({ title: "text", description: "text" });

const Course = mongoose.model<ICourse>("Course", courseSchema);

export default Course;
