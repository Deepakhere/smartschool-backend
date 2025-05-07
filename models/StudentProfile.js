import mongoose from "mongoose";

const StudentProfileSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true, default: "IN" },
    pincode: { type: String, required: true },
    birthDate: { type: String, required: true },
    division: { type: String, required: false, default: "" },
    class: { type: String, required: false, default: "" },
    rollNo: { type: String, required: false, default: "" },
    fatherName: { type: String, required: false, default: "" },
    fatherPhone: { type: String, required: false, default: "" },
    motherName: { type: String, required: false, default: "" },
    motherPhone: { type: String, required: false, default: "" },
    parentId: { type: mongoose.Schema.ObjectId, ref: "User" },
    organizationId: { type: mongoose.Schema.ObjectId, ref: "Organization" },
    status: {
      type: String,
      required: true,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    studentId: { type: String, required: false, default: "" },
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
