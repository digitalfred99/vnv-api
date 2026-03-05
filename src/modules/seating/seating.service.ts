import { AppDataSource } from "@config/data-source";
import { Seat } from "@entities/Seat";
import { SeatAssignment } from "@entities/SeatAssignment";
import { FindOptionsWhere } from "typeorm";

const SIDES = ["A", "B"];
const CHAIRS_PER_SIDE = 4;

// SR gender pattern per position
// Side A: M=1,3  F=2,4
// Side B: F=1,3  M=2,4
const SR_GENDER_MAP: Record<string, Record<number, string>> = {
  A: { 1: "MALE", 2: "FEMALE", 3: "MALE", 4: "FEMALE" },
  B: { 1: "FEMALE", 2: "MALE", 3: "FEMALE", 4: "MALE" },
};

// PT adjacent pairs — A1+A2, A3+A4, B1+B2, B3+B4
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

export class SeatingService {
  private seatRepo = AppDataSource.getRepository(Seat);

  // ── Get all seats ─────────────────────────────────────────────
  async findAll(filters: {
    categoryId?: string;
    tableNumber?: number;
    isOccupied?: boolean;
    isReserved?: boolean;
  }): Promise<Seat[]> {
    const where: FindOptionsWhere<Seat> = {};
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.tableNumber) where.tableNumber = filters.tableNumber;
    if (filters.isOccupied !== undefined) where.isOccupied = filters.isOccupied;
    if (filters.isReserved !== undefined) where.isReserved = filters.isReserved;

