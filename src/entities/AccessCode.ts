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
import { Participant } from "./Participant";

@Entity("access_codes")
@Index(["code"])
@Index(["categoryId"])
export class AccessCode {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  // e.g. VNV2026SR4829571036
  @Column({ unique: true, length: 25 })
  code: string;

  @Column({ name: "category_id" })
  categoryId: string;

  // true = physical form has been sold at the info center
  @Column({ name: "is_sold", default: false })
  isSold: boolean;

  // true = participant has completed online registration
  @Column({ name: "is_used", default: false })
  isUsed: boolean;

  @Column({ name: "sold_at", type: "timestamp", nullable: true })
  soldAt: Date | null;

  // Timestamp of first registration attempt
  @Column({ name: "activated_at", type: "timestamp", nullable: true })
  activatedAt: Date | null;

  @Column({ type: "text", nullable: true })
  notes: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // ── Relations ─────────────────────────────
  @ManyToOne(() => TicketCategory, (cat) => cat.accessCodes, { eager: true })
  @JoinColumn({ name: "category_id" })
  category: TicketCategory;

  @OneToOne(() => Participant, (p) => p.accessCode, { nullable: true })
  participant: Participant | null;
}