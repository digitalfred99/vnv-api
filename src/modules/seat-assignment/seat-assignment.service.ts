import { AppDataSource } from "@config/data-source";
import { SeatAssignment } from "@entities/SeatAssignment";

export class SeatAssignmentService {
  private repo = AppDataSource.getRepository(SeatAssignment);

  // ── Get all assignments ───────────────────────────────────────
  async findAll(categoryId?: string): Promise<SeatAssignment[]> {
    const qb = this.repo
      .createQueryBuilder("sa")
      .leftJoinAndSelect("sa.participant", "participant")
      .leftJoinAndSelect("sa.seat", "seat")
      .leftJoinAndSelect("seat.category", "category")
      .orderBy("seat.tableNumber", "ASC")
      .addOrderBy("seat.side", "ASC")
      .addOrderBy("seat.sidePosition", "ASC");

    if (categoryId) {
      qb.where("seat.categoryId = :categoryId", { categoryId });
    }

    return qb.getMany();
  }

  // ── Get single assignment by participant ──────────────────────
  async findByParticipant(participantId: string): Promise<SeatAssignment | null> {
    return this.repo.findOne({
      where: { participantId },
      relations: ["participant", "seat", "seat.category"],
    });
  }

  // ── Get single assignment by seat ─────────────────────────────
  async findBySeat(seatId: string): Promise<SeatAssignment | null> {
    return this.repo.findOne({
      where: { seatId },
      relations: ["participant", "seat", "seat.category"],
    });
  }
}