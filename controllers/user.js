import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import axios from "axios";

import User from "../models/User.js";
import { sendEmail } from "../utils/emailService.js";
import { getPasswordResetTemplate } from "../utils/emailTemplates.js";

const secret = process.env.SECRET;
const RESET_SECRET = process.env.RESET_SECRET;
const CLIENT_URL = process.env.FRONTEND_URL;
const RECAPTCHA_SECRET_KEY = process.env.CAPTCHA_KEY;

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

    const user = await User.findById(decoded.id).select("email role");
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
        role: user.role,
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
  const { email, captcha_token: captchaToken } = req.body;

  try {
    if (!email) {
      return res.status(400).json({
        Status: "failure",
        Error: {
          message: "Email is required.",
          name: "ValidationError",
          code: "EX-00105",
        },
      });
    }

    if (!captchaToken) {
      return res.status(403).json({
        Status: "failure",
        Error: {
          message: "Captcha token is required.",
          name: "CaptchaError",
          code: "EX-00106",
        },
      });
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
        console.log(
          `Captcha verification failed. Errors: ${
            errorCodes ? JSON.stringify(errorCodes) : "none"
          }`
        );
        return res.status(403).json({
          Status: "failure",
          Error: {
            message: `Captcha verification failed: ${
              errorCodes ? errorCodes.join(", ") : "unknown error"
            }`,
            name: "CaptchaError",
            code: "EX-00106",
          },
        });
      }
    } catch (captchaError) {
      console.error("Captcha API error:", captchaError);
      return res.status(500).json({
        Status: "failure",
        Error: {
          message: "Error verifying captcha. Please try again later.",
          name: "CaptchaError",
          code: "EX-00106",
        },
      });
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
      return res.status(200).json(successResponse);
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
      console.log(`Password reset email sent to: ${email}`);
    } catch (emailError) {
      console.error("Error sending password reset email:", emailError);
    }

    res.status(200).json(successResponse);
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
  const { password, token } = req.body;

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
