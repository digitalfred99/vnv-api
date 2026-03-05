import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { Participant } from "./Participant";
import { Seat } from "./Seat";

// Intentionally decoupled from Participant.
// This allows seat changes, upgrades, and admin reshuffles
// without touching or dirtying the participant record.
@Entity("seat_assignments")
export class SeatAssignment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "participant_id", unique: true })
  participantId: string;

  @Column({ name: "seat_id", unique: true })
  seatId: string;

  @CreateDateColumn({ name: "assigned_at" })
  assignedAt: Date;

  // "system" for auto-assignment, or admin user ID for manual assignment
  @Column({ name: "assigned_by", type: "varchar", nullable: true })
  assignedBy: string | null;

  @Column({ type: "text", nullable: true })
  notes: string | null;

  // ── Relations ─────────────────────────────
  @OneToOne(() => Participant, (p) => p.seatAssignment)
  @JoinColumn({ name: "participant_id" })
  participant: Participant;

  @OneToOne(() => Seat, (s) => s.assignment)
  @JoinColumn({ name: "seat_id" })
  seat: Seat;
}
