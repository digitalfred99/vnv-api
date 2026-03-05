import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { TicketCategory } from "./TicketCategory";
import { SeatAssignment } from "./SeatAssignment";

@Entity("seats")
@Index(["categoryId", "isOccupied"])
@Index(["categoryId", "tableNumber"])
export class Seat {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  // Table seat:  SR-T01-A1
  // Solo seat:   SL-001
  @Column({ name: "seat_number", unique: true, length: 15 })
  seatNumber: string;

  @Column({ name: "category_id" })
  categoryId: string;

  // null for Solo seats
  @Column({ name: "table_number", type: "int", nullable: true })
  tableNumber: number | null;

  // null for Solo seats
  @Column({ length: 1, type: "varchar", nullable: true })
  side: string | null;

  // null for Solo seats
  @Column({ name: "side_position", type: "int", nullable: true })
  sidePosition: number | null;

  @Column({ name: "is_occupied", default: false })
  isOccupied: boolean;

  @Column({ name: "is_reserved", default: false })
  isReserved: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // ── Relations ─────────────────────────────
  @ManyToOne(() => TicketCategory, (cat) => cat.seats)
  @JoinColumn({ name: "category_id" })
  category: TicketCategory;

  @OneToOne(() => SeatAssignment, (sa) => sa.seat, { nullable: true })
  assignment: SeatAssignment | null;
}