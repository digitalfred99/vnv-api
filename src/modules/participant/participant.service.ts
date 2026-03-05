import { AppDataSource } from "@config/data-source";
import { Participant } from "@entities/Participant";
import { AccessCode } from "@entities/AccessCode";
import { Seat } from "@entities/Seat";
import { SeatAssignment } from "@entities/SeatAssignment";
import { Gender, AgeRange, RelationshipStatus, PersonalityType } from "@entities/enums";
import { signParticipantToken } from "@utils/jwt";

const SR_GENDER_MAP: Record<string, Record<number, string>> = {
  A: { 1: "MALE", 2: "FEMALE", 3: "MALE", 4: "FEMALE" },
  B: { 1: "FEMALE", 2: "MALE", 3: "FEMALE", 4: "MALE" },
};

const PT_PAIRS: Record<string, { side: string; sidePosition: number }> = {
  "A-1": { side: "A", sidePosition: 2 },
  "A-2": { side: "A", sidePosition: 1 },
  "A-3": { side: "A", sidePosition: 4 },
  "A-4": { side: "A", sidePosition: 3 },
  "B-1": { side: "B", sidePosition: 2 },
  "B-2": { side: "B", sidePosition: 1 },
  "B-3": { side: "B", sidePosition: 4 },
  "B-4": { side: "B", sidePosition: 3 },
};

export interface RegisterDto {
  code: string;
  fullName: string;
  phoneNumber: string;
  gender: Gender;
  ageRange: AgeRange;
  communityArea: string;
  relationshipStatus: RelationshipStatus;
  personalityType?: PersonalityType;
  interests?: string[];
}

export interface RegisterPartnersDto {
  person1: RegisterDto;
  person2: RegisterDto;
}

export class ParticipantService {
  private repo = AppDataSource.getRepository(Participant);
  private codeRepo = AppDataSource.getRepository(AccessCode);

  // ── Helper: create one participant inside a transaction ───────
  private async createParticipant(
    manager: any,
    dto: RegisterDto,
    seat: Seat
  ): Promise<{ participant: Participant; token: string }> {
    // ✅ Use QueryBuilder to lock ONLY the access_codes table — no joins
    const code = await manager
      .createQueryBuilder(AccessCode, "ac")
      .where("ac.code = :code", { code: dto.code })
      .setLock("pessimistic_write")
      .setOnLocked("nowait")          // optional: fail fast instead of waiting
      .getOneOrFail();

    if (!code.isSold) throw new Error(`Code ${dto.code} has not been sold.`);
    if (code.isUsed) throw new Error(`Code ${dto.code} has already been used.`);

    const existing = await manager.findOne(Participant, {
      where: { phoneNumber: dto.phoneNumber },
    });
    if (existing) throw new Error(`Phone number ${dto.phoneNumber} is already registered.`);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const participant = manager.create(Participant, {
      fullName: dto.fullName,
      phoneNumber: dto.phoneNumber,
      gender: dto.gender,
      ageRange: dto.ageRange,
      communityArea: dto.communityArea,
      relationshipStatus: dto.relationshipStatus,
      personalityType: dto.personalityType ?? null,
      interests: dto.interests ?? [],
      accessCodeId: code.id,
      categoryId: code.categoryId,   // ✅ plain FK column — no join needed
      sessionExpiresAt: expiresAt,
    });

    const saved = await manager.save(participant);

    await manager.save(manager.create(SeatAssignment, {
      participantId: saved.id,
      seatId: seat.id,
      assignedBy: "system",
    }));

    seat.isOccupied = true;
    await manager.save(seat);

    code.isUsed = true;
    code.activatedAt = new Date();
    await manager.save(code);

    const token = signParticipantToken({
      participantId: saved.id,
      accessCode: code.code,
      categoryId: code.categoryId,
    });

    saved.sessionToken = token;
    await manager.save(saved);

    return { participant: saved, token };
  }

