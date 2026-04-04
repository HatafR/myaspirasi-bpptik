import "dotenv/config";
import { PrismaClient, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const hashedPasswordSuper = await bcrypt.hash("super123", 10);
const hashedPasswordIt = await bcrypt.hash("it123", 10);
const hashedPasswordGeneral = await bcrypt.hash("admin123", 10);
const hashedPasswordKepegawaian = await bcrypt.hash("kepegawaian123", 10);
const hashedPasswordKemitraan = await bcrypt.hash("kemitraan123", 10);
const hashedPasswordKeuangan = await bcrypt.hash("keuangan123", 10);
const hashedPasswordPerencanaan = await bcrypt.hash("perencanaan123", 10);
const hashedPasswordPrasarana = await bcrypt.hash("prasarana123", 10);
const hashedPasswordEnterpreneur = await bcrypt.hash("enterpreneur123", 10);
const hashedPasswordGoverment = await bcrypt.hash("goverment123", 10);
const hashedPasswordVokasi = await bcrypt.hash("vokasi123", 10);
const hashedPasswordInfrastruktur = await bcrypt.hash("infrastruktur123", 10);

const SERVICES = [
  {
    name: "Pelatihan Vokasi & Graduate Academy",
    description:
      "Pelatihan vocational school, fresh graduate, dan thematic academy",
    icon: "🎓",
    color: "#1A3A8F",
    bgColor: "#E8EEF8",
    adminUsername: "admin.vokasi",
  },
  {
    name: "Pelatihan Digital Entrepreneurship",
    description: "Program pelatihan kewirausahaan digital",
    icon: "💻",
    color: "#0369A1",
    bgColor: "#E0F2FE",
    adminUsername: "admin.enterpreneur",
  },
  {
    name: "Pelatihan Government Transformation",
    description: "Program transformasi pemerintahan dan birokrasi digital",
    icon: "🏛️",
    color: "#1E50A2",
    bgColor: "#EFF6FF",
    adminUsername: "admin.goverment",
  },
  {
    name: "Layanan Keuangan & Administrasi",
    description: "Pertanyaan terkait keuangan, pembayaran, dan administrasi",
    icon: "💰",
    color: "#15803D",
    bgColor: "#DCFCE7",
    adminUsername: "admin.keuangan",
  },
  {
    name: "Layanan Kepegawaian",
    description: "Pertanyaan terkait kepegawaian dan SDM",
    icon: "👥",
    color: "#7C3AED",
    bgColor: "#F3E8FF",
    adminUsername: "admin.kepegawaian",
  },
  {
    name: "Layanan Kerjasama & Kemitraan",
    description: "Pertanyaan terkait kerjasama dan kemitraan institusi",
    icon: "🤝",
    color: "#C0272D",
    bgColor: "#FEF2F2",
    adminUsername: "admin.kemitraan",
  },
  {
    name: "Layanan Sarana & Prasarana",
    description: "Pertanyaan terkait fasilitas dan sarana prasarana",
    icon: "🏢",
    color: "#92400E",
    bgColor: "#FFFBEB",
    adminUsername: "admin.prasarana",
  },
  {
    name: "Layanan Program & Perencanaan",
    description: "Pertanyaan terkait program dan perencanaan kegiatan",
    icon: "📋",
    color: "#0F766E",
    bgColor: "#F0FDFA",
    adminUsername: "admin.perencanaan",
  },
  {
    name: "Lainnya",
    description: "Pertanyaan lainnya yang tidak termasuk kategori di atas",
    icon: "❓",
    color: "#475569",
    bgColor: "#F1F5F9",
    requiresManualAssignment: true,
    adminUsername: null,
  },
];

const adminCredentials = [
  {
    name: "Super Admin",
    email: "admin@ticketing.local",
    username: "admin.super",
    hashedPassword: hashedPasswordSuper,
    role: UserRole.SUPER_ADMIN,
  },
  {
    name: "Admin General",
    email: "admin.general@ticketing.local",
    username: "admin.general",
    hashedPassword: hashedPasswordGeneral,
    role: UserRole.GENERAL_ADMIN,
  },
  {
    name: "Admin Layanan Kepegawaian",
    email: "admin.kepegawaian@ticketing.local",
    username: "admin.kepegawaian",
    hashedPassword: hashedPasswordKepegawaian,
    role: UserRole.SERVICE_ADMIN,
  },
  {
    name: "Admin Layanan Kerjasama & Kemitraan",
    email: "admin.kemitraan@ticketing.local",
    username: "admin.kemitraan",
    hashedPassword: hashedPasswordKemitraan,
    role: UserRole.SERVICE_ADMIN,
  },
  {
    name: "Admin Layanan Keuangan & Administrasi",
    email: "admin.keuangan@ticketing.local",
    username: "admin.keuangan",
    hashedPassword: hashedPasswordKeuangan,
    role: UserRole.SERVICE_ADMIN,
  },
  {
    name: "Admin Layanan Program & Perencanaan",
    email: "admin.perencanaan@ticketing.local",
    username: "admin.perencanaan",
    hashedPassword: hashedPasswordPerencanaan,
    role: UserRole.SERVICE_ADMIN,
  },
  {
    name: "Admin Layanan Sarana & Prasarana",
    email: "admin.prasarana@ticketing.local",
    username: "admin.prasarana",
    hashedPassword: hashedPasswordPrasarana,
    role: UserRole.SERVICE_ADMIN,
  },
  {
    name: "Admin Layanan Digital Enterpreneurship",
    email: "admin.enterpreneur@ticketing.local",
    username: "admin.enterpreneur",
    hashedPassword: hashedPasswordEnterpreneur,
    role: UserRole.SERVICE_ADMIN,
  },
  {
    name: "Admin Layanan Goverment Transformation",
    email: "admin.goverment@ticketing.local",
    username: "admin.goverment",
    hashedPassword: hashedPasswordGoverment,
    role: UserRole.SERVICE_ADMIN,
  },
  {
    name: "Admin Layanan Vokasi & Graduate Academy",
    email: "admin.vokasi@ticketing.local",
    username: "admin.vokasi",
    hashedPassword: hashedPasswordVokasi,
    role: UserRole.SERVICE_ADMIN,
  },
  {
    name: "Admin Layanan Pengadaan Infrastruktur",
    email: "admin.infrastruktur@ticketing.local",
    username: "admin.infrastruktur",
    hashedPassword: hashedPasswordInfrastruktur,
    role: UserRole.SERVICE_ADMIN,
  },
];

async function main() {
  // Create all admins and store them in a map
  const adminMap = {};

  for (const adminConfig of adminCredentials) {
    const admin = await prisma.user.upsert({
      where: { email: adminConfig.email },
      update: {
        password: adminConfig.hashedPassword,
        username: adminConfig.username,
        role: adminConfig.role,
      },
      create: {
        name: adminConfig.name,
        email: adminConfig.email,
        username: adminConfig.username,
        password: adminConfig.hashedPassword,
        role: adminConfig.role,
      },
    });
    adminMap[adminConfig.username] = admin;
  }

  const superAdmin = adminMap["admin.super"];

  // Create services from SERVICES array with assigned admins
  for (const service of SERVICES) {
    const assignedAdmin = service.adminUsername
      ? adminMap[service.adminUsername]
      : null;

    await prisma.service.upsert({
      where: { name: service.name },
      update: {
        description: service.description,
        icon: service.icon,
        color: service.color,
        bgColor: service.bgColor,
        requiresManualAssignment: service.requiresManualAssignment ?? false,
        ...(assignedAdmin && { assignedAdminId: assignedAdmin.id }),
      },
      create: {
        name: service.name,
        description: service.description,
        icon: service.icon,
        color: service.color,
        bgColor: service.bgColor,
        requiresManualAssignment: service.requiresManualAssignment ?? false,
        ...(assignedAdmin && { assignedAdminId: assignedAdmin.id }),
      },
    });
  }

  await prisma.user.upsert({
    where: { id: "system" },
    update: {},
    create: {
      id: "system",
      name: "System",
      role: UserRole.SYSTEM,
      isActive: true,
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
