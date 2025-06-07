import { Types } from "mongoose";
import { Candidate } from "../models/candidate.model";
import { ISkill } from "../models/skill.model";
import {
  AnonymizedCandidate,
  CandidateWithSkills,
  JobWithSkills,
  RankedCandidate,
} from "../types";
import { logger } from "../config/logger";
import { ChatCompletionMessageParam } from "openai/resources/chat";
import { openai } from "../config/openai";

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

export const suggestWithOpenAI = async ({
  job,
  candidates,
}: {
  job: JobWithSkills;
  candidates: AnonymizedCandidate[];
}): Promise<number[] | null> => {
  try {
    const jobSkillNames = job.skills.map((s) => s.name).join(", ");
    const candidateLines = candidates
      .map(
        (c) =>
          `${c.id}: Skills: [${c.skills.join(", ")}], Experience: ${
            c.experience
          }, Location: ${c.location || "N/A"}`
      )
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

    logger.info("Sending prompt to OpenAI:");

    const messages: ChatCompletionMessageParam[] = [
      { role: "user", content: prompt },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages,
      temperature: 0.4,
    });

    const content = completion.choices[0].message.content ?? "";
    const match = content.match(/\[([0-9,\s]+)\]/);

    if (!match) throw new Error("Invalid AI response format");

    const indexes = match[1]
      .split(",")
      .map((n) => parseInt(n.trim()))
      .filter((n) => !isNaN(n));

    logger.info(`AI matched candidate indexes: ${indexes}`);
    return indexes;
  } catch (err) {
    logger.error("OpenAI matching failed:", err);
    return null;
  }
};

