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

const hashedPasswordSuper = await bcrypt.hash("super123", 10);
const hashedPasswordIt = await bcrypt.hash("it123", 10);
const hashedPasswordGeneral = await bcrypt.hash("admin123", 10);

const SERVICES = [
  {
    name: "Pelatihan Vokasi & Graduate Academy",
    description:
      "Pelatihan vocational school, fresh graduate, dan thematic academy",
    icon: "🎓",
    color: "#1A3A8F",
    bgColor: "#E8EEF8",
  },
  {
    name: "Pelatihan Digital Entrepreneurship",
    description: "Program pelatihan kewirausahaan digital",
    icon: "💻",
    color: "#0369A1",
    bgColor: "#E0F2FE",
  },
  {
    name: "Pelatihan Government Transformation",
    description: "Program transformasi pemerintahan dan birokrasi digital",
    icon: "🏛️",
    color: "#1E50A2",
    bgColor: "#EFF6FF",
  },
  {
    name: "Layanan Keuangan & Administrasi",
    description: "Pertanyaan terkait keuangan, pembayaran, dan administrasi",
    icon: "💰",
    color: "#15803D",
    bgColor: "#DCFCE7",
  },
  {
    name: "Layanan Kepegawaian",
    description: "Pertanyaan terkait kepegawaian dan SDM",
    icon: "👥",
    color: "#7C3AED",
    bgColor: "#F3E8FF",
  },
  {
    name: "Layanan Kerjasama & Kemitraan",
    description: "Pertanyaan terkait kerjasama dan kemitraan institusi",
    icon: "🤝",
    color: "#C0272D",
    bgColor: "#FEF2F2",
  },
  {
    name: "Layanan Sarana & Prasarana",
    description: "Pertanyaan terkait fasilitas dan sarana prasarana",
    icon: "🏢",
    color: "#92400E",
    bgColor: "#FFFBEB",
  },
  {
    name: "Layanan Program & Perencanaan",
    description: "Pertanyaan terkait program dan perencanaan kegiatan",
    icon: "📋",
    color: "#0F766E",
    bgColor: "#F0FDFA",
  },
  {
    name: "Pertanyaan Umum",
    description: "Pertanyaan umum yang tidak termasuk kategori di atas",
    icon: "❓",
    color: "#475569",
    bgColor: "#F1F5F9",
    requiresManualAssignment: true,
  },
];

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

  const generalAdmin = await prisma.user.upsert({
    where: {
      email: "admin.general@ticketing.local",
    },
    update: {
      password: hashedPasswordGeneral,
      username: "admin.general",
      role: UserRole.GENERAL_ADMIN,
    },
    create: {
      name: "Admin General",
      username: "admin.general",
      email: "admin.general@ticketing.local",
      password: hashedPasswordGeneral,
      role: UserRole.GENERAL_ADMIN,
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

for (const service of SERVICES) {
  await prisma.service.upsert({
    where: { name: service.name },
    update: {
      description: service.description,
      icon: service.icon,
      color: service.color,
      bgColor: service.bgColor,
      requiresManualAssignment: service.requiresManualAssignment ?? false,
    },
    create: {
      ...service,
      requiresManualAssignment: service.requiresManualAssignment ?? false,
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
