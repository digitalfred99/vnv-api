import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";

import { TicketCategory } from "@entities/TicketCategory";
import { AccessCode } from "@entities/AccessCode";
import { Participant } from "@entities/Participant";
import { Seat } from "@entities/Seat";
import { SeatAssignment } from "@entities/SeatAssignment";
import { CheckIn } from "@entities/CheckIn";
import { Admin } from "@entities/Admin";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "vnv_db",
  synchronize: false,                // Always false in production — use migrations
  logging: process.env.NODE_ENV === "development",
  entities: [
    TicketCategory,
    AccessCode,
    Participant,
    Seat,
    SeatAssignment,
    CheckIn,
    Admin,
  ],
  migrations: ["src/migrations/*.ts"],
  subscribers: [],
});