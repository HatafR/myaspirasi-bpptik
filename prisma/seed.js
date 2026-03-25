import "dotenv/config";
import pkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";
import { UserRole } from "@prisma/client";

const { PrismaClient } = pkg;

const connectionString = process.env.DATABASE_URL;

const adapter = new PrismaPg({ connectionString });

const prisma = new PrismaClient({
  adapter,
});

const hashedPasswordSuper = await bcrypt.hash("super-admin-123", 10);
const hashedPasswordIt = await bcrypt.hash("it-admin-123", 10);

async function main() {
  const admin = await prisma.user.upsert({
    where: {
      email: "admin@ticketing.local",
    },
    update: {
      password: hashedPasswordSuper,
      username: "admin.super",
      role: UserRole.SUPER_ADMIN,
    },
    create: {
      name: "Super Admin",
      email: "admin@ticketing.local",
      username: "admin.super",
      password: hashedPasswordSuper,
      role: UserRole.SUPER_ADMIN,
    },
  });

  const serviceAdmin = await prisma.user.upsert({
    where: {
      email: "it@ticketing.local",
    },
    update: {
      password: hashedPasswordIt,
      username: "admin.it",
      role: UserRole.SERVICE_ADMIN,
    },
    create: {
      name: "Admin IT",
      username: "admin.it",
      email: "it@ticketing.local",
      password: hashedPasswordIt,
      role: UserRole.SERVICE_ADMIN,
    },
  });

  await prisma.service.upsert({
    where: { name: "Informasi Digital" },
    update: {
      assignedAdminId: serviceAdmin.id,
      requiresManualAssignment: false,
    },
    create: {
      name: "Informasi Digital",
      requiresManualAssignment: false,
      assignedAdminId: serviceAdmin.id,
    },
  });

  await prisma.service.upsert({
    where: { name: "Pengaduan Infrastruktur" },
    update: {},
    create: {
      name: "Pengaduan Infrastruktur",
      requiresManualAssignment: false,
      assignedAdminId: admin.id,
    },
  });

  await prisma.service.upsert({
    where: { name: "Lainnya" },
    update: {},
    create: {
      name: "Lainnya",
      requiresManualAssignment: true,
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
