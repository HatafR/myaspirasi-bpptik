import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendTicketCreatedEmail(email, ticket) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Tiket Anda berhasil dibuat",
    text: `
        Halo, 

        Tiket Anda thelah berhasil dibuat.

        Nomor tiket     : ${ticket.ticketNumber}
        Layanan         : ${ticket.service.name}
        Status awal     : ${ticket.status}

        Simpan nomor tiket ini untuk melakukan pelacakan status tiket.

        Terima kasih.
        `,
  });
}

export async function sendTicketResolvedEmail(email, ticket) {
  const serviceName = ticket.service?.name || "Tidak diketahui";
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Tiket Anda telah diselesaikan",
    text: `
Halo,

Tiket Anda telah berhasil diselesaikan oleh tim kami.

Nomor tiket : ${ticket.ticketNumber}
Layanan     : ${serviceName}
Status      : ${ticket.status}

Silakan berikan rating dan feedback Anda dengan memasukan nomor tiket melalui halaman berikut:
https://myaspirasi-bpptik.vercel.app/track

Terima kasih.
    `,
  });
}

export async function sendErrorEmail(email, ticket, errorMessage) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Ada masalah dengan tiket Anda",
    text: `
Halo,

Ada masalah dengan pengiriman notifikasi untuk tiket Anda.

Nomor tiket: ${ticket.ticketNumber}
Error: ${errorMessage}

Silakan hubungi admin jika diperlukan.

Terima kasih.
    `,
  });
}
