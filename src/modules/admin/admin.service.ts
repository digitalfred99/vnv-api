import bcrypt from "bcryptjs";
import { AppDataSource } from "@config/data-source";
import { Admin } from "@entities/Admin";
import { AdminRole } from "@entities/enums";
import { signAdminToken } from "@utils/jwt";

export class AdminService {
  private repo = AppDataSource.getRepository(Admin);

  // ── Login ─────────────────────────────────────────────────────
  async login(email: string, password: string): Promise<{ admin: Admin; token: string }> {
    const admin = await this.repo.findOne({ where: { email, isActive: true } });
    if (!admin) throw new Error("Invalid credentials");

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) throw new Error("Invalid credentials");

    admin.lastLoginAt = new Date();
    await this.repo.save(admin);

    const token = signAdminToken({ adminId: admin.id, role: admin.role });
    return { admin, token };
  }

  // ── Create admin ──────────────────────────────────────────────
  async create(data: {
    name: string;
    email: string;
    password: string;
    role: AdminRole;
  }): Promise<Admin> {
    const exists = await this.repo.findOne({ where: { email: data.email } });
    if (exists) throw new Error("Email already registered");

    const passwordHash = await bcrypt.hash(data.password, 12);
    const admin = this.repo.create({
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
    });
    return this.repo.save(admin);
  }

  // ── Get all admins ────────────────────────────────────────────
  async findAll(): Promise<Admin[]> {
    return this.repo.find({ order: { createdAt: "DESC" } });
  }

  // ── Get single admin ──────────────────────────────────────────
  async findById(id: string): Promise<Admin | null> {
    return this.repo.findOne({ where: { id } });
  }

  // ── Update admin ──────────────────────────────────────────────
  async update(id: string, data: { name?: string; role?: AdminRole }): Promise<Admin> {
    const admin = await this.repo.findOne({ where: { id } });
    if (!admin) throw new Error("Admin not found");

    Object.assign(admin, data);
    return this.repo.save(admin);
  }

  // ── Toggle active status ──────────────────────────────────────
  async toggleActive(id: string): Promise<Admin> {
    const admin = await this.repo.findOne({ where: { id } });
    if (!admin) throw new Error("Admin not found");

    admin.isActive = !admin.isActive;
    return this.repo.save(admin);
  }

  // ── Change password ───────────────────────────────────────────
  async changePassword(id: string, oldPassword: string, newPassword: string): Promise<void> {
    const admin = await this.repo.findOne({ where: { id } });
    if (!admin) throw new Error("Admin not found");

    const valid = await bcrypt.compare(oldPassword, admin.passwordHash);
    if (!valid) throw new Error("Current password is incorrect");

    admin.passwordHash = await bcrypt.hash(newPassword, 12);
    await this.repo.save(admin);
  }

  // ── Delete admin ──────────────────────────────────────────────
  async delete(id: string): Promise<void> {
    const admin = await this.repo.findOne({ where: { id } });
    if (!admin) throw new Error("Admin not found");
    await this.repo.remove(admin);
  }
}