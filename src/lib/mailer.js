import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST || "localhost";
const isLocal = smtpHost === "localhost" || smtpHost === "127.0.0.1";

export const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: Number(process.env.SMTP_PORT) || 1025,
  secure: Number(process.env.SMTP_PORT) === 465, // true untuk port 465
  ignoreTLS: isLocal,
  ...(!isLocal && process.env.EMAIL_USER && process.env.EMAIL_PASS
    ? {
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      }
    : {}),
});

export async function sendMail({ from, to, cc, subject, html, text }) {
  const options = {
    from: from || process.env.EMAIL_USER || "ticketing@bpptik.local",
    to,
    subject,
  };
  
  if (cc && cc.length > 0) options.cc = cc;
  
  if (html) options.html = html;
  if (text) options.text = text;

  try {
    const info = await transporter.sendMail(options);
    return info;
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function sendTicketCreatedEmail(email, ticket) {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2>Halo,</h2>
      <p>Tiket Anda telah berhasil dibuat.</p>
      <table style="width: 100%; max-width: 500px; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Nomor tiket:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${ticket.ticketNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Layanan:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${ticket.service?.name || "Tidak diketahui"}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Status awal:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${ticket.status}</td>
        </tr>
      </table>
      <p>Simpan nomor tiket ini untuk melakukan pelacakan status tiket.</p>
      <p><a href="https://myaspirasi-bpptik.vercel.app/track" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px;">Lacak Tiket Anda</a></p>
      <p>Terima kasih.</p>
    </div>
  `;

  await sendMail({
    to: email,
    subject: "Tiket Anda berhasil dibuat",
    html,
  });
}

export async function sendTicketResolvedEmail(email, ticket) {
  const serviceName = ticket.service?.name || "Tidak diketahui";
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2>Halo,</h2>
      <p>Tiket Anda telah berhasil diselesaikan oleh tim kami.</p>
      <table style="width: 100%; max-width: 500px; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Nomor tiket:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${ticket.ticketNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Layanan:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${serviceName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Status:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${ticket.status}</td>
        </tr>
      </table>
      <p>Silakan berikan rating dan feedback Anda dengan memasukkan nomor tiket melalui halaman berikut:</p>
      <p><a href="https://myaspirasi-bpptik.vercel.app/track" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px;">Lacak Tiket Anda</a></p>
      <p>Terima kasih.</p>
    </div>
  `;

  await sendMail({
    to: email,
    subject: "Tiket Anda telah diselesaikan",
    html,
  });
}

export async function sendErrorEmail(email, ticket, errorMessage) {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2>Halo,</h2>
      <p>Ada masalah dengan pengiriman notifikasi untuk tiket Anda.</p>
      <table style="width: 100%; max-width: 500px; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Nomor tiket:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${ticket.ticketNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #ddd; color: red;"><strong>Error:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #ddd; color: red;">${errorMessage}</td>
        </tr>
      </table>
      <p>Silakan hubungi admin jika diperlukan.</p>
      <p>Terima kasih.</p>
    </div>
  `;

  await sendMail({
    to: email,
    subject: "Ada masalah dengan tiket Anda",
    html,
  });
}
