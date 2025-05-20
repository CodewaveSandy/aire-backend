"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSkillById = exports.deleteSkill = exports.updateSkill = exports.getAllSkills = exports.createSkill = void 0;
const skill_model_1 = require("../models/skill.model");
const logger_1 = require("../config/logger");
const response_utils_1 = require("../utils/response.utils");
const skill_service_1 = require("../services/skill.service");
const createSkill = async (req, res, next) => {
    try {
        const { name, aliases } = req.body;
        if (!name || typeof name !== "string") {
            return (0, response_utils_1.failedResponse)(res, "Skill name is required and must be a string.");
        }
        const skill = await (0, skill_service_1.findOrCreateSkill)(name, aliases);
        (0, response_utils_1.successResponse)(res, skill, "Skill created or already exists");
    }
    catch (error) {
        logger_1.logger.error("Error creating skill:", error);
        next(error);
    }
};
exports.createSkill = createSkill;
const getAllSkills = async (req, res, next) => {
    try {
        const hasPagination = !!res.locals.filteredData?.pagination;
        if (hasPagination) {
            const { results, pagination } = res.locals.filteredData;
            (0, response_utils_1.successResponse)(res, { results, pagination }, "Skills retrieved with pagination");
        }
        else {
            const model = res.locals.model;
            const data = await model
                .find(res.locals.filterQuery || {})
                .sort(res.locals.sortQuery || {})
                .select(res.locals.fieldProjection || "");
            (0, response_utils_1.successResponse)(res, data, "Skills retrieved");
        }
    }
    catch (error) {
        logger_1.logger.error("Error fetching skills:", error);
        next(error);
    }
};
exports.getAllSkills = getAllSkills;
const updateSkill = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const slug = name.toLowerCase().trim().replace(/\s+/g, "-");
        const updated = await skill_model_1.Skill.findByIdAndUpdate(id, { name, slug }, { new: true, runValidators: true });
        if (!updated)
            return (0, response_utils_1.failedResponse)(res, "Skill not found");
        (0, response_utils_1.successResponse)(res, updated, "Skill updated");
    }
    catch (error) {
        logger_1.logger.error("Error updating skill:", error);
        next(error);
    }
};
exports.updateSkill = updateSkill;
const deleteSkill = async (req, res, next) => {
    try {
        const { id } = req.params;
        const deleted = await skill_model_1.Skill.findByIdAndDelete(id);
        if (!deleted)
            return (0, response_utils_1.failedResponse)(res, "Skill not found");
        (0, response_utils_1.successResponse)(res, deleted, "Skill deleted");
    }
    catch (error) {
        logger_1.logger.error("Error deleting skill:", error);
        next(error);
    }
};
exports.deleteSkill = deleteSkill;
const getSkillById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const skill = await skill_model_1.Skill.findById(id);
        if (!skill)
            return (0, response_utils_1.failedResponse)(res, "Skill not found");
        (0, response_utils_1.successResponse)(res, skill, "Skill retrieved");
    }
    catch (error) {
        logger_1.logger.error("Error retrieving skill by ID:", error);
        next(error);
    }
};
exports.getSkillById = getSkillById;
//# sourceMappingURL=skill.controller.js.map