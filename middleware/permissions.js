import User from "../models/User.js";
import AppError from "../utils/AppError.js";

// Check if user has create permission
export const checkCreatePermission = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return next(
        new AppError(
          "Authentication required",
          "AuthorizationError",
          "EX-00301",
          401
        )
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(
        new AppError("User not found", "AuthorizationError", "EX-00302", 404)
      );
    }

    if (!user.permissions.canCreate) {
      return next(
        new AppError(
          "You don't have permission to create resources",
          "AuthorizationError",
          "EX-00303",
          403
        )
      );
    }

    next();
  } catch (error) {
    next(new AppError(error.message, "ServerError", "EX-00300", 500));
  }
};

// Check if user has read permission
export const checkReadPermission = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return next(
        new AppError(
          "Authentication required",
          "AuthorizationError",
          "EX-00301",
          401
        )
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(
        new AppError("User not found", "AuthorizationError", "EX-00302", 404)
      );
    }

    if (!user.permissions.canRead) {
      return next(
        new AppError(
          "You don't have permission to read resources",
          "AuthorizationError",
          "EX-00304",
          403
        )
      );
    }

    next();
  } catch (error) {
    next(new AppError(error.message, "ServerError", "EX-00300", 500));
  }
};

// Check if user has update permission
export const checkUpdatePermission = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return next(
        new AppError(
          "Authentication required",
          "AuthorizationError",
          "EX-00301",
          401
        )
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(
        new AppError("User not found", "AuthorizationError", "EX-00302", 404)
      );
    }

    if (!user.permissions.canUpdate) {
      return next(
        new AppError(
          "You don't have permission to update resources",
          "AuthorizationError",
          "EX-00305",
          403
        )
      );
    }

    next();
  } catch (error) {
    next(new AppError(error.message, "ServerError", "EX-00300", 500));
  }
};

// Check if user has delete permission
export const checkDeletePermission = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return next(
        new AppError(
          "Authentication required",
          "AuthorizationError",
          "EX-00301",
          401
        )
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(
        new AppError("User not found", "AuthorizationError", "EX-00302", 404)
      );
    }

    if (!user.permissions.canDelete) {
      return next(
        new AppError(
          "You don't have permission to delete resources",
          "AuthorizationError",
          "EX-00306",
          403
        )
      );
    }

    next();
  } catch (error) {
    next(new AppError(error.message, "ServerError", "EX-00300", 500));
  }
};

export const checkAdminPermission = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return next(
        new AppError(
          "Authentication required",
          "AuthorizationError",
          "EX-00301",
          401
        )
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(
        new AppError("User not found", "AuthorizationError", "EX-00302", 404)
      );
    }

    if (user.role !== "admin") {
      return next(
        new AppError(
          "You don't have permission to perform this action",
          "AuthorizationError",
          "EX-00307",
          403
        )
      );
    }

    next();
  } catch (error) {
    next(new AppError(error.message, "ServerError", "EX-00300", 500));
  }
};
