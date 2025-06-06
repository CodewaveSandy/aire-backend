"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrgSkill = void 0;
const mongoose_1 = require("mongoose");
const orgSkillSchema = new mongoose_1.Schema({
    organization: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
    },
    skill: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Skill",
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
orgSkillSchema.index({ organization: 1, skill: 1 }, { unique: true });
exports.OrgSkill = (0, mongoose_1.model)("OrgSkill", orgSkillSchema);
//# sourceMappingURL=orgSkill.model.js.map