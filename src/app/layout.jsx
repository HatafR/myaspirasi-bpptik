import "./globals.css";

export const metadata = {
  title: "BPT Komdigi MyAspirasi",
  description: "Platform aspirasi digital Balai Pelatihan Talenta Komunikasi dan Digital",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
