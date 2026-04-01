import { transporter } from "@/lib/mailer.js";

const ADMIN_GENERAL_EMAIL = process.env.ADMIN_GENERAL_EMAIL;

async function send({ to, cc = [], subject, html }) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    cc,
    subject,
    html,
  });
}

// ======================
// HANDLERS
// ======================
export const notificationHandlers = {
  CREATED: async (ticket) => {
    await send({
      to: ADMIN_GENERAL_EMAIL,
      subject: "Tiket baru masuk",
      html: `Tiket baru: ${ticket.ticketNumber}`,
    });
  },

  AUTO_ASSIGNED: async (ticket, picEmail) => {
    await send({
      to: picEmail,
      cc: [ADMIN_GENERAL_EMAIL],
      subject: "Tiket di-assign ke Anda",
      html: `Tiket: ${ticket.ticketNumber}`,
    });
  },

  ASSIGNED_BY_ADMIN: async (ticket, picEmail) => {
    await send({
      to: picEmail,
      subject: "Tiket di-assign oleh admin",
      html: `Tiket: ${ticket.ticketNumber}`,
    });
  },
};
