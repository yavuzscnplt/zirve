# Mimari (referans — gerektiğinde oku)

## Genel akış
```
[React UI / renderer]  --window.api-->  [preload köprü]  --IPC-->  [main süreç]
                                                                     |
                                          +--------------------------+--------------------------+
                                          |                          |                          |
                                     [SQLite/better-sqlite3]   [Agent SDK / Claude]      [MCP: USDA, wger]
                                     yerel veri               Pro aboneliğiyle          ücretsiz veri kaynakları
```

## Katmanlar
- **renderer (React):** ekranlar ve etkileşim. Veriyi yalnız `window.api` üzerinden ister. Node/DB/AI'ya doğrudan erişimi yok.
- **preload:** `contextBridge.exposeInMainWorld('api', ...)` ile güvenli, dar bir yüzey. Sadece IPC çağrısı yapar.
- **main:** gerçek iş. DB CRUD, AI çağrıları, MCP bağlantıları, dosya (foto) yönetimi.

## Veri modeli (büyüyecek)
- `measurements` — tarihli vücut ölçümleri (Sprint 1).
- `photos` — tarihli poz fotoğrafları, dosya yolu + meta (Sprint 2).
- `programs` — üretilen antrenman/beslenme programları (Sprint 5-6).
- `chats` / `coach_memory` — koç sohbet geçmişi ve hatırladıkları (Sprint 3).

## AI koç (Sprint 3+)
- Main süreçte Agent SDK; Pro aboneliği oturumunu kullanır (Claude Code `/login`).
- Koç, kullanıcının DB'deki ölçüm/foto/program geçmişini bağlam olarak alır → kişisel yanıt.
- Program üretiminde MCP'ler: egzersizler wger'den, besin değerleri USDA'dan (uydurma değil).
- Fotoğraf analizi: vision ile; foto kalıcı olarak dışarı gönderilmez.

## Gizlilik
- Local-first. Tüm hassas veri (foto, ölçüm) cihazda. Fotoğraf yalnız analiz anında modele gider.
