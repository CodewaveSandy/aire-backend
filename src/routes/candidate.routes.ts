import { Router } from "express";
import {
  createCandidate,
  getAllCandidates,
  getCandidateById,
  updateCandidate,
  deleteCandidate,
} from "../controllers/candidate.controller";
import { authMiddleware, authorize } from "../middleware/auth.middleware";
import { filterMiddleware } from "../middleware/filter.middleware";
import { paginationMiddleware } from "../middleware/pagination.middleware";
import { Candidate } from "../models/candidate.model";

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

export default router;

