# Konvansiyonlar

## Dil
- Kod, değişken/fonksiyon isimleri İngilizce; UI metinleri ve kullanıcıya görünen her şey Türkçe.
- Yorumlar Türkçe olabilir.

## Klasör düzeni (app/src)
- `main/` — Electron ana süreç: pencere, DB, AI (Agent SDK), IPC handler'lar.
  - `main/db/` — SQLite bağlantısı ve tablo modülleri (her domain ayrı dosya).
  - `main/ipc.ts` — tüm IPC handler kayıtları tek yerde.
- `preload/` — sadece `contextBridge` ile `window.api.*` yüzeyi. İş mantığı YOK.
- `renderer/src/` — React UI.
  - `renderer/src/features/<alan>/` — her özellik kendi klasöründe (measurements, photos, coach, program...).
  - `renderer/src/components/` — paylaşılan bileşenler.
  - `renderer/src/assets/` — css, ikon.

## Stil
- TypeScript `strict`. `any` kaçın; tip belirsizse `unknown` + daralt.
- React fonksiyon bileşenleri, hooks. Sınıf bileşeni yok.
- IPC kanalları isimlendirme: `<alan>:<eylem>` (örn. `measurements:add`, `measurements:list`).
- DB erişimi yalnız `main/db/`; renderer asla doğrudan.

## Güvenlik
- `contextIsolation: true`, `sandbox: false` (preload native gerektiğinde).
- Renderer'a yalnız gereken metotları aç; ham `ipcRenderer` verme.
