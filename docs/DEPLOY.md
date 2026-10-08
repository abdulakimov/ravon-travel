# Deploy — ravontravel.uz

**Oqim:** `git push main` → GitHub Actions (`.github/workflows/deploy.yml`): lint + unit testlar →
image qurish → GHCR (`ghcr.io/nodirmuxammadjanov/ravon-travel-web:{<sha>,latest}`) → serverga SSH →
`docker compose pull web` → `docker compose up -d web` → health check → yashil.

Serverda image **qurilmaydi**. Server faqat tortadi va qayta ishga tushiradi.

| Nima | Qayerda |
|---|---|
| Server | `new-vps` — 167.86.86.68 (ULASHILGAN box, ~45 sayt) |
| Katalog | `/opt/ravon-travel` (`docker-compose.yml` CI'dan keladi; `.env` box-local) |
| Konteyner | `ravon-travel-web-1`, `127.0.0.1:3130 → 3000` |
| Reverse proxy | host nginx: `/etc/nginx/sites-available/ravontravel.uz` (nusxasi: `infra/nginx-ravontravel.uz.conf`) |
| TLS | Let's Encrypt, cert nomi `ravontravel.uz` (apex + www), HTTP-01 webroot `/var/www/letsencrypt`, `renew_hook = systemctl reload nginx` |
| Repo | `github.com/NodirMuxammadjanov/ravon-travel` (private) |

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

Qo'shimcha: `.env` da `LEAD_WEBHOOK_URL` berilsa, har xabar o'sha manzilga ham JSON POST qilinadi
(CRM / Telegram ko'prigi). Webhook ishlamasa xabar yo'qolmaydi — faylda qoladi, log'da `lead_delivery_failed`.

## Serverdagi `.env` (git'da yo'q, pipeline tegmaydi)

`.env.example` ga qarang (`LEAD_WEBHOOK_URL`, `HOST_PORT`). `.env` o'zgarsa:
`cd /opt/ravon-travel && IMAGE_REGISTRY=ghcr.io/nodirmuxammadjanov IMAGE_TAG=$(cat .deployed_tag) docker compose up -d --no-build web`.

## Tekshirish

```bash
ssh new-vps 'docker ps --filter name=ravon-travel --format "{{.Names}}  {{.Image}}  {{.Status}}"'
curl -I https://ravontravel.uz/uz          # 200
curl -s https://ravontravel.uz/api/health  # {"status":"ok"}
BASE_URL=https://ravontravel.uz npm run test:e2e
```

## Rollback

Yangi konteyner sog'lik tekshiruvidan o'tmasa deploy job **o'zi** oldingi tegga qaytaradi (`.deployed_tag`).
Tashqi URL tekshiruvi (nginx/DNS/TLS) yiqilsa rollback qilinmaydi — job qizil bo'ladi, sabab log'da.
Qo'lda:

```bash
ssh new-vps 'cd /opt/ravon-travel && IMAGE_REGISTRY=ghcr.io/nodirmuxammadjanov IMAGE_TAG=<eski-sha> docker compose up -d --no-build web'
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

Faqat favqulodda: lokalda `docker buildx build --platform linux/amd64 -t ghcr.io/nodirmuxammadjanov/ravon-travel-web:manual --push .`
so'ng serverda `IMAGE_TAG=manual docker compose pull web && docker compose up -d web`. Serverda build qilinmaydi.

## Monitoring (tavsiya)

Tashqi uptime monitor (UptimeRobot / Better Stack, 1–5 daqiqa) → `https://ravontravel.uz/api/health`,
kalit so'z `"ok"`, ogohlantirish Telegram'ga. Bu nginx, TLS muddati va DNS muammolarini ham ushlaydi.
