import "express";
import { IUser } from "../models/user.model";

declare module "express-serve-static-core" {
  interface Response {
    success(data: any, message?: string): this;
    fail(message: string, errors?: any): this;
    error(message: string, statusCode?: number): this;
  }

  interface Request {
    user?: IUser;
  }
}

