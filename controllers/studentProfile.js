import StudentProfile from "../models/StudentProfile.js";
import User from "../models/User.js";
import Organization from "../models/Organization.js";
import mongoose from "mongoose";
import AppError from "../utils/AppError.js";

const { isValidObjectId } = mongoose;
export const createStudentProfile = async (req, res, next) => {
  const reqUserId = req.userId;
  const { organizationId } = req.params;
  const {
    full_name,
    parent_email,
    parent_name,
    phone_number,
    address,
    city,
    state,
    pincode,
    date_of_birth,
    division,
    class_id,
    roll_number,
    admission_number,
    admission_date,
    registration_id,
  } = req.body;

  if (!isValidObjectId(organizationId)) {
    return next(
      new AppError("Invalid organization ID format", "BadRequest", 400)
    );
  }

  try {
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return next(
        new AppError(
          "Organization not found.",
          "NotFoundError",
          "EX-00201",
          404
        )
      );
    }

    let parent = await User.findOne({ email: parent_email });

    if (!parent) {
      const requestingUser = await User.findById(reqUserId); // May be needed for auditing/logs in future
      parent = await User.create({
        name: parent_name,
        email: parent_email,
        role: "parent",
        status: "pending",
        permissions: {
          canCreate: false,
          canRead: true,
          canUpdate: false,
          canDelete: false,
        },
        phoneNumber: phone_number,
      });

      organization.users.push(parent.id);
      await organization.save();
    }

    const studentProfileData = {
      full_name,
      parent_id: parent.id,
      address,
      city,
      state,
      pincode,
      date_of_birth,
      division,
      class_id,
      roll_number,
      admission_number,
      admission_date,
      registration_id,
      organization_id: organization.id,
    };

    await StudentProfile.create(studentProfileData);

    const message =
      parent.status === "pending"
        ? "Student added successfully and invite sent."
        : "Student added successfully.";

    res.successMessage(message);
  } catch (error) {
    next(new AppError(error.message, "ServerError", "EX-00100", 500));
  }
};

export const getParentProfileByEmail = async (req, res, next) => {
  const { email, organizationId } = req.params;

  if (!isValidObjectId(organizationId)) {
    return next(
      new AppError("Invalid organization ID format", "BadRequest", 400)
    );
  }

  try {
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return next(
        new AppError(
          "Organization not found.",
          "NotFoundError",
          "EX-00201",
          404
        )
      );
    }

    const parent = await User.findOne({ email: email });

    if (!parent) {
      res.success({
        item: {},
        is_parent_exists: false,
      });
    } else {
      const is_parent_exists = organization.users.find((user) => {
        user === parent.id;
      });

      if (!is_parent_exists) {
        res.success({
          item: {},
          is_parent_exists: false,
        });
      } else {
        res.success({
          item: parent,
          is_parent_exists: true,
        });
      }
    }
  } catch (error) {
    next(new AppError(error.message, "ServerError", "EX-00100", 500));
  }
};
