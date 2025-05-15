import { Response } from "express";

export const successResponse = (
  res: Response,
  data: any,
  message = "Success"
) => {
  return res.status(200).json({
    status: "SUCCESS",
    message,
    data,
  });
};

export const failedResponse = (
  res: Response,
  message: string,
  errors?: any
) => {
  return res.status(400).json({
    status: "FAILURE",
    message,
    errors,
  });
};

export const errorResponse = (
  res: Response,
  message: string,
  statusCode = 500
) => {
  return res.status(statusCode).json({
    status: "ERROR",
    message,
  });
};

