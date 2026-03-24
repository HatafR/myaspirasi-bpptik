import { PrismaClient } from "../app/generated/prisma/index.js";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding admin users...");

  const admins = [
    {
      username: "admin.general",
      email:    "admin@bptkomdigi.go.id",
      password: "admin123",
      name:     "Administrator General",
      role:     "admin_general",
      division: null,
    },
    {
      username: "admin.it",
      email:    "it@bptkomdigi.go.id",
      password: "it123",
      name:     "Admin Layanan IT",
      role:     "admin_layanan",
      division: "it",
    },
    {
      username: "admin.humas",
      email:    "humas@bptkomdigi.go.id",
      password: "humas123",
      name:     "Admin Layanan Humas",
      role:     "admin_layanan",
      division: "humas",
    },
    {
      username: "admin.finance",
      email:    "finance@bptkomdigi.go.id",
      password: "finance123",
      name:     "Admin Layanan Finance",
      role:     "admin_layanan",
      division: "finance",
    },
    {
      username: "admin.audit",
      email:    "audit@bptkomdigi.go.id",
      password: "audit123",
      name:     "Admin Layanan Audit",
      role:     "admin_layanan",
      division: "audit",
    },
  ];

  for (const admin of admins) {
    const hashed = await bcrypt.hash(admin.password, 10);
    await prisma.admin.upsert({
      where: { username: admin.username },
      update: {},
      create: {
        username: admin.username,
        email:    admin.email,
        password: hashed,
        name:     admin.name,
        role:     admin.role,
        division: admin.division,
      },
    });
    console.log(`✅ Admin ${admin.username} seeded`);
  }

  console.log("Seeding selesai!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });