import express from "express";

import {
  createOrganization,
  getAllOrganizations,
  updateOrganization,
  removeUserFromOrganization,
  addUserToOrganization,
  deleteOrganization,
} from "../controllers/organization.js";
import auth from "../middleware/auth.js";
import {
  checkCreatePermission,
  checkUpdatePermission,
  checkDeletePermission,
  checkAdminPermission,
  checkSuperAdminPermission,
} from "../middleware/permissions.js";

const router = express.Router();

router.get("/get-all-organizations", auth, getAllOrganizations);

router.post(
  "/create-organization",
  auth,
  checkSuperAdminPermission,
  checkCreatePermission,
  createOrganization
);

router.put(
  "/update-organization/:organizationId",
  auth,
  checkAdminPermission,
  checkUpdatePermission,
  updateOrganization
);

router.put(
  "/remove-user/:organizationId",
  auth,
  checkAdminPermission,
  checkDeletePermission,
  removeUserFromOrganization
);

router.put(
  "/add-user-to-organization/:organizationId",
  auth,
  checkAdminPermission,
  checkUpdatePermission,
  addUserToOrganization
);

router.delete(
  "/delete-organization/:organizationId",
  auth,
  checkSuperAdminPermission,
  deleteOrganization
);

export default router;
