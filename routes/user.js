import express from "express";
import {
  getUserDetails,
  signin,
  signup,
  forgotPassword,
  resetPassword,
  inviteUser,
  setUserPassword,
  reinviteUser,
  getAllUsers,
} from "../controllers/user.js";
import auth from "../middleware/auth.js";
import {
  checkCreatePermission,
  checkAdminPermission,
} from "../middleware/permissions.js";

const router = express.Router();
router.get("/get-user-details", auth, getUserDetails);
router.get("/get-all-users", auth, checkAdminPermission, getAllUsers);

router.post("/signin", signin);
router.post("/signup", signup);
router.post("/forgot-password", forgotPassword);
router.post(
  "/add-user",
  auth,
  checkAdminPermission,
  checkCreatePermission,
  inviteUser
);
router.post("/reinvite/:userId", auth, checkAdminPermission, reinviteUser);

router.put("/reset-password", resetPassword);
router.put("/set-user-password", setUserPassword);

export default router;
