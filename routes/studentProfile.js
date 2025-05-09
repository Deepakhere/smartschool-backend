import express from "express";
import {
  getParentProfileByEmail,
  createStudentProfile,
} from "../controllers/studentProfile.js";
import auth from "../middleware/auth.js";
import {
  checkCreatePermission,
  checkAdminPermission,
} from "../middleware/permissions.js";

const router = express.Router();

router.get(
  "/:organizationId/get-parent-profile/:email",
  auth,
  checkAdminPermission,
  getParentProfileByEmail
);

router.post(
  "/:organizationId/add-student-profile",
  auth,
  checkAdminPermission,
  checkCreatePermission,
  createStudentProfile
);

export default router;
