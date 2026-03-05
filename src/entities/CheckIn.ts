import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { CheckInMethod } from "./enums";
import { Participant } from "./Participant";

@Entity("check_ins")
export class CheckIn {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "participant_id", unique: true })
  participantId: string;

  @CreateDateColumn({ name: "checked_in_at" })
  checkedInAt: Date;

  // Staff member name or ID who validated entry
  @Column({ name: "verified_by", type: "varchar", nullable: true })
  verifiedBy: string | null;

  @Column({
    type: "enum",
    enum: CheckInMethod,
    default: CheckInMethod.CODE_SCAN,
  })
  method: CheckInMethod;

  @Column({ nullable: true, type: "text" })
  notes: string | null;

  // ── Relations ─────────────────────────────
  @OneToOne(() => Participant, (p) => p.checkIn)
  @JoinColumn({ name: "participant_id" })
  participant: Participant;
}
