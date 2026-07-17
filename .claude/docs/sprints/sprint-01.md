# Sprint 01 — Ölçüm girişi + SQLite + geçmiş

## Hedef
Kullanıcı yeni bir vücut ölçümü girip kaydedebilsin; geçmiş ölçümler tarihe göre listelensin. Veri yerel SQLite'ta.

## Kapsam
IN:  SQLite kurulumu (better-sqlite3 + electron-rebuild), ölçüm şeması, ekle/listele IPC, ölçüm formu + geçmiş listesi UI.
OUT: Grafikler (sprint-02), fotoğraf (sprint-02), AI (sprint-03+).

## Ölçüm alanları (14.06.25 tartı verisine göre)
Tarih, kilo, boy, BMI, yağ%, yağ kg, toplam kas kg, BMR, su%, gövde kas/yağ%, sağ/sol bacak kas+yağ%, sağ/sol kol kas+yağ%. (Tümü opsiyonel; en az kilo zorunlu.)

## Görevler
- [x] SQLite: better-sqlite3 yerine **sql.js (WASM)** kullanıldı (Node 26'da native derleme çalışmıyor; WASM derleme gerektirmiyor)
- [x] `app/src/main/db/` — sql.js bağlantısı + `measurements` tablosu + migration + diske kalıcılık
- [x] main'de ölçüm ekle/listele/sil fonksiyonları + IPC handler'lar
- [x] `preload` — `window.api.measurements.*` güvenli köprü
- [x] Renderer: ölçüm giriş formu (Genel/Gövde/Bacaklar/Kollar) + geçmiş listesi
- [x] 14.06.25 verisini seed butonu ile ekleme
- [x] typecheck + build yeşil, runtime doğrulandı (kullanıcı ekranında)

## Not: yaşanan buglar (çözüldü)
- `package.json` `type:module` → preload `.mjs` üretiliyordu, main `.js` arıyordu → köprü yüklenmiyordu. `type:module` kaldırıldı.
- better-sqlite3 & electron binary indirmesi Node 26'da bozuldu → sql.js'e geçildi, electron zip elle açıldı.

## Dokunulacak dosyalar
app/src/main/db/index.ts, app/src/main/db/measurements.ts
app/src/main/ipc.ts, app/src/main/index.ts
app/src/preload/index.ts, app/src/preload/index.d.ts
app/src/renderer/src/features/measurements/*

## Done tanımı
- Ölçüm girilip kaydediliyor, uygulama yeniden açılınca kalıcı.
- Geçmiş liste tarihe göre sıralı görünüyor.
- typecheck + build temiz.
