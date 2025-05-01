import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import { sendEmail } from "../utils/emailService.js";

const secret = process.env.SECRET;
const RESET_SECRET = process.env.RESET_SECRET;
const CLIENT_URL = process.env.FRONTEND_URL;

export const signin = async (req, res) => {
  const { email, password } = req.body;

  try {
    let oldUser;

    oldUser = await User.findOne({ email });

    if (!oldUser) {
      return res.status(403).json({
        Status: "failure",
        Error: {
          message:
            "Email or password seems to be wrong, please try again with valid credentials.",
          name: "ValidationError",
          code: "EX-00101",
        },
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, oldUser.password);

    if (!isPasswordCorrect) {
      return res.status(403).json({
        Status: "failure",
        Error: {
          message:
            "Email or password seems to be wrong, please try again with valid credentials.",
          name: "ValidationError",
          code: "EX-00101",
        },
      });
    }

    const token = jwt.sign({ email: oldUser.email, id: oldUser.id }, secret, {
      expiresIn: "1h",
    });

    res.status(200).json({
      Status: "success",
      Data: {
        id: oldUser.id,
        email: oldUser.email || "",
        token,
        role: oldUser.role,
      },
    });
  } catch (err) {
    res.status(500).json({
      Status: "failure",
      Error: {
        message: "Something went wrong, please try again later.",
        name: "ServerError",
        code: "EX-500",
      },
    });
  }
};

export const signup = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    let oldUser;

    oldUser = await User.findOne({ email });

    if (oldUser) {
      return res.status(403).json({
        Status: "failure",
        Error: {
          message: "User already exists",
          name: "DuplicateError",
          code: "EX-00102",
        },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await User.create({
      email: email || "",
      password: hashedPassword,
      role,
    });

    const token = jwt.sign({ email: result.email, id: result.id }, secret, {
      expiresIn: "1h",
    });

    res.status(201).json({
      Status: "success",
      Data: {
        id: result.id,
        username: result.username,
        email: result.email || "",
        token,
        role: result.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      Status: "failure",
      Error: {
        message: "Something went wrong, please try again later.",
        name: "ServerError",
        code: "EX-500",
      },
    });

    console.log(error);
  }
};

export const getUserDetails = async (req, res) => {
  try {
    const token = req.headers["accesstoken"]?.split(" ")[1];
    if (!token) {
      return res.status(403).json({
        Status: "failure",
        Error: {
          message: "Unauthorized. Token is required.",
          name: "AuthenticationError",
          code: "EX-00103",
        },
      });
    }

    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id).select("email");
    if (!user) {
      return res.status(403).json({
        Status: "failure",
        Error: {
          message: "User not found.",
          name: "NotFoundError",
          code: "EX-00104",
        },
      });
    }

    res.status(200).json({
      Status: "success",
      Data: {
        id: user.id,
        email: user.email,
        role: user.rolem,
      },
    });
  } catch (error) {
    res.status(500).json({
      Status: "failure",
      Error: {
        message: "Something went wrong, please try again later.",
        name: "ServerError",
        code: "EX-500",
      },
    });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(403).json({
        Status: "failure",
        Error: {
          message: "Email does not exist, please check and try again.",
          name: "ValidationError",
          code: "EX-00107",
        },
      });
    }

    const resetTokenData = crypto.randomBytes(32).toString("hex");

    const resetToken = jwt.sign(
      { data: resetTokenData, userId: user.id },
      RESET_SECRET,
      {
        expiresIn: "1h",
      }
    );

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 3600000; // 1 hour

    await user.save();

    const resetUrl = `${CLIENT_URL}/reset-password/?token=${resetToken}`;

    const message = `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset for your Smart School account.</p>
      <p>Please click on the following link to reset your password:</p>
      <a href="${resetUrl}" target="_blank">Click here to reset your password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
    `;

    await sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      html: message,
    });

    res.status(200).json({
      Status: "success",
      Data: {
        message:
          "If that email address is in our database, we will send you a password recovery link.",
      },
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({
      Status: "failure",
      Error: {
        message: "Something went wrong, please try again later.",
        name: "ServerError",
        code: "EX-500",
      },
    });
  }
};

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        Status: "failure",
        Error: {
          message: "Password reset token is invalid or has expired.",
          name: "ValidationError",
          code: "EX-00105",
        },
      });
    }

    try {
      const decoded = jwt.verify(token, RESET_SECRET);

      if (decoded.userId !== user.id) {
        return res.status(400).json({
          Status: "failure",
          Error: {
            message: "Invalid token for this user.",
            name: "ValidationError",
            code: "EX-00108",
          },
        });
      }
    } catch (jwtError) {
      return res.status(400).json({
        Status: "failure",
        Error: {
          message: "Password reset token is invalid or has expired.",
          name: "ValidationError",
          code: "EX-00105",
        },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      Status: "success",
      Data: {
        message: "Password has been reset successfully.",
      },
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      Status: "failure",
      Error: {
        message: "Something went wrong, please try again later.",
        name: "ServerError",
        code: "EX-500",
      },
    });
  }
};
