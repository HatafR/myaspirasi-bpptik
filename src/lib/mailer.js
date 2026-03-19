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
