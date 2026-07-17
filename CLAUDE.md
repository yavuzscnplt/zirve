# Spor Koçu

Yavuz'un **kişisel, tek kullanıcılı masaüstü AI spor koçu**. Ölçüm + fotoğraf takibi, AI vücut analizi, AI antrenman ve beslenme programı; seni tanıyan, verini hatırlayan sohbet eden bir dijital PT. Ürün değil, kişisel araç. Sadece Windows.

## Stack
- Masaüstü: Electron 34 + React 19 + TypeScript, build aracı electron-vite (Vite 5)
- Yerel veri: SQLite (Sprint 1'de `better-sqlite3` + `@electron/rebuild` ile) — her şey cihazda, local-first
- AI beyni: **Claude Agent SDK** (`@anthropic-ai/claude-agent-sdk`) — kullanıcının **Claude Pro aboneliğiyle** çalışır (Claude Code `/login` oturumu). Ham Anthropic API + API anahtarı KULLANMA (ayrı ücret).
- Model: `claude-opus-4-8`. Vision ile fotoğraf analizi.
- MCP (ücretsiz, Agent SDK'ye bağlanır): **USDA FoodData Central** (beslenme verisi), **wger** (egzersiz verisi). Ücretli MCP (Higgsfield vb.) YASAK.

## Komutlar (bunları kullan — hepsi `app/` içinde çalışır)
- Geliştirme:   `cd app && npm run dev`
- Build:        `cd app && npm run build`
- Tip kontrol:  `cd app && npm run typecheck`
- Paketleme:    (Sprint sonlarında electron-builder eklenecek)

## Mimari kuralları (DEĞİŞMEZ)
- Electron 3 katman: `app/src/main` (Node/Electron), `app/src/preload` (köprü), `app/src/renderer` (React UI).
- Renderer'dan Node/DB'ye ASLA doğrudan erişme — her şey `preload` üzerinden `contextBridge` + IPC ile.
- Tüm kullanıcı verisi (ölçüm, foto, program, sohbet) yerelde SQLite'ta. Buluta veri gönderme; fotoğraflar analiz anında Agent SDK'ye gider, kalıcı olarak dışarı çıkmaz.
- AI çağrıları main process'te (Agent SDK), renderer değil.
- Hedefler çoklu seçilebilir: kas kazanma / yağ yakma / kilo verme / omurga sağlığı / esneklik / patlayıcı güç / niş spor.

## Her zaman / Asla
- HER ZAMAN: değişiklikten sonra `npm run typecheck` ve gerekiyorsa `npm run build` çalıştır, geçtiğini gör.
- HER ZAMAN: bir sprint bitince ROADMAP'i ve sprint dosyasını güncelle.
- ASLA: onaylanmamış paket kurma (`npm i` önce sor).
- ASLA: ücretli servis/MCP/API anahtarı ekleme — her şey Claude Pro aboneliği + ücretsiz kaynaklarla.
- ASLA: `.env`, secret, kişisel veri commit etme.

## Detay
- Konvansiyonlar: @.claude/docs/conventions.md
- Mimari detay (gerektiğinde oku): .claude/docs/architecture.md
- Aktif iş: .claude/docs/sprints/ROADMAP.md → şu an **sprint-01**
- Referans: eski ölçümler `14.06.25/` klasöründe; geliştirme yöntemi `claude-code-ultimate-playbook.md`.
