import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "dummy_key");

export async function sendMail({ from, to, cc, subject, html, text }) {
  try {
    const { data, error } = await resend.emails.send({
      from: from || process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: typeof to === "string" ? [to] : to,
      cc,
      subject,
      html: html || text,
    });

    if (error) {
      console.error("Resend Error:", error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error("Mail Error:", error);
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
      <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/track" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px;">Lacak Tiket Anda</a></p>
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
      <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/track" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px;">Lacak Tiket Anda</a></p>
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
