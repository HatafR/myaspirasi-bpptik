# NPM Proxy Host — panduan paste header keamanan (VAPT)

## Sebelum paste (tab Advanced)

Di tab **Details**, matikan:
- **Block Common Exploits** → OFF (bentrok dengan X-Frame-Options custom)

Di tab **SSL**, aktifkan:
- **Force SSL** → ON
- **HTTP/2 Support** → ON
- **HSTS Enabled** → ON (HSTS TIDAK ditulis di Advanced, NPM yang handle)
- **HSTS Subdomains** → ON (opsional)

## Paste config (tab Advanced)

Gunakan file **`npm-proxy-advanced-paste.conf`** — tanpa komentar, tanpa baris `#`.

Jangan paste file `npm-proxy-advanced.conf` (ada komentar → bisa Internal Error).

## Jika masih Internal Error

1. Paste dulu isi **`npm-proxy-advanced-minimal.conf`** (3 baris) → Save
2. Kalau berhasil, tambahkan baris lain satu per satu
3. Cek error nginx di VPS:
   ```bash
   docker logs nginx-proxy-manager --tail 30
   docker exec nginx-proxy-manager nginx -t
   ```

## Verifikasi

```bash
curl -sI https://ticketing-bpt.komdigi.go.id | grep -iE 'x-frame|content-security|strict-transport|referrer'
```
