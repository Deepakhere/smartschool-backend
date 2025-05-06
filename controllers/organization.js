import Organization from "../models/Organization.js";
import User from "../models/User.js";

export const getAllOrganizations = async (req, res, next) => {
  const userId = req.userId;
  try {
    const user = await User.findById(userId);

    if (!user) {
      return next(
        new AppError("User not found", "AuthorizationError", "EX-00302", 404)
      );
    }

    if (user.permissions.isGlobalAdmin === true) {
      const organizations = await Organization.find();
      res.success({ items: organizations });
    } else {
      const organizations = await Organization.find({
        users: { $in: [userId] },
      });
      res.success({ items: organizations });
    }
  } catch (error) {
    next(new AppError(error.message, "ServerError", "EX-00100", 500));
  }
};

export const createOrganization = async (req, res, next) => {
  const { name, location, pincode, description } = req.body;
  const userId = req.userId;
  try {
    if (!name) {
      return next(
        new AppError(
          "Organization name is required.",
          "ValidationError",
          "EX-00101",
          400
        )
      );
    }

    if (!location) {
      return next(
        new AppError(
          "Organization location is required.",
          "ValidationError",
          "EX-00102",
          400
        )
      );
    }

    if (!pincode) {
      return next(
        new AppError(
          "Organization pincode is required.",
          "ValidationError",
          "EX-00103",
          400
        )
      );
    }

    const organization = await Organization.create({
      name,
      location,
      pincode,
      description,
      status: "active",
      createdAt: new Date().toISOString(),
      createdBy: userId,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
      users: [userId],
    });
    res.success({ organization });
  } catch (error) {
    next(new AppError(error.message, "ServerError", "EX-00100", 500));
  }
};

export const updateOrganization = async (req, res, next) => {
  const { name, location, pincode, description } = req.body;
  const organizationId = req.params.organizationId;
  const userId = req.userId;

  try {
    if (!name) {
      return next(
        new AppError(
          "Organization name is required.",
          "ValidationError",
          "EX-00101",
          400
        )
      );
    }

    if (!location) {
      return next(
        new AppError(
          "Organization location is required.",
          "ValidationError",
          "EX-00102",
          400
        )
      );
    }

    if (!pincode) {
      return next(
        new AppError(
          "Organization pincode is required.",
          "ValidationError",
          "EX-00103",
          400
        )
      );
    }
    await Organization.findByIdAndUpdate(
      organizationId,
      {
        name,
        location,
        pincode,
        description,
        updatedAt: new Date().toISOString(),
        updatedBy: userId,
      },
      { new: true }
    );
    res.successMessage("Organization updated successfully.");
  } catch (error) {
    next(new AppError(error.message, "ServerError", "EX-00100", 500));
  }
};

export const deleteOrganization = async (req, res, next) => {
  const organizationId = req.params.organizationId;

  try {
    await Organization.findByIdAndDelete(organizationId);
    res.successMessage("Organization deleted successfully.");
  } catch (error) {
    next(new AppError(error.message, "ServerError", "EX-00100", 500));
  }
};

export const removeUserFromOrganization = async (req, res, next) => {
  const organizationId = req.params.organizationId;

  try {
    await Organization.findByIdAndUpdate(
      organizationId,
      {
        $pull: { users: req.params.userId },
      },
      { new: true }
    );
    res.successMessage("User removed from organization successfully.");
  } catch (error) {
    next(new AppError(error.message, "ServerError", "EX-00100", 500));
  }
};

export const addUserToOrganization = async (req, res, next) => {
  const organizationId = req.params.organizationId;

  try {
    await Organization.findByIdAndUpdate(
      organizationId,
      {
        $push: { users: req.params.userId },
      },
      { new: true }
    );
    res.successMessage("User added to organization successfully.");
  } catch (error) {
    next(new AppError(error.message, "ServerError", "EX-00100", 500));
  }
};
