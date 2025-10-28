import { ErrorCode } from "@/types/backend";

export interface ApiError extends Error {
  code?: ErrorCode;
  statusCode?: number;
  details?: unknown;
}

export function createErrorResponse(err: ApiError) {
  console.error("Error:", err);

  const statusCode = err.statusCode || 500;
  const code = err.code || ErrorCode.INTERNAL_ERROR;

  return {
    status: statusCode,
    body: {
      success: false,
      error: err.message || "Internal server error",
      code,
      details: err.details,
    },
  };
}

