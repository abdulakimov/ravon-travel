# Deploy — ravontravel.uz

**Oqim:** `git push main` → GitHub Actions (`.github/workflows/deploy.yml`): lint + unit testlar →
image qurish → GHCR (`ghcr.io/abdulakimov/ravon-travel-web:{<sha>,latest}`) → serverga SSH →
`docker compose pull web` → `docker compose up -d web` → health check → yashil.

Serverda image **qurilmaydi**. Server faqat tortadi va qayta ishga tushiradi.

| Nima | Qayerda |
|---|---|
| Server | `new-vps` — 167.86.86.68 (ULASHILGAN box, ~45 sayt) |
| Katalog | `/opt/ravon-travel` (`docker-compose.yml` CI'dan keladi; `.env` box-local) |
| Konteyner | `ravon-travel-web-1`, `127.0.0.1:3130 → 3000` |
| Reverse proxy | host nginx: `/etc/nginx/sites-available/ravontravel.uz` (nusxasi: `infra/nginx-ravontravel.uz.conf`) |
| TLS | Let's Encrypt, cert nomi `ravontravel.uz` (apex + www), HTTP-01 webroot `/var/www/letsencrypt`, `renew_hook = systemctl reload nginx` |
| Repo | `github.com/abdulakimov/ravon-travel` (private) |

## Actions sozlamalari

Secrets: `VPS_HOST`, `VPS_USERNAME`, `VPS_SSH_PORT`, `VPS_FINGERPRINT` (serverning **ECDSA** host-key SHA256 fingerprinti — appleboy action shu algoritmni tanlaydi: `ssh new-vps "ssh-keygen -lf /etc/ssh/ssh_host_ecdsa_key.pub"`), `VPS_SSH_KEY` (alohida deploy kalit:
`~/.ssh/ravon-travel_deploy`, public qismi serverda `authorized_keys`da `gha-ravon-travel-deploy` izohi bilan).
Variables: `DEPLOY_DIR=/opt/ravon-travel`, `PUBLIC_URL=https://ravontravel.uz/api/health`.

## Xabarlar (aloqa / so'rov / bron) qayerga tushadi

Har bir xabar serverda **`/opt/ravon-travel/data/leads.ndjson`** fayliga yoziladi (har qatori bitta JSON;
bind-mount, deploy va restart'dan omon qoladi, faqat root/uid 1000 o'qiy oladi):

```bash
ssh new-vps 'tail -n 20 /opt/ravon-travel/data/leads.ndjson'
```

**Telegram'ga ulash (2 daqiqa):**

1. @BotFather → `/newbot` → tokenni oling. Botni menejerlar guruhiga qo'shing va guruhga biror xabar yozing.
2. `https://api.telegram.org/bot<TOKEN>/getUpdates` ni oching → `"chat":{"id": -100…}` — shu chat ID.
3. Serverda `.env` ga yozing va konteynerni qayta yarating:

```bash
ssh new-vps
cd /opt/ravon-travel && nano .env        # TELEGRAM_BOT_TOKEN=…  TELEGRAM_CHAT_ID=…
IMAGE_REGISTRY=ghcr.io/abdulakimov IMAGE_TAG=$(cat .deployed_tag) docker compose up -d --no-build web
```

Shundan keyin har bir aloqa / so'rov / bron xabari guruhga keladi (faylga ham yozilaveradi).

Qo'shimcha: `.env` da `LEAD_WEBHOOK_URL` berilsa, har xabar o'sha manzilga ham JSON POST qilinadi
(CRM / Telegram ko'prigi). Webhook ishlamasa xabar yo'qolmaydi — faylda qoladi, log'da `lead_delivery_failed`.

## Click to'lov tizimi

Kod tayyor; kalitlar `.env` ga yozilmaguncha sayt **demo rejimda** (pul yechilmaydi). Ulash tartibi:

1. **Kalitlar** — merchant.click.uz kabinetidan: `SERVICE_ID`, `MERCHANT_ID`, `SECRET_KEY`, `MERCHANT_USER_ID`.
   Serverdagi `.env` ga yozing (git'ga ham, chatga ham emas) va konteynerni qayta yarating:
   ```bash
   ssh new-vps
   cd /opt/ravon-travel && nano .env   # CLICK_SERVICE_ID=…  CLICK_MERCHANT_ID=…  CLICK_SECRET_KEY=…  CLICK_MERCHANT_USER_ID=…
   IMAGE_REGISTRY=ghcr.io/abdulakimov IMAGE_TAG=$(cat .deployed_tag) docker compose up -d --no-build web
   ```
2. **Firewall oq ro'yxati** — server TAS-IX tarmog'ida emas. Birinchi real to'lovdan OLDIN Click guruhiga yozing:
   domen `ravontravel.uz`, IP `167.86.86.68`, port `443`. IP statik bo'lishi shart; IP yoki domen o'zgarsa —
   avval Click'ga xabar beriladi, keyin almashtiriladi.
3. **Kabinetda URL'lar** — merchant.click.uz → «Сервисы» → qalam belgisi:
   - Prepare (проверка): `https://ravontravel.uz/api/click/prepare`
   - Complete (результат): `https://ravontravel.uz/api/click/complete`
4. **Test** — docs.click.uz/click-api-testing dasturi bilan ikkala URL'ni tekshiring, so'ng Click'ga xabar bering —
   ular servisni yoqadi (default o'chiq).
5. **Birinchi to'lov** — saytda bron qiling (eng arzon tur) va Click Up ilovasida to'lang. Yoki to'g'ridan-to'g'ri havola:
   `https://my.click.uz/services/pay?service_id=<SERVICE_ID>&merchant_id=<MERCHANT_ID>&amount=<summa>&transaction_param=<RV-…>`
   (`transaction_param` — saytda yaratilgan haqiqiy bron raqami, summa aynan bron summasi bo'lishi kerak).

**Qanday ishlaydi:** bron tasdiqlanganda server bron raqami va so'mdagi summani belgilab `data/orders/<RV-…>.json` ga
yozadi. Click avval Prepare (summa va bron tekshiriladi), pul yechilgach Complete yuboradi — shundagina bron
«to'landi» bo'ladi va menejerga «💳 To'lov qabul qilindi» xabari ketadi (Telegram/`leads.ndjson`). Imzo
`md5(... SECRET_KEY ...)` tekshiriladi. Bron 30 daqiqa saqlanadi (+10 daqiqa Click sahifasi uchun).

**Loglar va muammo qidirish** (Click so'raganda — so'rov/javoblarni guruhga yuborish uchun):
```bash
ssh new-vps 'tail -n 20 /opt/ravon-travel/data/click.ndjson'      # har Prepare/Complete so'rovi va javobi
ssh new-vps 'cat /opt/ravon-travel/data/orders/RV-2026-12345.json' # bron holati va Click tranzaksiyalari
ssh new-vps 'docker logs ravon-travel-web-1 2>&1 | grep click'      # qisqa jurnal
```

**Log hajmi:** `infra/logrotate-ravon-travel` → `/etc/logrotate.d/ravon-travel` (o'rnatilgan): faqat `click.ndjson` va
`admin/audit.ndjson` oylik aylantiriladi. `leads.ndjson` ATAYLAB aylantirilmaydi — admin panel murojaatlarni va bron
mijozlarini shu fayldan o'qiydi (~0.5 KB/murojaat, yillar davomida kichik). `data/orders/` — to'lov dalili, o'chirilmaydi.

**Zaxira nusxa:** `infra/ravon-backup.sh` → `/usr/local/sbin/ravon-backup.sh`, cron `/etc/cron.d/ravon-backup`
(har kuni 03:17 Toshkent): `/opt/ravon-travel/data` ning kunlik snapshot'i `/var/backups/ravon-travel/<sana>` ga
(o'zgarmagan fayllar hard-link, 14 kun saqlanadi; buzilgan JSON bo'lsa — log'da "BACKUP FAILED"). Serverdan tashqariga
nusxa (`BACKUP_REMOTE`) hali sozlanmagan — VPS yo'qolsa zaxira ham yo'qoladi. `.env` zaxiraga KIRMAYDI (kalitlar
parol menejerida saqlansin).

Tiklash (avval ilovani to'xtating — xotiradagi kesh va navbat tiklangan fayllarni qayta yozmasin):

```bash
cd /opt/ravon-travel && docker compose stop web \
 && rsync -a --delete /var/backups/ravon-travel/<STAMP>/ data/ \
 && chown -R 1000:1000 data && find data -type d -exec chmod 700 {} + \
 && IMAGE_REGISTRY=ghcr.io/abdulakimov IMAGE_TAG=$(cat .deployed_tag) docker compose up -d --no-build web
```

Kontent fayllari (`content/*.json`) har saqlashda oldingi nusxani `<fayl>.prev` ga qo'yadi (bir qadam orqaga).
Rollback: `fbb890f` dan oldingi image'ga qaytmang — u `/data/content` ni o'qimaydi (admin o'zgarishlari ko'rinmaydi).

**Fiskalizatsiya:** Click tomonida — bitta IKPU `10703999001000000` (sayyohlik agentliklari va turoperatorlar xizmatlari),
QQSsiz, chek turi debet (Click'ga 16.10.2026 №1 xat). Sayt chek yubormaydi. Tekshirish: Click ilovasidagi to'lov chekida
`ofd.soliq.uz` QR/havolasi bo'lishi kerak. Kabinetda bir nechta IKPU bo'lsa,
`https://api.click.uz/v2/merchant/payment/ofd_data/submit_items` integratsiyasi qo'shilishi kerak (IKPU, qadoq kodi,
QQS, STIR kerak bo'ladi).

**Demo'ga qaytish (favqulodda):** `.env` dan `CLICK_SECRET_KEY` ni o'chirib, konteynerni qayta yarating.

**E2E (production):** Click yoqilgach, demo karta bilan to'lov testlari productionda o'tmaydi — ular faqat
lokal (Click kalitlarisiz) muhitda yuritiladi.

## Admin panel — admin.ravontravel.uz

Xuddi shu konteyner (Host bo'yicha ajratiladi: `src/proxy.ts`). Alohida servis yoki port YO'Q — bron qulfi bitta jarayonda.

**nginx/TLS (bajarilgan, 2026-10-21):** `infra/nginx-admin.ravontravel.uz.conf` → `/etc/nginx/sites-available/admin.ravontravel.uz`,
sertifikat `admin.ravontravel.uz` (HTTP-01 webroot, `renew_hook = systemctl reload nginx`). Faqat shu blokda
`client_max_body_size 12m` (rasm yuklash). DNS: Cloudflare, A yozuv → 167.86.86.68 (proxy o'chiq).

**Maxfiy qiymatlar** (serverdagi `.env`, serverda yaratilgan, chatga yozilmagan):
`ADMIN_SESSION_SECRET` (64 hex) va `ADMIN_INITIAL_PASSWORD`. Boshlang'ich parolni ko'rish (faqat birinchi kirish uchun):

```bash
ssh new-vps "grep '^ADMIN_INITIAL_PASSWORD=' /opt/ravon-travel/.env | cut -d= -f2-"
```

Login: `admin`. Birinchi kirishda parolni almashtirish majburiy. Keyin `.env` dagi boshlang'ich parol ishlatilmaydi
(foydalanuvchilar fayli mavjud bo'lgani uchun), uni o'chirib qo'yish mumkin. Kalitni almashtirish (`ADMIN_SESSION_SECRET`) —
barcha sessiyalarni yopadi.

**Fayllar** (`/opt/ravon-travel/data`, konteyner ichida `/data`, egasi uid 1000):

| Fayl | Mazmun |
|------|--------|
| `content/{tours,taxonomy,posts,faq,settings}.json` | sayt kontenti (admin tahrirlaydi; yo'q bo'lsa `src/data` seed) |
| `admin/users.json` | panel foydalanuvchilari (scrypt) |
| `admin/audit.ndjson` | kim, qachon, nima qildi |
| `admin/lead-status.json` | murojaat holatlari va izohlar |
| `media/` | yuklangan rasmlar (`<id>.jpg` + `opt/<id>-<w>.webp`) |
| `orders/`, `leads.ndjson`, `click.ndjson` | bronlar, murojaatlar, Click jurnali |

**Parolni unutsa (break-glass):** `users.json` ni zaxiraga ko'chirib o'chiring va konteynerni qayta yarating —
`.env` dagi `ADMIN_INITIAL_PASSWORD` bilan yangi `admin` egasi yaratiladi (boshqa foydalanuvchilar qayta qo'shiladi).

## Serverdagi `.env` (git'da yo'q, pipeline tegmaydi)

`.env.example` ga qarang (`LEAD_WEBHOOK_URL`, `TELEGRAM_*`, `CLICK_*`, `HOST_PORT`). `.env` o'zgarsa:
`cd /opt/ravon-travel && IMAGE_REGISTRY=ghcr.io/abdulakimov IMAGE_TAG=$(cat .deployed_tag) docker compose up -d --no-build web`.

## Tekshirish

```bash
ssh new-vps 'docker ps --filter name=ravon-travel --format "{{.Names}}  {{.Image}}  {{.Status}}"'
curl -I https://ravontravel.uz/uz          # 200
curl -s https://ravontravel.uz/api/health  # {"status":"ok"}
BASE_URL=https://ravontravel.uz E2E_MOCK_LEADS=1 PW_CHANNEL=chrome npm run test:e2e   # yoki Actions → "E2E (production)"
```

## Rollback

Yangi konteyner sog'lik tekshiruvidan o'tmasa deploy job **o'zi** oldingi tegga qaytaradi (`.deployed_tag`).
Tashqi URL tekshiruvi (nginx/DNS/TLS) yiqilsa rollback qilinmaydi — job qizil bo'ladi, sabab log'da.
Qo'lda:

```bash
ssh new-vps 'cd /opt/ravon-travel && IMAGE_REGISTRY=ghcr.io/abdulakimov IMAGE_TAG=<eski-sha> docker compose up -d --no-build web'
```

(Eski image serverda qolmagan bo'lsa — avval `docker login ghcr.io` (PAT, `read:packages`) kerak,
yoki Actions'da o'sha commit'ning eski run'ida **Re-run all jobs**.)

## nginx (bir martalik, bajarilgan)

Shared box qoidalari: boshqa vhost'larga tegilmaydi; har o'zgarishdan oldin `nginx -t`; faqat `reload`.

```bash
scp infra/nginx-ravontravel.uz.conf new-vps:/etc/nginx/sites-available/ravontravel.uz
ssh new-vps 'nginx -t && systemctl reload nginx'
```

Eslatma: box'dagi nginx 1.24 — `http2 on;` direktivasi yo'q (1.25.1+), shuning uchun faylda ishlatilmagan.

Eslatma: konteyner docker'ning default `bridge` tarmog'ida ishlaydi (`network_mode: bridge`) — box'da
yangi compose tarmog'i uchun bo'sh manzil hovuzi qolmagan. Kelajakda ikkinchi servis (masalan DB) qo'shilsa,
aniq `subnet` bilan tarmoq e'lon qilish kerak bo'ladi.

## Break-glass (CI ishlamasa)

Faqat favqulodda: lokalda `docker buildx build --platform linux/amd64 -t ghcr.io/abdulakimov/ravon-travel-web:manual --push .`
so'ng serverda `IMAGE_TAG=manual docker compose pull web && docker compose up -d web`. Serverda build qilinmaydi.

## Monitoring (tavsiya)

Tashqi uptime monitor (UptimeRobot / Better Stack, 1–5 daqiqa) → `https://ravontravel.uz/api/health`,
kalit so'z `"ok"`, ogohlantirish Telegram'ga. Bu nginx, TLS muddati va DNS muammolarini ham ushlaydi.
