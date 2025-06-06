"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteOrganizationById = exports.updateOrganizationById = exports.getOrganizationById = exports.getAllOrganisation = exports.createOrganization = void 0;
const organization_model_1 = require("../models/organization.model");
const logger_1 = require("../config/logger");
const response_utils_1 = require("../utils/response.utils");
const common_utils_1 = require("../utils/common.utils");
// Define create organization controller
const createOrganization = async (req, res, next) => {
    try {
        const { name, logo } = req.body;
        // validation
        if (!name || typeof name !== "string") {
            return (0, response_utils_1.failedResponse)(res, "Organization name is required and must be a string");
        }
        const trimmedName = name.trim();
        // Check if organization with same name already exists
        const existingOrg = await organization_model_1.OrganizationModel.findOne({
            name: trimmedName,
            isDelete: false,
        });
        if (existingOrg) {
            return (0, response_utils_1.failedResponse)(res, "Organization with this name already exists");
        }
        // generate slug name
        const orgSlug = (0, common_utils_1.slugify)(name);
        // Define Logo
        const orgLogo = logo && logo.trim() !== ""
            ? logo.trim()
            : "https://codewave-wp.gumlet.io/wp-content/uploads/2024/03/codew-logo.png";
        // create organazation
        const newOrganization = await organization_model_1.OrganizationModel.create({
            name: trimmedName,
            slug: orgSlug,
            logoUrl: orgLogo,
        });
        if (newOrganization) {
            logger_1.logger.info(`Organization created successfully`);
            return (0, response_utils_1.successResponse)(res, newOrganization, "New organization created successfully");
        }
    }
    catch (error) {
        logger_1.logger.error("Error creating organization:", error);
        next(error);
    }
};
exports.createOrganization = createOrganization;
// Get all organization controller mehtod
const getAllOrganisation = async (req, res, next) => {
    try {
        // Check if organizations exist
        const isOrgExist = await organization_model_1.OrganizationModel.countDocuments({
            isDelete: false,
        });
        if (isOrgExist === 0) {
            return (0, response_utils_1.failedResponse)(res, "No organizations found");
        }
        // Find all organization
        const organization = await organization_model_1.OrganizationModel.find({
            isActive: true,
            isDelete: false,
        });
        if (organization.length > 0) {
            logger_1.logger.info(`All organization Fetch successfully`);
            return (0, response_utils_1.successResponse)(res, organization, "All organization fetch successfully");
        }
    }
    catch (error) {
        logger_1.logger.error("Error in getting all organization:", error);
        next(error);
    }
};
exports.getAllOrganisation = getAllOrganisation;
// Get single organization controller mehtod
const getOrganizationById = async (req, res, next) => {
    try {
        const { id } = req.params;
        // check organization is exist or not
        const isOrgExist = await organization_model_1.OrganizationModel.findOne({ _id: id });
        if (!isOrgExist) {
            return (0, response_utils_1.failedResponse)(res, "Organisation not found with these Id");
        }
        const existingOrg = await organization_model_1.OrganizationModel.findById({ _id: id });
        if (existingOrg) {
            return (0, response_utils_1.successResponse)(res, existingOrg, "Organization fetch successfully");
        }
    }
    catch (error) {
        logger_1.logger.error("Error in getting organization:", error);
        next(error);
    }
};
exports.getOrganizationById = getOrganizationById;
// UPdate organization controller mehtod
const updateOrganizationById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, logo } = req.body;
        const existingOrg = await organization_model_1.OrganizationModel.findById(id);
        if (!existingOrg) {
            return (0, response_utils_1.failedResponse)(res, "Organisation not found with these Id");
        }
        const updatedName = name?.trim() || existingOrg.name;
        const updatedSlug = name?.trim() ? (0, common_utils_1.slugify)(name.trim()) : existingOrg.slug;
        const updatedLogo = logo?.trim() ||
            "https://codewave-wp.gumlet.io/wp-content/uploads/2024/03/codew-logo.png";
        const updateOrg = await organization_model_1.OrganizationModel.findByIdAndUpdate(id, {
            name: updatedName,
            slug: updatedSlug,
            logoUrl: updatedLogo,
        }, { new: true });
        if (updateOrg) {
            return (0, response_utils_1.successResponse)(res, updateOrg, "Organization updated successfully");
        }
    }
    catch (error) {
        logger_1.logger.error("Error in updating organization:", error);
        next(error);
    }
};
exports.updateOrganizationById = updateOrganizationById;
// Delete organization controller mehtod
const deleteOrganizationById = async (req, res, next) => {
    try {
        const { id } = req.params;
        // check organization is exist or not
        const isOrgExist = await organization_model_1.OrganizationModel.findOne({ _id: id });
        if (!isOrgExist) {
            return (0, response_utils_1.failedResponse)(res, "Organisation not found with these Id");
        }
        const deleteOrg = await organization_model_1.OrganizationModel.findByIdAndUpdate(id, {
            isDelete: true,
        }, { new: true });
        if (deleteOrg) {
            return (0, response_utils_1.successResponse)(res, "Organization deleted successfully");
        }
    }
    catch (error) {
        logger_1.logger.error("Error in updating organization:", error);
        next(error);
    }
};
exports.deleteOrganizationById = deleteOrganizationById;
//# sourceMappingURL=organization.controller.js.map