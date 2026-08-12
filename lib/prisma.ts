import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) throw new Error("DATABASE_URL 환경변수가 필요합니다.");

const globalForPrisma = globalThis as typeof globalThis & { prisma?: PrismaClient };
const adapter = new PrismaPg({ connectionString: databaseUrl });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
