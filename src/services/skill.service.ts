import { Skill } from "../models/skill.model";

/**
 * Normalize and slugify a skill name
 */
const generateSlug = (name: string) =>
  name.toLowerCase().trim().replace(/\s+/g, "-");

const generateAliases = (raw: string, slug: string): string[] => {
  const aliases = new Set<string>();

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
export const findOrCreateSkill = async (
  name: string,
  extraAliases?: string
) => {
  const raw = name.trim();

  const slug = generateSlug(raw);
  const autoAliases = generateAliases(raw, slug);

  // Process any user-provided aliases
  const userAliases =
    extraAliases
      ?.split(";")
      .map((a) => a.trim().toLowerCase())
      .filter(Boolean) || [];

  const combinedAliases = Array.from(new Set([...autoAliases, ...userAliases]));

  // Find by slug or any of the aliases
  let skill =
    (await Skill.findOne({ slug })) ||
    (await Skill.findOne({ aliases: { $in: combinedAliases } }));

  if (!skill) {
    skill = await Skill.create({ name: raw, slug, aliases: combinedAliases });
  }

  return skill;
};

/**
 * Bulk resolver for parsed skill names
 */
export const resolveSkillsFromText = async (skills: string[]) => {
  return await Promise.all(skills.map((name) => findOrCreateSkill(name)));
};

