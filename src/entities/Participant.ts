import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import {
  Gender,
  AgeRange,
  RelationshipStatus,
  PersonalityType,
} from "./enums";
import { AccessCode } from "./AccessCode";
import { SeatAssignment } from "./SeatAssignment";
import { CheckIn } from "./CheckIn";

@Entity("participants")
@Index(["phoneNumber"])
@Index(["categoryId"])
export class Participant {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "full_name" })
  fullName: string;

  @Column({ name: "phone_number", unique: true, length: 20 })
  phoneNumber: string;

  @Column({ type: "enum", enum: Gender })
  gender: Gender;

  @Column({ name: "age_range", type: "enum", enum: AgeRange })
  ageRange: AgeRange;

  @Column({ name: "community_area" })
  communityArea: string;

  @Column({
    name: "relationship_status",
    type: "enum",
    enum: RelationshipStatus,
  })
  relationshipStatus: RelationshipStatus;

  @Column({
    name: "personality_type",
    type: "enum",
    enum: PersonalityType,
    nullable: true,
  })
  personalityType: PersonalityType | null;

  // Stored as simple array of interest tags e.g. ["music", "movies"]
  @Column({ type: "text", array: true, default: [] })
  interests: string[];

  // ── Ticket linkage ────────────────────────
  @Column({ name: "access_code_id", unique: true })
  accessCodeId: string;

  // Denormalized for fast zone queries — always mirrors accessCode.categoryId
  @Column({ name: "category_id" })
  categoryId: string;

  // ── Auth (code-based session) ─────────────
  @Column({ name: "session_token", type: "varchar", nullable: true, unique: true })
  sessionToken: string | null;

  @Column({ name: "session_expires_at", type: "timestamp", nullable: true })
  sessionExpiresAt: Date | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // ── Relations ─────────────────────────────
  @OneToOne(() => AccessCode, (ac) => ac.participant)
  @JoinColumn({ name: "access_code_id" })
  accessCode: AccessCode;

  @OneToOne(() => SeatAssignment, (sa) => sa.participant, { nullable: true })
  seatAssignment: SeatAssignment | null;

  @OneToOne(() => CheckIn, (ci) => ci.participant, { nullable: true })
  checkIn: CheckIn | null;
}
