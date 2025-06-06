import { Router } from "express";
import {
  addSkillToOrg,
  getOrgSkills,
  removeOrgSkill,
} from "../controllers/orgSkill.controller";
import { authMiddleware, authorize } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/", authorize("hr"), addSkillToOrg);
router.get("/", getOrgSkills);
router.delete("/:id", authorize("hr"), removeOrgSkill);

export default router;

