export * from "./region.types";
export * from "./user.types";
export * from "./path.types";
export * from "./quest.types";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

export interface ViewportQuery {
  bounds: string; // "lng1,lat1,lng2,lat2"
  resolution: number;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code: ErrorCode;
  details?: any;
}

export enum ErrorCode {
  PATH_TOO_LARGE = "PATH_TOO_LARGE",
  PATH_TOO_SMALL = "PATH_TOO_SMALL",
  INVALID_COORDINATES = "INVALID_COORDINATES",
  PATH_PROCESSING_FAILED = "PATH_PROCESSING_FAILED",
  REGION_NOT_FOUND = "REGION_NOT_FOUND",
  REGION_OVERLOAD = "REGION_OVERLOAD",
  TOO_MANY_REGIONS = "TOO_MANY_REGIONS",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  DATABASE_ERROR = "DATABASE_ERROR",
  TIMEOUT = "TIMEOUT",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}
