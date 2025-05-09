import mongoose from "mongoose";

const StudentProfileSchema = mongoose.Schema(
  {
    full_name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true, default: "IN" },
    pincode: { type: String, required: true },
    date_of_birth: { type: String, required: true },
    division: { type: String, required: false, default: "" },
    class_id: { type: String, required: false, default: "" },
    roll_number: { type: String, required: false, default: "" },
    parent_id: { type: mongoose.Schema.ObjectId, ref: "User" },
    organization_id: {
      required: true,
      type: mongoose.Schema.ObjectId,
      ref: "Organization",
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    admission_number: { type: String, required: false, default: "" },
    admission_date: { type: String, required: false, default: "" },
    registration_id: { type: String, required: false, default: "" },
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

export default mongoose.model("StudentProfile", StudentProfileSchema);
