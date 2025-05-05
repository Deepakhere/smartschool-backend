import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import CryptoJS from "crypto-js";
import axios from "axios";

import User from "../models/User.js";
import { sendEmail } from "../utils/emailService.js";
import {
  getPasswordResetTemplate,
  getWelcomeEmailTemplate,
} from "../utils/emailTemplates.js";
import AppError from "../utils/AppError.js";

const secret = process.env.SECRET;
const RESET_SECRET = process.env.RESET_SECRET;
const CLIENT_URL = process.env.FRONTEND_URL;
const RECAPTCHA_SECRET_KEY = process.env.CAPTCHA_KEY;

export const signin = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    let oldUser;

    oldUser = await User.findOne({ email });

    if (!oldUser) {
      return next(
        new AppError(
          "Email or password seems to be wrong, please try again with valid credentials.",
          "ValidationError",
          "EX-00101",
          403
        )
      );
    }

    const isPasswordCorrect = await bcrypt.compare(password, oldUser.password);

    if (!isPasswordCorrect) {
      return next(
        new AppError(
          "Email or password seems to be wrong, please try again with valid credentials.",
          "ValidationError",
          "EX-00101",
          403
        )
      );
    }

    const token = jwt.sign({ email: oldUser.email, id: oldUser.id }, secret, {
      expiresIn: "1h",
    });

    res.success({
      id: oldUser.id,
      email: oldUser.email || "",
      token,
      role: oldUser.role,
      name: oldUser.name || "",
      permissions: oldUser.permissions,
    });
  } catch (err) {
    next(new AppError(err.message, "ServerError", "EX-00100", 500));
  }
};

export const signup = async (req, res, next) => {
  const { email, password, role, permissions, name } = req.body;

  try {
    let oldUser;

    oldUser = await User.findOne({ email });

    if (oldUser) {
      return next(
        new AppError("User already exists", "DuplicateError", "EX-00102", 403)
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await User.create({
      email: email || "",
      password: hashedPassword,
      role,
      permissions,
      name,
    });

    const token = jwt.sign({ email: result.email, id: result.id }, secret, {
      expiresIn: "1h",
    });

    res.success(
      {
        id: result.id,
        username: result.username,
        email: result.email || "",
        token,
        role: result.role,
        name: result.name || "",
        permissions: result.permissions,
      },
      201
    );
  } catch (error) {
    next(new AppError(error.message, "ServerError", "EX-00100", 500));
  }
};

export const getUserDetails = async (req, res, next) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId).select("email role");

    if (!user) {
      return next(
        new AppError("User not found.", "NotFoundError", "EX-00104", 404)
      );
    }

    res.success({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name || "",
      permissions: user.permissions,
    });
  } catch (error) {
    next(new AppError(error.message, "ServerError", "EX-00100", 500));
  }
};

