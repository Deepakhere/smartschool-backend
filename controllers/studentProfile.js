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
    const classId = req.query.classId || "";

    const query = { organizationId: organizationId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { rollNumber: { $regex: search, $options: "i" } },
      ];
    }

    if (classId) {
      query.classId = classId;
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

export const getStudentById = async (req, res, next) => {
  const { studentId } = req.params;

  if (!isValidObjectId(studentId)) {
    return next(new AppError("Invalid student ID format", "BadRequest", 400));
  }

  try {
    const student = await StudentProfile.findById(studentId).populate({
      path: "parentId",
      select: "name email phoneNumber",
    });

    if (!student) {
      return next(
        new AppError("Student not found.", "NotFoundError", "EX-00101", 404)
      );
    }

    const studentObj = student.toObject();

    const parentId = studentObj.parentId?.id || null;

    const response = {
      ...studentObj,
      parentId: parentId,
      parentName: studentObj.parentId?.name || null,
      parentEmail: studentObj.parentId?.email || null,
      phoneNumber: studentObj.parentId?.phoneNumber || null,
    };

    // Remove unwanted fields
    delete response._id;
    delete response.__v;

    res.success({ item: response });
  } catch (error) {
    next(new AppError(error.message, "ServerError", "EX-00100", 500));
  }
};

export const editStudentProfile = async (req, res, next) => {
  const { studentId } = req.params;

  if (!isValidObjectId(studentId)) {
    return next(new AppError("Invalid student ID format", "BadRequest", 400));
  }

  try {
    const updates = {};

    const allowedFields = [
      "name",
      "address",
      "city",
      "state",
      "country",
      "pincode",
      "dateOfBirth",
      "division",
      "classId",
      "rollNumber",
      "status",
      "admissionNumber",
      "admissionDate",
      "registrationId",
    ];

    for (const field of allowedFields) {
      if (req.body.hasOwnProperty(field)) {
        updates[field] = req.body[field];
      }
    }

    const updatedStudent = await StudentProfile.findByIdAndUpdate(
      studentId,
      { $set: updates },
      { new: true }
    );

    if (!updatedStudent) {
      return next(
        new AppError("Student not found.", "NotFoundError", "EX-00101", 404)
      );
    }

    const { parentId, parentName, parentEmail, phoneNumber } = req.body;

    if (parentId && isValidObjectId(parentId)) {
      const userUpdate = {};
      if (parentName) userUpdate.name = parentName;
      if (parentEmail) userUpdate.email = parentEmail;
      if (phoneNumber) userUpdate.phoneNumber = phoneNumber;

      if (Object.keys(userUpdate).length > 0) {
        await User.findByIdAndUpdate(parentId, { $set: userUpdate });
      }
    }

    res.successMessage("Student details updated successfully.");
  } catch (error) {
    next(new AppError(error.message, "ServerError", "EX-00100", 500));
  }
};

export const deleteStudentProfile = async (req, res, next) => {
  const { studentId, organizationId } = req.params;

  if (!isValidObjectId(studentId)) {
    return next(new AppError("Invalid student ID format", "BadRequest", 400));
  }

  if (!isValidObjectId(organizationId)) {
    return next(
      new AppError("Invalid organization ID format", "BadRequest", 400)
    );
  }

  try {
    const student = await StudentProfile.findById(studentId);

    if (!student) {
      return next(
        new AppError("Student not found.", "NotFoundError", "EX-00101", 404)
      );
    }

    const isHasMultipleStudents = await StudentProfile.find({
      parentId: student.parentId,
    });

    if (isHasMultipleStudents.length === 1) {
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        return next(
          new AppError(
            "Organization not found.",
            "NotFoundError",
            "EX-00101",
            404
          )
        );
      }

      await User.findByIdAndDelete(student.parentId);

      if (organization) {
        await Organization.updateOne(
          { _id: organizationId },
          { $pull: { users: student.parentId } }
        );
      }
    }

    await StudentProfile.findByIdAndDelete(studentId);

    res.successMessage("Student deleted successfully.");
  } catch (error) {
    next(new AppError(error.message, "ServerError", "EX-00100", 500));
  }
};
