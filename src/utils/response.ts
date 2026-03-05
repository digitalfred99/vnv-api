import { Response } from "express";
import { ApiResponse, PaginatedResponse } from "@types-local/index";

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = "Success",
  statusCode = 200
): Response => {
  const body: ApiResponse<T> = { success: true, message, data };
  return res.status(statusCode).json(body);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
  data: unknown = null
): Response => {
  const body: ApiResponse = { success: false, message, data: data as null };
  return res.status(statusCode).json(body);
};

export const sendPaginated = <T>(
  res: Response,
  items: T[],
  total: number,
  page: number,
  limit: number,
  message = "Success"
): Response => {
  const body: PaginatedResponse<T> = {
    success: true,
    message,
    data: items,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
  return res.status(200).json(body);
};