    return this.seatRepo.find({
      where,
      relations: ["category", "assignment", "assignment.participant"],
      order: { tableNumber: "ASC", side: "ASC", sidePosition: "ASC" },
    });
  }

  // ── Get single seat ───────────────────────────────────────────
  async findById(id: string): Promise<Seat | null> {
    return this.seatRepo.findOne({
      where: { id },
      relations: ["category", "assignment", "assignment.participant"],
    });
  }

  // ── Batch create seats ────────────────────────────────────────
  async createBatch(data: {
    categoryId: string;
    numberOfTables?: number;  // PT, SR, SC
    numberOfSeats?: number;   // SL only
    startFromTable?: number;
    startFromSeat?: number;
  }): Promise<Seat[]> {
    const result = await AppDataSource.query(
      `SELECT slug FROM ticket_categories WHERE id = $1`, [data.categoryId]
    );
    if (!result.length) throw new Error("Category not found");
    const slug: string = result[0].slug;

    if (slug === "SL") {
      return this.createSoloSeats(data.categoryId, slug, data.numberOfSeats ?? 20, data.startFromSeat ?? 1);
    }
    return this.createTableSeats(data.categoryId, slug, data.numberOfTables ?? 1, data.startFromTable ?? 1);
  }

  // PT, SR, SC — table-based
  private async createTableSeats(categoryId: string, slug: string, numberOfTables: number, startFrom: number): Promise<Seat[]> {
    const seats: Seat[] = [];

    for (let t = startFrom; t < startFrom + numberOfTables; t++) {
      const tableLabel = String(t).padStart(2, "0");

      for (const side of SIDES) {
        for (let pos = 1; pos <= CHAIRS_PER_SIDE; pos++) {
          const seatNumber = `${slug}-T${tableLabel}-${side}${pos}`;
          const exists = await this.seatRepo.findOne({ where: { seatNumber } });
          if (!exists) {
            seats.push(this.seatRepo.create({
              seatNumber,
              categoryId,
              tableNumber: t,
              side,
              sidePosition: pos,
            }));
          }
        }
      }
    }

    return this.seatRepo.save(seats);
  }

  // SL — individual numbered chairs, no tables
  private async createSoloSeats(categoryId: string, slug: string, numberOfSeats: number, startFrom: number): Promise<Seat[]> {
    const seats: Seat[] = [];

    for (let i = startFrom; i < startFrom + numberOfSeats; i++) {
      const seatNumber = `${slug}-${String(i).padStart(3, "0")}`;
      const exists = await this.seatRepo.findOne({ where: { seatNumber } });
      if (!exists) {
        seats.push(this.seatRepo.create({
          seatNumber,
          categoryId,
          tableNumber: null,
          side: null,
          sidePosition: null,
        }));
      }
    }

    return this.seatRepo.save(seats);
  }

  // ── Find two adjacent PT seats on same table ──────────────────
  async findAdjacentPTSeats(categoryId: string): Promise<[Seat, Seat] | null> {
    const available = await this.seatRepo.find({
      where: { categoryId, isOccupied: false, isReserved: false },
      order: { tableNumber: "ASC", side: "ASC", sidePosition: "ASC" },
    });

    for (const seat of available) {
      const key = `${seat.side}-${seat.sidePosition}`;
      const pairMeta = PT_PAIRS[key];
      if (!pairMeta) continue;

      const partner = available.find(
        (s) =>
          s.tableNumber === seat.tableNumber &&
          s.side === pairMeta.side &&
          s.sidePosition === pairMeta.sidePosition
      );

      if (partner) return [seat, partner];
    }

    return null;
  }

  // ── Find next available seat for SR / SC / SL ─────────────────
  async findNextAvailableSeat(categoryId: string, slug: string, gender?: string): Promise<Seat | null> {
    if (slug === "SR") {
      const available = await this.seatRepo.find({
        where: { categoryId, isOccupied: false, isReserved: false },
        order: { tableNumber: "ASC", side: "ASC", sidePosition: "ASC" },
      });
      return available.find((s) =>
        SR_GENDER_MAP[s.side!]?.[s.sidePosition!] === gender
      ) ?? null;
    }

    // SC, SL
    return this.seatRepo.findOne({
      where: { categoryId, isOccupied: false, isReserved: false },
      order: { tableNumber: "ASC", side: "ASC", sidePosition: "ASC" },
    });
  }

  // ── Toggle reserve ────────────────────────────────────────────
  async toggleReserve(id: string): Promise<Seat> {
    const seat = await this.seatRepo.findOne({ where: { id } });
    if (!seat) throw new Error("Seat not found");
    if (seat.isOccupied) throw new Error("Cannot reserve an occupied seat");

    seat.isReserved = !seat.isReserved;
    return this.seatRepo.save(seat);
  }

  // ── Reassign seat ─────────────────────────────────────────────
  async reassign(participantId: string, newSeatId: string, adminId: string): Promise<SeatAssignment> {
    return AppDataSource.transaction(async (manager) => {
      const oldAssignment = await manager.findOne(SeatAssignment, { where: { participantId } });

      if (oldAssignment) {
        const oldSeat = await manager.findOne(Seat, { where: { id: oldAssignment.seatId } });
        if (oldSeat) {
          oldSeat.isOccupied = false;
          await manager.save(oldSeat);
        }
        await manager.remove(oldAssignment);
      }

      const newSeat = await manager.findOne(Seat, { where: { id: newSeatId } });
      if (!newSeat) throw new Error("Target seat not found");
      if (newSeat.isOccupied) throw new Error("Target seat is already occupied");
      if (newSeat.isReserved) throw new Error("Target seat is reserved");

      newSeat.isOccupied = true;
      await manager.save(newSeat);

      const assignment = manager.create(SeatAssignment, {
        participantId,
        seatId: newSeatId,
        assignedBy: adminId,
        notes: "Manual reassignment by admin",
      });

      return manager.save(assignment);
    });
  }

  // ── Delete seat ───────────────────────────────────────────────
  async delete(id: string): Promise<void> {
    const seat = await this.seatRepo.findOne({ where: { id } });
    if (!seat) throw new Error("Seat not found");
    if (seat.isOccupied) throw new Error("Cannot delete an occupied seat");
    await this.seatRepo.remove(seat);
  }

  // ── Summary per zone ──────────────────────────────────────────
  async getSummary(): Promise<unknown[]> {
    return AppDataSource.query(`
      SELECT
        tc.id                           AS "categoryId",
        tc.name                         AS "categoryName",
        tc.slug                         AS "slug",
        tc.zone_label                   AS "zoneLabel",
        COUNT(DISTINCT s.table_number)  AS "totalTables",
        COUNT(s.id)                     AS "totalSeats",
        COUNT(s.id) FILTER (WHERE s.is_occupied = false AND s.is_reserved = false) AS "availableSeats",
        COUNT(s.id) FILTER (WHERE s.is_occupied = true)  AS "occupiedSeats",
        COUNT(s.id) FILTER (WHERE s.is_reserved = true)  AS "reservedSeats"
      FROM ticket_categories tc
      LEFT JOIN seats s ON s.category_id = tc.id
      GROUP BY tc.id, tc.name, tc.slug, tc.zone_label
      ORDER BY tc.name
    `);
  }
}