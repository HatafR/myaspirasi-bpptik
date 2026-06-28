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

## Jika muncul "Internal Error" saat Save (config kosong pun gagal)

**Bukan karena tab Advanced.** Cek log NPM:

```bash
docker logs nginx-proxy-manager --tail 50
```

Jika ada pesan seperti:
```text
too many failed authorizations ... for "ticketing-bpt.komdigi.go.id"
```

artinya **Let's Encrypt gagal** (rate limit / domain tidak bisa diverifikasi dari internet publik).

`nginx -t` bisa tetap **successful** — config nginx valid, yang gagal hanya **request sertifikat SSL**.

### Penyebab umum di environment Anda

- Domain hanya bisa diakses lewat **VPN** → Let's Encrypt dari internet **tidak bisa** reach server (HTTP-01 challenge gagal)
- Sudah gagal 5x dalam 1 jam → **rate limit** Let's Encrypt (tunggu ~1 jam)

### Cara Save tanpa error

**Opsi A — Pakai sertifikat yang sudah ada (disarankan)**

1. Tab **SSL** → **SSL Certificate**: pilih sertifikat yang **sudah ada** di dropdown (jangan "Request a new SSL Certificate")
2. Jangan centang ulang request cert baru
3. Save

**Opsi B — Upload sertifikat Komdigi/DigiCert**

1. Tab **SSL** → **Custom Certificate**
2. Upload `.crt` + `.key` resmi
3. Save

**Opsi C — Sementara HTTP dulu (untuk tes header)**

1. Tab **SSL** → matikan request cert / gunakan "None" sementara
2. Save Details + Advanced dulu
3. SSL aktifkan lagi setelah rate limit habis atau cert manual terpasang

### Setelah rate limit habis

Let's Encrypt bilang `retry after <waktu UTC>`. Tunggu sampai lewat waktu itu sebelum request cert lagi.

Let's Encrypt **tidak akan jalan** selama server hanya reachable via VPN — perlu koordinasi infra untuk:
- Port **80** terbuka dari internet publik (challenge), atau
- Pakai **DNS challenge**, atau
- Pakai **sertifikat internal/resmi** (upload manual)

## Jika Internal Error karena syntax Advanced

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
