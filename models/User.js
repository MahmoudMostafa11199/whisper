import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      match: /^[a-zA-Z0-9_]+$/,
      immutable: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    displayName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 50,
    },
    bio: { type: String, default: '', maxlength: 200 },
    avatarUrl: { type: String, default: '' },
    acceptingQuestions: { type: Boolean, default: true },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) =>
          arr.length <= 10 && arr.every((t) => /^[a-z0-9-]{2,20}$/.test(t)),
        message: 'Invalid tags',
      },
    },
  },
  { timestamps: true },
);

userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    ret.id = ret._id.toString();

    const { _id, passwordHash, ...data } = ret;
    return data;
  },
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.statics.hashPassword = function (plain) {
  return bcrypt.hash(plain, 10);
};

export const User = mongoose.model('User', userSchema);
