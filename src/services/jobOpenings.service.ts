import { Types } from "mongoose";
import { Candidate } from "../models/candidate.model";
import { ISkill } from "../models/skill.model";
import { CandidateWithSkills, RankedCandidate } from "../types";

// Get candidates created in last 6 months with populated skills
export const getRecentCandidates = async (
  orgId: string
): Promise<CandidateWithSkills[]> => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const candidates = await Candidate.find({
    organization: new Types.ObjectId(orgId),
    createdAt: { $gte: sixMonthsAgo },
  })
    .populate("skills")
    .lean();

  return candidates as unknown as CandidateWithSkills[];
};

// Rank candidates based on skills match and experience
export const rankCandidatesByJobSkills = (
  jobSkills: ISkill[],
  candidates: CandidateWithSkills[]
): RankedCandidate[] => {
  const jobSkillsSet = new Set<string>();
  const jobSkillAliasMap = new Map<string, string>();

  for (const skill of jobSkills) {
    const idStr = skill._id.toString();
    jobSkillsSet.add(idStr);
    for (const alias of skill.aliases || []) {
      jobSkillAliasMap.set(alias.trim().toLowerCase(), idStr);
    }
  }

  return candidates
    .map((candidate): RankedCandidate => {
      const candidateSkillIds = new Set<string>();
      const candidateAliases = new Set<string>();
      const matchedSkillIds = new Set<string>();

      for (const skill of candidate.skills) {
        const idStr = skill._id.toString();
        candidateSkillIds.add(idStr);
        for (const alias of skill.aliases || []) {
          candidateAliases.add(alias.trim().toLowerCase());
        }
      }

      for (const id of candidateSkillIds) {
        if (jobSkillsSet.has(id)) matchedSkillIds.add(id);
      }

      for (const alias of candidateAliases) {
        const matchedId = jobSkillAliasMap.get(alias);
        if (matchedId) matchedSkillIds.add(matchedId);
      }

      const skillMatchRatio =
        jobSkillsSet.size > 0 ? matchedSkillIds.size / jobSkillsSet.size : 0;

      const experience = Number(candidate.experience) || 0;
      const experienceBoost = Math.min(experience / 10, 1);

      const score = Math.min(skillMatchRatio + experienceBoost * 0.1, 1);

      return {
        ...candidate,
        matchPercentage: Math.round(score * 100),
        matchedSkills: Array.from(matchedSkillIds),
      };
    })
    .sort((a, b) => b.matchPercentage - a.matchPercentage);
};

