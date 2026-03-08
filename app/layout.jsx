import "./globals.css";

export const metadata = {
  title: "MyAspirasi — BPPTIK Komdigi",
  description: "Platform aspirasi digital Balai Pelatihan dan Pengembangan Teknologi Informasi dan Komunikasi",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}