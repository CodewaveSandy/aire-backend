"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rankCandidatesByJobSkills = exports.getRecentCandidates = void 0;
const mongoose_1 = require("mongoose");
const candidate_model_1 = require("../models/candidate.model");
// Get candidates created in last 6 months with populated skills
const getRecentCandidates = async (orgId) => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const candidates = await candidate_model_1.Candidate.find({
        organization: new mongoose_1.Types.ObjectId(orgId),
        createdAt: { $gte: sixMonthsAgo },
    })
        .populate("skills")
        .lean();
    return candidates;
};
exports.getRecentCandidates = getRecentCandidates;
// Rank candidates based on skills match and experience
const rankCandidatesByJobSkills = (jobSkills, candidates) => {
    const jobSkillsSet = new Set();
    const jobSkillAliasMap = new Map();
    for (const skill of jobSkills) {
        const idStr = skill._id.toString();
        jobSkillsSet.add(idStr);
        for (const alias of skill.aliases || []) {
            jobSkillAliasMap.set(alias.trim().toLowerCase(), idStr);
        }
    }
    return candidates
        .map((candidate) => {
        const candidateSkillIds = new Set();
        const candidateAliases = new Set();
        const matchedSkillIds = new Set();
        for (const skill of candidate.skills) {
            const idStr = skill._id.toString();
            candidateSkillIds.add(idStr);
            for (const alias of skill.aliases || []) {
                candidateAliases.add(alias.trim().toLowerCase());
            }
        }
        for (const id of candidateSkillIds) {
            if (jobSkillsSet.has(id))
                matchedSkillIds.add(id);
        }
        for (const alias of candidateAliases) {
            const matchedId = jobSkillAliasMap.get(alias);
            if (matchedId)
                matchedSkillIds.add(matchedId);
        }
        const skillMatchRatio = jobSkillsSet.size > 0 ? matchedSkillIds.size / jobSkillsSet.size : 0;
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
exports.rankCandidatesByJobSkills = rankCandidatesByJobSkills;
//# sourceMappingURL=jobOpenings.service.js.map