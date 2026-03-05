import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { AccessCode } from "./AccessCode";
import { Seat } from "./Seat";

@Entity("ticket_categories")
export class TicketCategory {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  // e.g. "Partners", "Searching", "Social", "Solo Chill"
  @Column({ unique: true, nullable: false })
  name!: string;

  // Short zone prefix: "PT" | "SR" | "SC" | "SL"
  @Column({ unique: true, length: 4, nullable: false })
  slug!: string;

  @Column({ nullable: true, type: "text" })
  description: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: false })
  price!: number;

  // Human-readable zone label shown to attendees
  @Column({ name: "zone_label", nullable: false })
  zoneLabel!: string;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // ── Relations ─────────────────────────────
  @OneToMany(() => AccessCode, (code) => code.category)
  accessCodes: AccessCode[];

  @OneToMany(() => Seat, (seat) => seat.category)
  seats: Seat[];
}
