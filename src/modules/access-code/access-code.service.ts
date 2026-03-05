import { AppDataSource } from "@config/data-source";
import { AccessCode } from "@entities/AccessCode";
import { TicketCategory } from "@entities/TicketCategory";
import { randomBytes } from "crypto";

const randomDigits = (length: number): string => {
  const bytes = randomBytes(length);
  return Array.from(bytes)
    .map((b) => b % 10)
    .join("");
};

const generateCode = (slug: string): string => {
  const year = new Date().getFullYear();
  const random = randomDigits(10);
  return `VNV${year}${slug}${random}`;
};

export class AccessCodeService {
  private repo = AppDataSource.getRepository(AccessCode);
  private categoryRepo = AppDataSource.getRepository(TicketCategory);

  // Validate a code before registration
  async validateCode(
    code: string
  ): Promise<{ valid: boolean; reason?: string; accessCode?: AccessCode }> {
    const accessCode = await this.repo.findOne({
      where: { code },
      relations: ["category"],
    });

    if (!accessCode) return { valid: false, reason: "Code not found" };
    if (!accessCode.isSold) return { valid: false, reason: "Code has not been activated. Please purchase a physical form first." };
    if (accessCode.isUsed) return { valid: false, reason: "This code has already been used for registration." };

    return { valid: true, accessCode };
  }

  // Mark code as sold (called when info center sells a form)
  async markAsSold(code: string): Promise<AccessCode> {
    const accessCode = await this.repo.findOneOrFail({ where: { code } });

    if (accessCode.isSold) throw new Error(`Code ${code} has already been marked as sold.`);

    accessCode.isSold = true;
    accessCode.soldAt = new Date();
    return this.repo.save(accessCode);
  }

  // Mark code as used — called after participant registration
  async markAsUsed(code: string): Promise<AccessCode> {
    const accessCode = await this.repo.findOneOrFail({ where: { code } });
    accessCode.isUsed = true;
    accessCode.activatedAt = new Date();
    return this.repo.save(accessCode);
  }

  // Batch generate codes for a category
  async generateBatch(categoryId: string, count: number): Promise<AccessCode[]> {
    const category = await this.categoryRepo.findOneOrFail({ where: { id: categoryId } });

    const codes: AccessCode[] = [];

    for (let i = 0; i < count; i++) {
      let code: string;
      let exists: boolean;

      do {
        code = generateCode(category.slug);
        exists = !!(await this.repo.findOne({ where: { code } }));
      } while (exists);

      codes.push(this.repo.create({ code, categoryId }));
    }

    return this.repo.save(codes);
  }

  // Get all codes with optional filters
  async findAll(filters: {
    categoryId?: string;
    isSold?: boolean;
    isUsed?: boolean;
    page?: number;
    limit?: number;
  }): Promise<[AccessCode[], number]> {
    const { categoryId, isSold, isUsed, page = 1, limit = 50 } = filters;

    const qb = this.repo
      .createQueryBuilder("ac")
      .leftJoinAndSelect("ac.category", "category")
      .leftJoinAndSelect("ac.participant", "participant");

    if (categoryId) qb.andWhere("ac.categoryId = :categoryId", { categoryId });
    if (isSold !== undefined) qb.andWhere("ac.isSold = :isSold", { isSold });
    if (isUsed !== undefined) qb.andWhere("ac.isUsed = :isUsed", { isUsed });

    return qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
  }
}