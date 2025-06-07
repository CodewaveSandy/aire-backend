"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.suggestWithOpenAI = exports.rankCandidatesByJobSkills = exports.getRecentCandidates = void 0;
const mongoose_1 = require("mongoose");
const candidate_model_1 = require("../models/candidate.model");
const logger_1 = require("../config/logger");
const openai_1 = require("../config/openai");
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
const suggestWithOpenAI = async ({ job, candidates, }) => {
    try {
        const jobSkillNames = job.skills.map((s) => s.name).join(", ");
        const candidateLines = candidates
            .map((c) => `${c.id}: Skills: [${c.skills.join(", ")}], Experience: ${c.experience}, Location: ${c.location || "N/A"}`)
            .join("\n");
        const prompt = `
      You are an expert HR assistant.
      
      You are provided with:
      - A job title
      - A list of required skills
      - A set of candidate profiles (anonymized)
      Your task is to pick the best 10 candidates based on how well their skills and experience match the job requirements.
      
      When evaluating skills:
      - Use your general knowledge of which technologies, tools, or methods are closely related.
      - For example, if a skill is a subset or common dependency of another, infer that relationship.
      - Do not require exact keyword matches.
      
      When evaluating experience:
      - Prefer candidates within the job’s expected experience range.
      
      Reply only with an array of candidate indexes like [0, 3, 5].
      
      Job title: "${job.title}"
      Required skills: [${jobSkillNames}]
      Preferred experience: between ${job.minExpYear} to ${job.maxExpYear} years
      
      Candidates: ${candidateLines}
      Reply with an array of candidate indexes like [0, 3, 5].
      `.trim();
        logger_1.logger.info("Sending prompt to OpenAI:");
        const messages = [
            { role: "user", content: prompt },
        ];
        const completion = await openai_1.openai.chat.completions.create({
            model: "gpt-4",
            messages,
            temperature: 0.4,
        });
        const content = completion.choices[0].message.content ?? "";
        const match = content.match(/\[([0-9,\s]+)\]/);
        if (!match)
            throw new Error("Invalid AI response format");
        const indexes = match[1]
            .split(",")
            .map((n) => parseInt(n.trim()))
            .filter((n) => !isNaN(n));
        logger_1.logger.info(`AI matched candidate indexes: ${indexes}`);
        return indexes;
    }
    catch (err) {
        logger_1.logger.error("OpenAI matching failed:", err);
        return null;
    }
};
exports.suggestWithOpenAI = suggestWithOpenAI;
//# sourceMappingURL=jobOpenings.service.js.map