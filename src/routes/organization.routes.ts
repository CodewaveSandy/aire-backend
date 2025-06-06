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

router.use(authMiddleware);

// Add Organazation route
router.post(
  "/",
  authorize("hr"),
  orgLogoUpload.single("orgLogo"),
  createOrganization
);

// Get all organization
router.get("/", authorize("hr"), getAllOrganisation);

// Get organiation by id
router.get("/:id", authorize("hr"), getOrganizationById);

// update organiation by id
router.post("/:id", authorize("hr"), updateOrganizationById);

// Delete organiation by id
router.delete("/:id", authorize("hr"), deleteOrganizationById);

export default router;

