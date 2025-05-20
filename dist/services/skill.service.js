"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveSkillsFromText = exports.findOrCreateSkill = void 0;
const skill_model_1 = require("../models/skill.model");
/**
 * Normalize and slugify a skill name
 */
const generateSlug = (name) => name.toLowerCase().trim().replace(/\s+/g, "-");
const generateAliases = (raw, slug) => {
    const aliases = new Set();
    const lowerRaw = raw.toLowerCase().trim();
    aliases.add(slug); // Always include the slug
    aliases.add(lowerRaw); // Original form
    if (lowerRaw.includes(".")) {
        aliases.add(lowerRaw.replace(/\./g, " ")); // Replace dots with spaces
        aliases.add(lowerRaw.split(".")[0]); // Part before dot
    }
    return [...aliases];
};
/**
 * Reusable logic to find or create a skill
 */
const findOrCreateSkill = async (name, extraAliases) => {
    const raw = name.trim();
    const slug = generateSlug(raw);
    const autoAliases = generateAliases(raw, slug);
    // Process any user-provided aliases
    const userAliases = extraAliases
        ?.split(";")
        .map((a) => a.trim().toLowerCase())
        .filter(Boolean) || [];
    const combinedAliases = Array.from(new Set([...autoAliases, ...userAliases]));
    // Find by slug or any of the aliases
    let skill = (await skill_model_1.Skill.findOne({ slug })) ||
        (await skill_model_1.Skill.findOne({ aliases: { $in: combinedAliases } }));
    if (!skill) {
        skill = await skill_model_1.Skill.create({ name: raw, slug, aliases: combinedAliases });
    }
    return skill;
};
exports.findOrCreateSkill = findOrCreateSkill;
/**
 * Bulk resolver for parsed skill names
 */
const resolveSkillsFromText = async (skills) => {
    return await Promise.all(skills.map((name) => (0, exports.findOrCreateSkill)(name)));
};
exports.resolveSkillsFromText = resolveSkillsFromText;
//# sourceMappingURL=skill.service.js.map