import express from "express";
import {
  getParentProfileByEmail,
  createStudentProfile,
  getStudentProfile,
  getStudentById,
  editStudentProfile,
} from "../controllers/studentProfile.js";
import auth from "../middleware/auth.js";
import {
  checkCreatePermission,
  checkAdminPermission,
  checkUpdatePermission,
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

router.get(
  "/:organizationId/get-student-profile",
  auth,
  checkAdminPermission,
  getStudentProfile
);

router.get(
  "/:organizationId/get-student-by-id/:studentId",
  auth,
  checkAdminPermission,
  getStudentById
);

router.put(
  "/:organizationId/edit-student-profile/:studentId",
  auth,
  checkAdminPermission,
  checkUpdatePermission,
  editStudentProfile
);

export default router;
