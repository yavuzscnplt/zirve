# Sprint 00 — İskelet

## Hedef
Electron + React + TypeScript masaüstü uygulama iskeletini kurmak; çalışan bir pencere.

## Görevler
- [x] `app/` altında electron-vite + React 19 + TS scaffold (elle, deterministik)
- [x] main / preload / renderer 3 katman
- [x] `npm run typecheck` temiz
- [x] `npm run build` başarılı (main + preload + renderer)
- [x] CLAUDE.md anayasası + .claude/docs/sprints yapısı

## Done tanımı
- [x] `cd app && npm install` sorunsuz
- [x] `npm run build` yeşil
- [x] `npm run typecheck` yeşil
- Manuel: `cd app && npm run dev` ile pencere açılıyor (kullanıcı doğrulayacak — GUI)

## Notlar
- better-sqlite3 Node 26'da kaynaktan derlenemedi → Sprint 1'de Electron ABI'sine göre `@electron/rebuild` ile eklenecek.
- Vite 6, electron-vite 2.3 ile uyumsuz → Vite 5'e sabitlendi.
