import { Router } from "express";
import {
  createCandidate,
  getAllCandidates,
  getCandidateById,
  updateCandidate,
  deleteCandidate,
  parseResume,
} from "../controllers/candidate.controller";
import { authMiddleware, authorize } from "../middleware/auth.middleware";
import { filterMiddleware } from "../middleware/filter.middleware";
import { paginationMiddleware } from "../middleware/pagination.middleware";
import { Candidate } from "../models/candidate.model";
import { resumeUpload } from "../utils/upload.utils";

const router = Router();

router.use(authMiddleware);

router.post("/", authorize("hr"), createCandidate);

router.get(
  "/",
  filterMiddleware({
    model: Candidate,
    searchableFields: ["fullName", "email", "location", "education"],
    multiValueFields: ["skills", "status"],
    allowedFields: ["fullName", "email", "experience", "location", "status"],
    defaultSort: "createdAt",
  }),
  paginationMiddleware,
  getAllCandidates
);

router.get("/:id", getCandidateById);
router.put("/:id", authorize("hr"), updateCandidate);
router.delete("/:id", authorize("hr"), deleteCandidate);
router.post(
  "/parse-resume",
  authorize("hr"),
  resumeUpload.single("resume"),
  parseResume
);

export default router;

