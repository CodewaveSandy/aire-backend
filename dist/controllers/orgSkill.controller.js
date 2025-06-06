"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeOrgSkill = exports.getOrgSkills = exports.addSkillToOrg = void 0;
const skill_model_1 = require("../models/skill.model");
const response_utils_1 = require("../utils/response.utils");
const logger_1 = require("../config/logger");
const common_utils_1 = require("../utils/common.utils");
const orgSkill_model_1 = require("../models/orgSkill.model");
const addSkillToOrg = async (req, res, next) => {
    try {
        const { name, aliases = [] } = req.body;
        const orgId = req.user?.organization;
        if (!name || !orgId) {
            return (0, response_utils_1.failedResponse)(res, "Missing required fields.");
        }
        const slug = (0, common_utils_1.slugify)(name);
        // Global skill registry
        let skill = await skill_model_1.Skill.findOne({ slug });
        if (!skill) {
            skill = await skill_model_1.Skill.create({ name, slug, aliases });
        }
        const orgSkill = await orgSkill_model_1.OrgSkill.findOneAndUpdate({ organization: orgId, skill: skill._id }, { isActive: true }, { new: true, upsert: true });
        (0, response_utils_1.successResponse)(res, orgSkill, "Skill assigned to organization");
    }
    catch (err) {
        logger_1.logger.error("Error adding skill to organization:", err);
        next(err);
    }
};
exports.addSkillToOrg = addSkillToOrg;
const getOrgSkills = async (req, res, next) => {
    try {
        const orgId = req.user?.organization;
        const skills = await orgSkill_model_1.OrgSkill.find({
            organization: orgId,
            isActive: true,
        }).populate("skill");
        (0, response_utils_1.successResponse)(res, skills, "Skills for organization retrieved");
    }
    catch (err) {
        logger_1.logger.error("Error getting organization skills:", err);
        next(err);
    }
};
exports.getOrgSkills = getOrgSkills;
const removeOrgSkill = async (req, res, next) => {
    try {
        const { id } = req.params; // OrgSkill _id
        const orgSkill = await orgSkill_model_1.OrgSkill.findByIdAndUpdate(id, { isActive: false }, { new: true });
        if (!orgSkill)
            return (0, response_utils_1.failedResponse)(res, "Skill not found for this organization");
        (0, response_utils_1.successResponse)(res, orgSkill, "Skill removed from organization");
    }
    catch (err) {
        logger_1.logger.error("Error removing org skill:", err);
        next(err);
    }
};
exports.removeOrgSkill = removeOrgSkill;
//# sourceMappingURL=orgSkill.controller.js.map