export const forgotPassword = async (req, res, next) => {
  const { email, captcha_token: captchaToken } = req.body;

  try {
    if (!email) {
      return next(
        new AppError("Email is required.", "ValidationError", "EX-00105", 400)
      );
    }

    if (!captchaToken) {
      return next(
        new AppError(
          "Captcha token is required.",
          "CaptchaError",
          "EX-00106",
          403
        )
      );
    }

    const captchaVerifyURL = `https://www.google.com/recaptcha/api/siteverify`;

    try {
      const captchaResponse = await axios.post(
        captchaVerifyURL,
        `secret=${RECAPTCHA_SECRET_KEY}&response=${captchaToken}`,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const { success, "error-codes": errorCodes } = captchaResponse.data;

      if (!success) {
        return next(
          new AppError(
            `Captcha verification failed: ${
              errorCodes ? errorCodes.join(", ") : "unknown error"
            }`,
            "CaptchaError",
            "EX-00106",
            403
          )
        );
      }
    } catch (captchaError) {
      return next(
        new AppError(
          "Error verifying captcha. Please try again later.",
          "CaptchaError",
          "EX-00106",
          500
        )
      );
    }

    const user = await User.findOne({ email });

    const successResponse = {
      Status: "success",
      Data: {
        message:
          "If that email address is in our database, we will send you a password recovery link.",
      },
    };

    if (!user) {
      return res.success(successResponse);
    }

    const resetTokenData = CryptoJS.lib.WordArray.random(32).toString(
      CryptoJS.enc.Hex
    );

    const resetToken = jwt.sign(
      { data: resetTokenData, userId: user.id },
      RESET_SECRET,
      {
        expiresIn: "1h",
      }
    );

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 3600000;

    await user.save();

    const resetUrl = `${CLIENT_URL}/reset-password/?token=${resetToken}`;

    const message = getPasswordResetTemplate(resetUrl);

    try {
      await sendEmail({
        to: user.email,
        subject: "Password Reset Request",
        html: message,
      });
    } catch (emailError) {
      console.error("Error sending password reset email:", emailError);
    }

    res.success(successResponse);
  } catch (error) {
    next(new AppError(error.message, "ServerError", "EX-00100", 500));
  }
};

export const resetPassword = async (req, res, next) => {
  const { password, token } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(
        new AppError(
          "Password reset token is invalid or has expired.",
          "ValidationError",
          "EX-00105",
          400
        )
      );
    }

    try {
      const decoded = jwt.verify(token, RESET_SECRET);

      if (decoded.userId !== user.id) {
        return next(
          new AppError(
            "Invalid token for this user.",
            "ValidationError",
            "EX-00108",
            400
          )
        );
      }
    } catch (jwtError) {
      return next(
        new AppError(
          "Password reset token is invalid or has expired.",
          "ValidationError",
          "EX-00105",
          400
        )
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.successMessage("Password has been reset successfully.");
  } catch (error) {
    next(new AppError(error.message, "ServerError", "EX-00100", 500));
  }
};

export const inviteUser = async (req, res, next) => {
  const { name, email, role, permissions } = req.body;

  try {
    const requestingUserId = req.userId;
    const requestingUser = await User.findById(requestingUserId);

    if (!requestingUser) {
      return next(
        new AppError("User not found.", "AuthorizationError", "EX-00201", 404)
      );
    }

    if (!requestingUser.permissions.canCreate) {
      return next(
        new AppError(
          "You don't have permission to create users.",
          "AuthorizationError",
          "EX-00202",
          403
        )
      );
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return next(
        new AppError(
          "User with this email already exists.",
          "DuplicateError",
          "EX-00203",
          409
        )
      );
    }

    const newUser = await User.create({
      name,
      email,
      role,
      status: "pending",
      permissions: {
        canCreate: permissions?.canCreate || false,
        canRead: permissions?.canRead || true,
        canUpdate: permissions?.canUpdate || false,
        canDelete: permissions?.canDelete || false,
      },
    });

    const inviteTokenData = CryptoJS.lib.WordArray.random(32).toString(
      CryptoJS.enc.Hex
    );

    const inviteToken = jwt.sign(
      { data: inviteTokenData, userId: newUser.id },
      RESET_SECRET,
      {
        expiresIn: "48h",
      }
    );

    newUser.resetPasswordToken = inviteToken;
    newUser.resetPasswordExpire = Date.now() + 48 * 3600000;

    await newUser.save();

    const inviteUrl = `${CLIENT_URL}/set-password/?token=${inviteToken}`;

    try {
      const inviterName = requestingUser.name || requestingUser.email;
      const message = getWelcomeEmailTemplate(name, inviterName, inviteUrl);

      await sendEmail({
        to: email,
        subject: "Invitation to Join",
        html: message,
      });
    } catch (emailError) {
      console.error("Error sending invitation email:", emailError);
    }

    res.successMessage("User invited successfully.", 201);
  } catch (error) {
    next(new AppError(error.message, "ServerError", "EX-00200", 500));
  }
};

export const setUserPassword = async (req, res, next) => {
  const { password, token } = req.body;

  try {
    let decoded;
    try {
      decoded = jwt.verify(token, RESET_SECRET);
    } catch (jwtError) {
      return next(
        new AppError(
          "Invitation token is invalid or has expired.",
          "ValidationError",
          "EX-00206",
          400
        )
      );
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return next(
        new AppError("User not found.", "ValidationError", "EX-00208", 400)
      );
    }

    if (
      user.status === "active" &&
      user.password &&
      (!user.resetPasswordToken ||
        !user.resetPasswordExpire ||
        user.resetPasswordExpire < Date.now())
    ) {
      return next(
        new AppError(
          "Password has already been set for this account.",
          "ValidationError",
          "EX-00207",
          400
        )
      );
    }

    if (
      user.resetPasswordToken !== token ||
      user.resetPasswordExpire < Date.now()
    ) {
      return next(
        new AppError(
          "Invitation token is invalid or has expired.",
          "ValidationError",
          "EX-00204",
          400
        )
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.status = "active";

    await user.save();

    res.successMessage(
      "Password set successfully. Your account is now active."
    );
  } catch (error) {
    next(new AppError(error.message, "ServerError", "EX-00200", 500));
  }
};

export const reinviteUser = async (req, res, next) => {
  const { userId } = req.params;

  try {
    const requestingUserId = req.userId;
    const requestingUser = await User.findById(requestingUserId);

    if (!requestingUser) {
      return next(
        new AppError("User not found.", "AuthorizationError", "EX-00201", 404)
      );
    }

    const pendingUser = await User.findById(userId);

    if (!pendingUser) {
      return next(
        new AppError("User not found.", "NotFoundError", "EX-00207", 404)
      );
    }

    if (pendingUser.status !== "pending") {
      return next(
        new AppError(
          "Only pending users can be reinvited.",
          "ValidationError",
          "EX-00208",
          400
        )
      );
    }

    const inviteTokenData = CryptoJS.lib.WordArray.random(32).toString(
      CryptoJS.enc.Hex
    );

    const inviteToken = jwt.sign(
      { data: inviteTokenData, userId: pendingUser.id },
      RESET_SECRET,
      {
        expiresIn: "48h",
      }
    );

    pendingUser.resetPasswordToken = inviteToken;
    pendingUser.resetPasswordExpire = Date.now() + 48 * 3600000;

    await pendingUser.save();

    const inviteUrl = `${CLIENT_URL}/set-password/?token=${inviteToken}`;

    try {
      const inviterName = requestingUser.name || requestingUser.email;
      const receiverName = pendingUser.name || pendingUser.email;
      const message = getWelcomeEmailTemplate(
        receiverName,
        inviterName,
        inviteUrl
      );

      await sendEmail({
        to: pendingUser.email,
        subject: "Invitation to Join (Reminder)",
        html: message,
      });
    } catch (emailError) {
      console.error("Error sending reinvitation email:", emailError);
    }

    res.success({
      message: "User reinvited successfully",
      user: {
        id: pendingUser.id,
        name: pendingUser.name,
        email: pendingUser.email,
        status: pendingUser.status,
      },
    });
  } catch (error) {
    next(new AppError(error.message, "ServerError", "EX-00200", 500));
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const search = req.query.search_term || "";
    const type = req.query.role || "";

    const skip = (page - 1) * limit;

    const queries = [];

    if (search) {
      queries.push({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { role: { $regex: search, $options: "i" } },
        ],
      });
    }

    if (type) {
      queries.push({ role: type });
    }

    const searchQuery = queries.length ? { $and: queries } : {};

    const totalUsers = await User.countDocuments(searchQuery);

    const users = await User.find(searchQuery, "email status name id role")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.success({
      users: users || [],
      total_count: totalUsers,
    });
  } catch (error) {
    next(new AppError(error.message, "ServerError", "EX-00200", 500));
  }
};
