import { Request, Response, NextFunction } from "express";
import { ErrorCode } from "../types";

export interface ApiError extends Error {
  code?: ErrorCode;
  statusCode?: number;
  details?: any;
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("Error:", err);

  const statusCode = err.statusCode || 500;
  const code = err.code || ErrorCode.INTERNAL_ERROR;

  res.status(statusCode).json({
    success: false,
    error: err.message || "Internal server error",
    code,
    details: err.details,
  });
}