  // ── Register SR / SC / SL ─────────────────────────────────────
  async register(dto: RegisterDto): Promise<{ participant: Participant; token: string }> {
    return AppDataSource.transaction(async (manager) => {
      const code = await manager.findOneOrFail(AccessCode, {
        where: { code: dto.code },
        relations: ["category"],
      });

      if (code.category.slug === "PT") {
        throw new Error("Partners must register using the partners registration endpoint.");
      }

      let seat: Seat | null = null;
      const slug = code.category.slug;

      if (slug === "SR") {
        const available = await manager.find(Seat, {
          where: { categoryId: code.categoryId, isOccupied: false, isReserved: false },
          order: { tableNumber: "ASC", side: "ASC", sidePosition: "ASC" },
        });
        seat = available.find((s: Seat) =>
          SR_GENDER_MAP[s.side!]?.[s.sidePosition!] === dto.gender
        ) ?? null;
      } else {
        seat = await manager.findOne(Seat, {
          where: { categoryId: code.categoryId, isOccupied: false, isReserved: false },
          order: { tableNumber: "ASC", side: "ASC", sidePosition: "ASC" },
        });
      }

      if (!seat) throw new Error("No seats available in this zone. Please contact an organizer.");

      return this.createParticipant(manager, dto, seat);
    });
  }

  // ── Register Partners (PT) — two people, one transaction ──────
  async registerPartners(dto: RegisterPartnersDto): Promise<{
    person1: { participant: Participant; token: string };
    person2: { participant: Participant; token: string };
  }> {
    return AppDataSource.transaction(async (manager) => {
      const code1 = await manager.findOneOrFail(AccessCode, {
        where: { code: dto.person1.code },
        relations: ["category"],
      });
      const code2 = await manager.findOneOrFail(AccessCode, {
        where: { code: dto.person2.code },
        relations: ["category"],
      });

      if (code1.category.slug !== "PT") throw new Error("Code 1 is not a Partners (PT) code.");
      if (code2.category.slug !== "PT") throw new Error("Code 2 is not a Partners (PT) code.");
      if (code1.categoryId !== code2.categoryId) throw new Error("Both codes must belong to the same category.");

      // Find two adjacent available seats on the same table
      const available = await manager.find(Seat, {
        where: { categoryId: code1.categoryId, isOccupied: false, isReserved: false },
        order: { tableNumber: "ASC", side: "ASC", sidePosition: "ASC" },
      });

      let seat1: Seat | null = null;
      let seat2: Seat | null = null;

      for (const seat of available) {
        const key = `${seat.side}-${seat.sidePosition}`;
        const pairMeta = PT_PAIRS[key];
        if (!pairMeta) continue;

        const partner = available.find(
          (s: Seat) =>
            s.tableNumber === seat.tableNumber &&
            s.side === pairMeta.side &&
            s.sidePosition === pairMeta.sidePosition
        );

        if (partner) {
          seat1 = seat;
          seat2 = partner;
          break;
        }
      }

      if (!seat1 || !seat2) {
        throw new Error("No adjacent seats available for partners. Please contact an organizer.");
      }

      const result1 = await this.createParticipant(manager, dto.person1, seat1);
      const result2 = await this.createParticipant(manager, dto.person2, seat2);

      return { person1: result1, person2: result2 };
    });
  }

  // ── Code-based login ──────────────────────────────────────────
  async login(code: string): Promise<{ participant: Participant; token: string }> {
    const accessCode = await this.codeRepo.findOne({ where: { code } });

    if (!accessCode?.isUsed) {
      throw new Error("Invalid code or registration not yet completed.");
    }

    const participant = await this.repo.findOneOrFail({
      where: { accessCodeId: accessCode.id },
      relations: ["seatAssignment", "seatAssignment.seat", "checkIn", "accessCode"],
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const token = signParticipantToken({
      participantId: participant.id,
      accessCode: accessCode.code,
      categoryId: participant.categoryId,
    });

    participant.sessionToken = token;
    participant.sessionExpiresAt = expiresAt;
    await this.repo.save(participant);

    return { participant, token };
  }

  // ── Get profile ───────────────────────────────────────────────
  async getProfile(participantId: string): Promise<Participant> {
    return this.repo.findOneOrFail({
      where: { id: participantId },
      relations: [
        "accessCode",
        "accessCode.category",
        "seatAssignment",
        "seatAssignment.seat",
        "checkIn",
      ],
    });
  }

  // ── Admin: list all ───────────────────────────────────────────
  async findAll(page = 1, limit = 50, categoryId?: string): Promise<[Participant[], number]> {
    const qb = this.repo
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.accessCode", "ac")
      .leftJoinAndSelect("ac.category", "cat")
      .leftJoinAndSelect("p.seatAssignment", "sa")
      .leftJoinAndSelect("sa.seat", "seat")
      .leftJoinAndSelect("p.checkIn", "ci");

    if (categoryId) qb.andWhere("p.categoryId = :categoryId", { categoryId });

    return qb
      .orderBy("p.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
  }
}