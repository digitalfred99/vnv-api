import { AppDataSource } from "@config/data-source";
import { TicketCategory } from "@entities/TicketCategory";
import { FindOptionsWhere } from "typeorm";

export class CategoryService {
  private repo = AppDataSource.getRepository(TicketCategory);

  async getCategoryById(id: string): Promise<TicketCategory | null> {
    return this.repo.findOne({ where: { id, isActive: true } });
  }

  async getAllCategories(name?: string, slug?: string): Promise<TicketCategory[]> {
    const whereConditions: FindOptionsWhere<TicketCategory> = { isActive: true };
    if (name) whereConditions.name = name;
    if (slug) whereConditions.slug = slug;
    return this.repo.find({ where: whereConditions });
  }

  async createCategory(data: Partial<TicketCategory>): Promise<TicketCategory> {
    if (!data.name || !data.slug || !data.price || !data.zoneLabel) {
      throw new Error("Missing required fields: name, slug, price, zoneLabel");
    }
    const category = this.repo.create(data);
    return this.repo.save(category);
  }

  async updateCategory(id: string, data: Partial<TicketCategory>): Promise<TicketCategory> {
    const category = await this.repo.findOne({ where: { id, isActive: true } });
    if (!category) {
      throw new Error("Category not found");
    }
    Object.assign(category, data);
    return this.repo.save(category);
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await this.repo.findOne({ where: { id } });
    if (!category) {
      throw new Error("Category not found");
    }
    await this.repo.remove(category);
  }
}