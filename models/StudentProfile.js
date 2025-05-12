import mongoose from "mongoose";

const StudentProfileSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true, default: "IN" },
    pincode: { type: String, required: false },
    dateOfBirth: { type: String, required: true },
    division: { type: String, required: false, default: "" },
    classId: { type: String, required: false, default: "" },
    rollNumber: { type: String, required: false, default: "" },
    parentId: { type: mongoose.Schema.ObjectId, ref: "User" },
    organizationId: {
      required: false,
      type: mongoose.Schema.ObjectId,
      ref: "Organization",
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    admissionNumber: { type: String, required: false, default: "" },
    admissionDate: { type: String, required: false, default: "" },
    registrationId: { type: String, required: false, default: "" },
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
