import { Request } from "express";
import { IUser } from "../models/user.model";

// Extended Request interface with user
export interface AuthRequest extends Request {
  user?: IUser;
}

// API response interface
export interface ApiResponse {
  status: "success" | "error" | "fail";
  data?: any;
  message?: string;
  errors?: any;
}

// Login request body interface
export interface LoginRequestBody {
  email: string;
  password: string;
}

// Register request body interface
export interface RegisterRequestBody {
  name: string;
  email: string;
  password: string;
  role: "hr" | "interviewer";
}

