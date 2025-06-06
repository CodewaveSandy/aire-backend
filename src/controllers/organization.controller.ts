import { Request, Response, NextFunction } from "express";
import { OrganizationModel } from "../models/organization.model";
import { logger } from "../config/logger";
import { failedResponse, successResponse } from "../utils/response.utils";
import { slugify } from "../utils/common.utils";

// Define create organization controller
export const createOrganization = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, logo } = req.body;

    // validation
    if (!name || typeof name !== "string") {
      return failedResponse(
        res,
        "Organization name is required and must be a string"
      );
    }
    const trimmedName = name.trim();

    // Check if organization with same name already exists
    const existingOrg = await OrganizationModel.findOne({
      name: trimmedName,
      isDelete: false,
    });
    if (existingOrg) {
      return failedResponse(res, "Organization with this name already exists");
    }

    // generate slug name
    const orgSlug = slugify(name);

    // Define Logo
    const orgLogo =
      logo && logo.trim() !== ""
        ? logo.trim()
        : "https://codewave-wp.gumlet.io/wp-content/uploads/2024/03/codew-logo.png";

    // create organazation
    const newOrganization = await OrganizationModel.create({
      name: trimmedName,
      slug: orgSlug,
      logoUrl: orgLogo,
    });

    if (newOrganization) {
      logger.info(`Organization created successfully`);
      return successResponse(
        res,
        newOrganization,
        "New organization created successfully"
      );
    }
  } catch (error) {
    logger.error("Error creating organization:", error);
    next(error);
  }
};

// Get all organization controller mehtod
export const getAllOrganisation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check if organizations exist
    const isOrgExist = await OrganizationModel.countDocuments({
      isDelete: false,
    });
    if (isOrgExist === 0) {
      return failedResponse(res, "No organizations found");
    }

    // Find all organization
    const organization = await OrganizationModel.find({
      isActive: true,
      isDelete: false,
    });

    if (organization.length > 0) {
      logger.info(`All organization Fetch successfully`);
      return successResponse(
        res,
        organization,
        "All organization fetch successfully"
      );
    }
  } catch (error) {
    logger.error("Error in getting all organization:", error);
    next(error);
  }
};

// Get single organization controller mehtod
export const getOrganizationById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // check organization is exist or not
    const isOrgExist = await OrganizationModel.findOne({ _id: id });
    if (!isOrgExist) {
      return failedResponse(res, "Organisation not found with these Id");
    }

    const existingOrg = await OrganizationModel.findById({ _id: id });
    if (existingOrg) {
      return successResponse(
        res,
        existingOrg,
        "Organization fetch successfully"
      );
    }
  } catch (error) {
    logger.error("Error in getting organization:", error);
    next(error);
  }
};

// UPdate organization controller mehtod
export const updateOrganizationById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, logo } = req.body;

    const existingOrg = await OrganizationModel.findById(id);
    if (!existingOrg) {
      return failedResponse(res, "Organisation not found with these Id");
    }

    const updatedName = name?.trim() || existingOrg.name;
    const updatedSlug = name?.trim() ? slugify(name.trim()) : existingOrg.slug;
    const updatedLogo =
      logo?.trim() ||
      "https://codewave-wp.gumlet.io/wp-content/uploads/2024/03/codew-logo.png";

    const updateOrg = await OrganizationModel.findByIdAndUpdate(
      id,
      {
        name: updatedName,
        slug: updatedSlug,
        logoUrl: updatedLogo,
      },
      { new: true }
    );

    if (updateOrg) {
      return successResponse(
        res,
        updateOrg,
        "Organization updated successfully"
      );
    }
  } catch (error) {
    logger.error("Error in updating organization:", error);
    next(error);
  }
};

// Delete organization controller mehtod
export const deleteOrganizationById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // check organization is exist or not
    const isOrgExist = await OrganizationModel.findOne({ _id: id });
    if (!isOrgExist) {
      return failedResponse(res, "Organisation not found with these Id");
    }

    const deleteOrg = await OrganizationModel.findByIdAndUpdate(
      id,
      {
        isDelete: true,
      },
      { new: true }
    );
    if (deleteOrg) {
      return successResponse(res, "Organization deleted successfully");
    }
  } catch (error) {
    logger.error("Error in updating organization:", error);
    next(error);
  }
};

