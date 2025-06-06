import { Router } from "express";
import {
  createOrganization,
  getAllOrganisation,
  getOrganizationById,
  updateOrganizationById,
  deleteOrganizationById,
} from "../controllers/organization.controller";
import { authMiddleware, authorize } from "../middleware/auth.middleware";
import { logger } from "../config/logger";
import { orgLogoUpload } from "../utils/upload.utils";

const router = Router();

// Middleware to log organization route accesses
router.use((req, _res, next) => {
  logger.debug(`organization route accessed: ${req.method} ${req.originalUrl}`);
  next();
});

// Add Organazation route
router.post(
  "/",
  authMiddleware,
  authorize("hr"),
  orgLogoUpload.single("orgLogo"),
  createOrganization
);

// Get all organization
router.get("/", getAllOrganisation);

// Get organiation by id
router.get("/:id", authMiddleware, authorize("hr"), getOrganizationById);

// update organiation by id
router.post("/:id", authMiddleware, authorize("hr"), updateOrganizationById);

// Delete organiation by id
router.delete("/:id", authMiddleware, authorize("hr"), deleteOrganizationById);

export default router;

