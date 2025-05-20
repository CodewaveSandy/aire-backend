// scripts/update-skill-aliases.ts
import mongoose from "mongoose";
import { Skill } from "./models/skill.model";

const aliasMap: Record<string, string[]> = {
  javascript: ["js", "java script"],
  typescript: ["ts"],
  nodejs: ["node.js", "node", "node js"],
  react: ["react.js", "reactjs"],
  mongodb: ["mongo", "mongo db"],
  nextjs: ["next", "next.js"],
  tailwindcss: ["tailwind", "tailwind css"],
  python: ["py", "python3"],
};

const updateAliases = async () => {
  for (const [canonical, aliases] of Object.entries(aliasMap)) {
    const skill = await Skill.findOne({ slug: canonical });

    if (!skill) {
      console.log(`Skill not found: ${canonical}`);
      continue;
    }

    const uniqueAliases = Array.from(new Set([...skill.aliases, ...aliases]));
    skill.aliases = uniqueAliases;
    await skill.save();

    console.log(
      `Updated: ${skill.name} → Aliases: ${uniqueAliases.join(", ")}`
    );
  }

  await mongoose.disconnect();
};

updateAliases().catch(console.error);

