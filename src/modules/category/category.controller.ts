import { Request, Response, NextFunction } from "express";
import { CategoryService } from "./category.service";
import { sendSuccess, sendError } from "@utils/response";

const service = new CategoryService();

export class CategoryController {

  // GET /categories
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, slug } = req.query;
      const categories = await service.getAllCategories(
        name as string | undefined,
        slug as string | undefined
      );
      sendSuccess(res, categories);
    } catch (err) {
      next(err);
    }
  }

  // GET /categories/:id
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await service.getCategoryById(req.params.id);
      if (!category) {
        sendError(res, "Category not found", 404);
        return;
      }
      sendSuccess(res, category);
    } catch (err) {
      next(err);
    }
  }

  // POST /categories
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await service.createCategory(req.body);
      sendSuccess(res, category, "Category created", 201);
    } catch (err) {
      next(err);
    }
  }

  // PATCH /categories/:id
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await service.updateCategory(req.params.id, req.body);
      sendSuccess(res, category, "Category updated");
    } catch (err) {
      next(err);
    }
  }

  // DELETE /categories/:id
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await service.deleteCategory(req.params.id);
      sendSuccess(res, null, "Category deleted");
    } catch (err) {
      next(err);
    }
  }
}