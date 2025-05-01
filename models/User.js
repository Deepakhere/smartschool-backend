import mongoose from "mongoose";

const UserSchema = mongoose.Schema(
  {
    email: { type: String, required: true },
    password: { type: String, required: false },
    role: { type: String, required: true, enum: ["admin", "parent"] },
    resetPasswordToken: { type: String, required: false },
    resetPasswordExpire: { type: Date, required: false },
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
