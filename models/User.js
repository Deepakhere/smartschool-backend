import mongoose from "mongoose";

const UserSchema = mongoose.Schema(
  {
    name: { type: String, required: false },
    email: { type: String, required: true },
    password: { type: String, required: false },
    role: { type: String, required: true, enum: ["admin", "parent"] },
    status: {
      type: String,
      required: true,
      enum: ["active", "inactive", "pending", "suspended"],
      default: "pending",
    },
    phoneNumber: { type: String, required: false },
    resetPasswordToken: { type: String, required: false },
    resetPasswordExpire: { type: Date, required: false },
    permissions: {
      canCreate: { type: Boolean, default: false },
      canRead: { type: Boolean, default: true },
      canUpdate: { type: Boolean, default: false },
      canDelete: { type: Boolean, default: false },
      isGlobalAdmin: { type: Boolean, default: false },
    },
  },
  {
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpire;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpire;
      },
    },
  }
);

export default mongoose.model("User", UserSchema);
