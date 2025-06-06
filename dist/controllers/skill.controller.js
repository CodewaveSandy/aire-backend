"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSkillById = exports.deleteSkill = exports.updateSkill = exports.getAllSkills = exports.createSkill = void 0;
const skill_model_1 = require("../models/skill.model");
const logger_1 = require("../config/logger");
const response_utils_1 = require("../utils/response.utils");
const skill_service_1 = require("../services/skill.service");
const orgSkill_model_1 = require("../models/orgSkill.model");
const createSkill = async (req, res, next) => {
    try {
        const { name, aliases } = req.body;
        if (!name || typeof name !== "string") {
            return (0, response_utils_1.failedResponse)(res, "Skill name is required and must be a string.");
        }
        const skill = await (0, skill_service_1.findOrCreateSkill)(name, aliases);
        const orgSkill = await orgSkill_model_1.OrgSkill.findOneAndUpdate({ organization: req.user?.organization, skill: skill._id }, { isActive: true }, { new: true, upsert: true }).lean();
        const flattened = {
            ...orgSkill,
            _id: skill._id,
            name: skill.name,
            slug: skill.slug,
            aliases: skill.aliases,
        };
        (0, response_utils_1.successResponse)(res, flattened, "Skill created or already exists");
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
        const orgId = req.user?.organization;
        if (!orgId) {
            return (0, response_utils_1.failedResponse)(res, "Organization context not found.");
        }
        const baseFilter = {
            ...res.locals.filterQuery,
            organization: orgId,
            isActive: true,
        };
        if (hasPagination) {
            const { sortQuery, fieldProjection } = res.locals;
            const page = Math.max(parseInt(req.query.page) || 1, 1);
            const limit = Math.max(parseInt(req.query.limit) || 10, 1);
            const skip = (page - 1) * limit;
            const [rawResults, totalCount] = await Promise.all([
                orgSkill_model_1.OrgSkill.find(baseFilter)
                    .sort(sortQuery || {})
                    .skip(skip)
                    .limit(limit)
                    .populate("skill")
                    .select(fieldProjection || "")
                    .lean(),
                orgSkill_model_1.OrgSkill.countDocuments(baseFilter),
            ]);
            const results = rawResults.map(({ skill, ...orgSkill }) => ({
                ...orgSkill,
                skillId: skill?._id,
                ...skill,
            }));
            (0, response_utils_1.successResponse)(res, {
                results,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limit),
                    totalCount,
                },
            }, "Skills retrieved with pagination");
        }
        else {
            const rawData = await orgSkill_model_1.OrgSkill.find(baseFilter)
                .sort(res.locals.sortQuery || {})
                .populate("skill")
                .select(res.locals.fieldProjection || "")
                .lean();
            const data = rawData.map(({ skill, ...orgSkill }) => ({
                ...orgSkill,
                skillId: skill?._id,
                ...skill,
            }));
            (0, response_utils_1.successResponse)(res, data, "Skills retrieved");
        }
    }
    catch (error) {
        logger_1.logger.error("Error fetching org-specific skills:", error);
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