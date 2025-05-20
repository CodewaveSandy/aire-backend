"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/update-skill-aliases.ts
const mongoose_1 = __importDefault(require("mongoose"));
const skill_model_1 = require("./models/skill.model");
const aliasMap = {
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
        const skill = await skill_model_1.Skill.findOne({ slug: canonical });
        if (!skill) {
            console.log(`Skill not found: ${canonical}`);
            continue;
        }
        const uniqueAliases = Array.from(new Set([...skill.aliases, ...aliases]));
        skill.aliases = uniqueAliases;
        await skill.save();
        console.log(`Updated: ${skill.name} → Aliases: ${uniqueAliases.join(", ")}`);
    }
    await mongoose_1.default.disconnect();
};
updateAliases().catch(console.error);
//# sourceMappingURL=update.js.map