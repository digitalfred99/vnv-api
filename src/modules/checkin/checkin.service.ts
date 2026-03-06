import { AppDataSource } from "@config/data-source";
import { CheckIn } from "@entities/CheckIn";
import { AccessCode } from "@entities/AccessCode";
import { Participant } from "@entities/Participant";
import { CheckInMethod } from "@entities/enums";

export class CheckInService {
  private repo = AppDataSource.getRepository(CheckIn);

  // ── Check in by access code ───────────────────────────────────
  async checkIn(data: {
    code: string;
    adminId: string;
    method?: CheckInMethod;
    notes?: string;
  }): Promise<{ checkIn: CheckIn; alreadyCheckedIn: boolean }> {

    // 1. Find access code
    const accessCode = await AppDataSource.getRepository(AccessCode).findOne({
      where: { code: data.code },
    });

    if (!accessCode) throw new Error("Code not found.");
    if (!accessCode.isSold) throw new Error("This code has not been activated.");
    if (!accessCode.isUsed) throw new Error("This person has not completed registration yet.");

    // 2. Find participant
    const participant = await AppDataSource.getRepository(Participant).findOne({
      where: { accessCodeId: accessCode.id },
      relations: ["seatAssignment", "seatAssignment.seat"],
    });

    if (!participant) throw new Error("Participant not found.");

    // 3. Idempotency — already checked in, return existing record
    const existing = await this.repo.findOne({
      where: { participantId: participant.id },
      relations: ["participant", "participant.seatAssignment", "participant.seatAssignment.seat"],
    });

    if (existing) {
      return { checkIn: existing, alreadyCheckedIn: true };
    }

    // 4. Create immutable check-in record
    const checkIn = this.repo.create({
      participantId: participant.id,
      verifiedBy: data.adminId,
      method: data.method ?? CheckInMethod.CODE_SCAN,
      notes: data.notes ?? null,
    });

    const saved = await this.repo.save(checkIn);

    // Reload with relations
    const full = await this.repo.findOneOrFail({
      where: { id: saved.id },
      relations: ["participant", "participant.seatAssignment", "participant.seatAssignment.seat"],
    });

    return { checkIn: full, alreadyCheckedIn: false };
  }

  // ── Get all check-ins ─────────────────────────────────────────
  async findAll(categoryId?: string): Promise<CheckIn[]> {
    const qb = this.repo
      .createQueryBuilder("ci")
      .leftJoinAndSelect("ci.participant", "participant")
      .leftJoinAndSelect("participant.seatAssignment", "sa")
      .leftJoinAndSelect("sa.seat", "seat")
      .leftJoinAndSelect("seat.category", "category")
      .orderBy("ci.checkedInAt", "DESC");

    if (categoryId) {
      qb.where("seat.categoryId = :categoryId", { categoryId });
    }

    return qb.getMany();
  }

  // ── Stats: checked in vs registered per zone ──────────────────
  async getStats(): Promise<unknown[]> {
    return AppDataSource.query(`
      SELECT
        tc.id                 AS "categoryId",
        tc.name               AS "categoryName",
        tc.slug               AS "slug",
        tc.zone_label         AS "zoneLabel",
        COUNT(DISTINCT p.id)  AS "totalRegistered",
        COUNT(DISTINCT ci.id) AS "totalCheckedIn",
        COUNT(DISTINCT p.id) - COUNT(DISTINCT ci.id) AS "notYetArrived"
      FROM ticket_categories tc
      LEFT JOIN participants p  ON p.category_id::text = tc.id::text
      LEFT JOIN check_ins ci    ON ci.participant_id::text = p.id::text
      GROUP BY tc.id, tc.name, tc.slug, tc.zone_label
      ORDER BY tc.name
    `);
  }

  // ── Get single check-in by participant ────────────────────────
  async findByParticipant(participantId: string): Promise<CheckIn | null> {
    return this.repo.findOne({
      where: { participantId },
      relations: ["participant", "participant.seatAssignment", "participant.seatAssignment.seat"],
    });
  }
}