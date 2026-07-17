import bcrypt from "bcrypt";
import { model, models, Schema, type HydratedDocument, type Model } from "mongoose";

export interface IUser {
  fullName: string;
  email: string;
  password: string;
  number: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserMethods {
  comparePassword(candidate: string): Promise<boolean>;
}

type UserModel = Model<IUser, Record<string, never>, UserMethods>;
export type UserDocument = HydratedDocument<IUser, UserMethods>;

const userSchema = new Schema<IUser, UserModel, UserMethods>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    // Stored as text so international prefixes and leading zeroes are preserved.
    number: {
      type: String,
      required: true,
      trim: true,
      minlength: 7,
      maxlength: 20,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export const User =
  (models.User as UserModel | undefined) ??
  model<IUser, UserModel>("User", userSchema);
