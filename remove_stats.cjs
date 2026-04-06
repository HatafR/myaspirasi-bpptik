const fs = require('fs');

const filePath = 'src/components/AdminDashboard.jsx';
const content = fs.readFileSync(filePath, 'utf-8');

const startIndex = content.indexOf('          {/* ── TAB: STATISTIK ─────────────────────────────────────── */}');
const endIndex = content.indexOf('          {/* ── TAB: KELOLA ADMIN (Admin General only) ─────────────── */}');

if (startIndex !== -1 && endIndex !== -1) {
  const newContent = content.substring(0, startIndex) + content.substring(endIndex);
  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log('Successfully removed stats tab rendering block.');
} else {
  console.log('Failed to find markers.');
}
