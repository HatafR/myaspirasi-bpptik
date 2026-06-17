import { Resend } from "resend";
import formData from 'form-data';
import Mailgun from "mailgun.js";

export async function sendMail({ to, cc, subject, html, htmlContent }) {
  const API_KEY = process.env.MAILGUN_API_KEY;
  const DOMAIN = 'mail.pkesitt.my.id'; // Diambil dari screenshot Python Anda

  if (!API_KEY) {
    console.error("MAILGUN_API_KEY tidak ditemukan di .env!");
    return { success: false, error: "Missing API Key" };
  }

  // 2. Siapkan URL Endpoint (Sesuai baris ke-5 di kode Python)
  const url = process.env.MAILGUN_DOMAIN;

  const basicAuth = Buffer.from(`api:${API_KEY}`).toString('base64');

  const formData = new FormData();
  formData.append('from', `Sistem Ticketing <postmaster@${DOMAIN}>`);
  formData.append('to', to);
  if (cc) {
    if (Array.isArray(cc)) {
      if (cc.length > 0) formData.append('cc', cc.join(','));
    } else {
      formData.append('cc', cc);
    }
  }
  formData.append('subject', subject);
  formData.append('html', html || htmlContent);
  try {
    // 5. Eksekusi HTTP POST Request (Sama dengan requests.post di Python)
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        // Catatan: Jangan menuliskan 'Content-Type': 'multipart/form-data' secara manual.
        // Fetch akan secara otomatis menambahkannya beserta boundary form.
      },
      body: formData,
    });

    const result = await response.json();

    // Cek apakah status HTTP bukan 200 OK
    if (!response.ok) {
      console.error("Mailgun API Error:", result);
      throw new Error(result.message || "Gagal dari server Mailgun");
    }

    console.log(`✅ Email berhasil terkirim ke ${to}. ID:`, result.id);
    return { success: true, result };

  } catch (error) {
    console.error("❌ Gagal eksekusi Fetch:", error.message);
    return { success: false, error: error.message };
  }
}

// export async function sendMail({ from, to, cc, subject, html, text }) {
//   try {
//     const { data, error } = await resend.emails.send({
//       from: from || process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
//       to: typeof to === "string" ? [to] : to,
//       cc,
//       subject,
//       html: html || text,
//     });

//     if (error) {
//       console.error("Resend Error:", error);
//       throw new Error(error.message);
//     }

//     return data;
//   } catch (error) {
//     console.error("Mail Error:", error);
//     throw new Error(error.message);
//   }
// }

export async function sendTicketCreatedEmail(email, ticket) {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2>Halo,</h2>
      <p>Tiket Anda telah berhasil dibuat.</p>
      <table style="width: 100%; max-width: 500px; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Nomor tiket:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #ddd; font-family: monospace;">${ticket.ticketNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Token pelacakan:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #ddd; font-family: monospace; color: #c0272d;">${ticket.trackingToken || "-"}</td>
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
      <p>Simpan <strong>nomor tiket</strong> dan <strong>token pelacakan</strong> untuk melacak status tiket. Keduanya diperlukan.</p>
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
