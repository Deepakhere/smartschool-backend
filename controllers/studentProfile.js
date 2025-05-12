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
    name,
    parentEmail,
    parentName,
    phoneNumber,
    address,
    city,
    state,
    pincode,
    dateOfBirth,
    division,
    classId,
    rollNumber,
    admissionNumber,
    admissionDate,
    registrationId,
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

    let parent = await User.findOne({ email: parentEmail });

    if (!parent) {
      const requestingUser = await User.findById(reqUserId); // May be needed for auditing/logs in future
      parent = await User.create({
        name: parentName,
        email: parentEmail,
        role: "parent",
        status: "pending",
        permissions: {
          canCreate: false,
          canRead: true,
          canUpdate: false,
          canDelete: false,
        },
        phoneNumber: phoneNumber,
      });

      organization.users.push(parent.id);
      await organization.save();
    }

    const studentProfileData = {
      name,
      parentId: parent.id,
      address,
      city,
      state,
      pincode,
      dateOfBirth,
      division,
      classId,
      rollNumber,
      admissionNumber,
      admissionDate,
      registrationId,
      organizationId: organization.id,
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
      const is_parent_exists = organization.users.some(
        (user) => user.toString() === parent.id.toString()
      );

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

export const getStudentProfile = async (req, res, next) => {
  const { organizationId } = req.params;

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

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const search = req.query.search_term || "";
    const skip = (page - 1) * limit;

    const query = { organizationId: organizationId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { rollNumber: { $regex: search, $options: "i" } },
        { admissionNumber: { $regex: search, $options: "i" } },
      ];
    }

    const totalStudents = await StudentProfile.countDocuments(query);

    const students = await StudentProfile.find(query)
      .populate("parentId", "name email phoneNumber")
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 });

    res.success({
      items: students || [],
      total_count: totalStudents,
    });
  } catch (error) {
    next(new AppError(error.message, "ServerError", "EX-00100", 500));
  }
};
