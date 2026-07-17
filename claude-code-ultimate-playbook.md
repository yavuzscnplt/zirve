# Claude Code — Ultimate Setup Playbook
> Laravel / React-Next.js stack'i için. Token-optimal, sprint-bazlı, tutarlı geliştirme.
> Her projeye kopyala, `[...]` yerlerini doldur.

---

## 0. Zihinsel model — bağlam nasıl akıyor?

Her session **sıfır context** ile başlar. Otomatik yüklenenler:
- `~/.claude/CLAUDE.md` (kişisel, tüm projeler)
- `./CLAUDE.md` (proje anayasası) + onun `@import`'ları
- auto memory notları

**Otomatik yüklenmeyen** (= token kazandıran yer):
- Skill gövdeleri → sadece isim+açıklama yüklenir (~100 token/skill), gövde tetiklenince gelir
- Sprint dökümanları → sen okutana kadar gelmez
- Subagent çıktıları → izole bağlamda kalır, ana session'a sadece özet döner

**İzolasyon spektrumu** (sola gittikçe ucuz, sağa gittikçe izole):
```
Skills ───────── Subagents ───────── Agent Teams
aynı bağlam       izole bağlam         ayrı süreç
ucuz/hızlı        orta                 pahalı/paralel
```
Kural: tek bir bounded iş → skill veya doğrudan. Ana bağlamı kirletecek arama/inceleme → subagent. Birbirleriyle konuşması gereken paralel işçiler → agent teams (nadiren gerekir).

> ⚠️ `@import` token **kazandırmaz**, sadece dosyayı böler/düzenler. Detayı azaltmak istiyorsan skill'e veya import edilmeyen sprint dosyasına koy.

---

## 1. Dosya mimarisi

```
~/.claude/CLAUDE.md                  # kişisel tercihler (dil, kod stili) — her projede geçerli
PROJE/
├── CLAUDE.md                        # ANAYASA — lean, <150 satır
└── .claude/
    ├── skills/
    │   ├── laravel-feature/SKILL.md # tekrar eden Laravel feature akışı
    │   ├── review/SKILL.md          # PR/kod review checklist'in
    │   └── db-migration/SKILL.md
    ├── agents/
    │   ├── researcher.md            # read-only kod tabanı tarayıcı
    │   └── reviewer.md              # read-only kod inceleyici
    ├── commands/
    │   ├── sprint.md                # /sprint slash komutu
    │   └── ship.md                  # /ship — sprint kapanış
    └── docs/
        ├── conventions.md           # CLAUDE.md'ye @import edilir
        ├── architecture.md          # gerektiğinde okutulur (import EDİLMEZ)
        └── sprints/
            ├── ROADMAP.md           # tüm sprint listesi (1 satır/sprint)
            ├── sprint-04.md         # AKTİF sprint — session başında bu okutulur
            └── sprint-05.md         # sıradakiler
```

---

## 2. CLAUDE.md — Anayasa (template)

> Kural: kısa, spesifik, **değişmeyen** şeyler. Haftalık değişen şey buraya GİRMEZ (o prompt'a gider).
> Komutları mutlaka koy — Claude bunları sürekli çalıştırır, ezberlemesini bekleme.

```markdown
# [PROJE ADI]

[Tek cümle: ne yapan ürün, kime.]

## Stack
- Backend: Laravel 11, PHP 8.3
- Frontend: Next.js 14 (App Router), React, TypeScript, Tailwind
- DB: MySQL 8 + Redis (cache/queue)
- Test: Pest (backend), Vitest + Playwright (frontend)
- Ortam: WSL2 + Docker (8 container)

## Komutlar (bunları kullan, varsayma)
- Backend test:    `docker compose exec app php artisan test`
- Tek test:        `... php artisan test --filter=TestAdı`
- Lint/format:     `./vendor/bin/pint` + `npm run lint`
- Migration:       `... php artisan migrate`
- Frontend dev:    `npm run dev`
- Build kontrol:   `npm run build && npm run typecheck`

## Mimari kuralları (DEĞİŞMEZ)
- Modüler monolit: her domain `app/Domains/[Domain]/` altında
- Controller ince; iş mantığı Action sınıflarında (`app/Domains/*/Actions`)
- DB'ye direkt query YOK; Eloquent + Repository
- Multi-tenant: her sorgu `tenant_id` scope'una uymalı (global scope var)
- API response'ları her zaman Resource sınıfından geçer

## Her zaman / Asla
- HER ZAMAN: değişiklikten sonra ilgili testi çalıştır, geçtiğini gör
- HER ZAMAN: yeni feature → önce test (TDD), sonra implementasyon
- ASLA: migration'ı elle edit etme, yeni migration yaz
- ASLA: `.env`, secret, admin şifresi commit etme
- ASLA: onaylanmamış paket kurma (`composer require` / `npm i` önce sor)

## Detay
- Konvansiyonlar: @.claude/docs/conventions.md
- Mimari detay (gerektiğinde oku): .claude/docs/architecture.md
- Aktif iş: .claude/docs/sprints/ROADMAP.md → şu an **sprint-04**
```

**Neden böyle:** komutlar + değişmez kurallar + "her zaman/asla" en yüksek ROI'li kısım. Konvansiyon detayını `@import` ile ayrı dosyada tutuyorsun (düzen için), mimari detayı import ETMİYORSUN (token için — Claude lazım olunca okur).

---

## 3. Sprint sistemi

### ROADMAP.md
```markdown
# Roadmap

Her sprint = bir session'a sığan, bağımsız, "done" tanımı net bir teslim.

- [x] sprint-00  İskelet + Docker
- [x] sprint-01  Auth (10 rol / 33 izin)
- [x] sprint-02  Şema (50+ tablo)
- [x] sprint-03  Katalog UI
- [ ] sprint-04  Meilisearch entegrasyonu        ← AKTİF
- [ ] sprint-05  Sipariş akışı
- [ ] sprint-06  Fatura OCR
```

### sprint-XX.md (template)
```markdown
# Sprint 04 — Meilisearch Entegrasyonu

## Hedef
Katalog ürünlerinde anlık full-text arama; filtre + sayfalama.

## Kapsam
IN:  Meili index'leme, ürün arama endpoint'i, React arama UI'ı, debounce
OUT: Sinonim sözlüğü, gelişmiş facet'ler (sprint-08'e)

## Görevler
- [ ] `ProductSearch` action + Meili index config
- [ ] Model'e Searchable trait + tenant scope'lu index
- [ ] `GET /api/products/search` + Resource
- [ ] React `<ProductSearch>` (debounce 300ms, loading state)
- [ ] Pest: index sync, arama doğruluğu, tenant izolasyonu
- [ ] Vitest: bileşen davranışı

## Dokunulacak dosyalar
app/Domains/Catalog/Actions/ProductSearch.php
app/Domains/Catalog/Models/Product.php
routes/api.php
resources/js/components/ProductSearch.tsx

## Done tanımı
- Tüm testler yeşil
- `npm run build && typecheck` temiz
- Pint + lint temiz
- Manuel: 2 farklı tenant'ta arama izole çalışıyor
```

### Döngü (her session)
1. **Yeni session aç** (eski bağlam taşınmasın)
2. `/clear` (gerekirse)
3. **Sprint prompt'unu** yapıştır (bkz. §8b)
4. Claude planı çıkarsın → onayla → çalıştırsın
5. Bitince **kapanış prompt'u** (§8c): testler, commit, ROADMAP güncelle, sprint dosyasını "done" yap
6. Kapat. Sonraki sprint = yeni session.

> Senin "her session bir sprint" alışkanlığın doğru — bunu kurala çevirdik. 4-5 saatten sonra bağlam gürültüyle dolar; tek-sprint-tek-session bunu hiç yaşatmaz.

---

## 4. Skills (SKILL.md) — template

İki tür: **Capability** (Claude'da olmayan yetenek) ve **Preference** (senin akışını dayatma). Sprint'lerde tekrar eden her "şöyle yaparız" → skill.

`.claude/skills/laravel-feature/SKILL.md`:
```markdown
---
name: laravel-feature
description: Yeni bir Laravel domain feature'ı eklerken kullan. Action+Resource+test akışını,
  modüler monolit yapısını ve tenant scope kuralını dayatır. Controller/Action/migration/
  Pest test içeren her yeni özellikte tetikle.
---

# Laravel Feature Akışı

Yeni feature eklerken sırayla:

1. **Önce test** — `app/Domains/[Domain]/Tests/` altına Pest testi yaz (kırmızı).
2. **Action** — iş mantığı `Actions/[Fiil][Nesne].php`, tek `handle()` metodu.
3. **Model/Migration** — yeni migration; mevcut migration'a DOKUNMA. tenant_id scope.
4. **Controller** — ince; sadece Action'ı çağırır, Resource döner.
5. **Resource** — response asla raw model değil, her zaman Resource.
6. **Route** — `routes/api.php`, uygun middleware grubu.
7. Testi yeşile çevir → `pint` → bitti.

## Kontrol
- [ ] Tenant izolasyonu testte doğrulandı mı?
- [ ] N+1 var mı? (eager load)
- [ ] Resource'ta hassas alan sızıyor mu?
```

`.claude/skills/review/SKILL.md` (Preference tipi):
```markdown
---
name: review
description: Kod inceleme / PR review istendiğinde kullan. Güvenlik, tenant izolasyonu,
  N+1, test kapsamı ve konvansiyon uyumunu sistematik kontrol eder.
---
# Review Checklist
Güvenlik → tenant scope → N+1/performans → test kapsamı → konvansiyon → isimlendirme.
Her bulgu için: dosya:satır + neden + önerilen düzeltme.
```

> `description` alanı KRİTİK — Claude skill'i tetikleyip tetiklemeyeceğine buna bakarak karar verir. "Ne zaman kullanılacağını" net yaz.

---

## 5. Subagents — template

Ana bağlamı korumak için. **Read-only** tut (Edit/Write verme); yazma işini parent yapsın — subagent izin prompt'u gösteremez, yazma denemesi reddedilir.

`.claude/agents/researcher.md`:
```markdown
---
name: researcher
description: Kod tabanında "bu nerede / nasıl çalışıyor" araştırması gerektiğinde kullan.
  Çok dosya tarayıp ana bağlama sadece özet döndürür.
tools: Read, Grep, Glob
---
Sen read-only bir kod tabanı araştırmacısısın. Sorulan şeyi bul, ilgili dosya:satır'ları
topla, ÖZET döndür. Kod yazma, değiştirme. Çıktı: bulgular + dosya yolları + kısa açıklama.
```

`.claude/agents/reviewer.md`:
```markdown
---
name: reviewer
description: Diff/PR incelemesi için. Değişiklikleri read-only inceler, sorun listesi döndürür.
tools: Read, Grep, Glob, Bash
---
Sen kıdemli bir reviewer'sın. `review` skill'indeki checklist'i uygula. Sadece incele,
düzeltme yapma. Çıktı: önem sırasına göre bulgular (dosya:satır + neden + öneri).
```

**Ne zaman subagent:** "Auth akışı tüm projede nerede kullanılıyor?" gibi 20 dosya açtıracak araştırma → researcher'a at, ana bağlamın temiz kalsın.

---

## 6. Slash commands (opsiyonel ama güçlü)

`.claude/commands/sprint.md`:
```markdown
Aktif sprint'i başlat. Adımlar:
1. .claude/docs/sprints/ROADMAP.md oku, AKTİF (← işaretli) sprint'i bul.
2. O sprint dosyasını oku (örn. sprint-04.md).
3. Görevleri uygulanabilir bir plana çevir, dokunulacak dosyaları doğrula.
4. Planı bana göster, onay bekle.
5. Onaylayınca: TDD ile uygula, her görevden sonra ilgili testi çalıştır.
Argüman olarak ekstra not verilirse onu da dikkate al: $ARGUMENTS
```

Kullanım: `/sprint` veya `/sprint Meili index batch boyutunu 500 yap`.

---

## 7. Token optimizasyon checklist

- [ ] `CLAUDE.md` < 150 satır, sadece değişmez şeyler
- [ ] Komutlar CLAUDE.md'de yazılı (Claude tahmin etmesin)
- [ ] Tekrar eden "şöyle yaparız" → **skill** (progressive, ucuz)
- [ ] Mimari detay import EDİLMİYOR, gerektiğinde okutuluyor
- [ ] Aktif sprint dışındaki sprint dosyaları okutulmuyor
- [ ] Ağır arama/tarama → **subagent** (izole bağlam)
- [ ] Her sprint = ayrı session, bittiğinde `/clear`
- [ ] Uzun session'da `/compact` ile özetle, kritik noktada `/clear`
- [ ] Plan mode kullan (uygulamadan önce planı gör — yanlış yöne gitmesin)
- [ ] auto memory'i `/memory` ile ara sıra temizle (gürültü birikir)
- [ ] `.gitignore` + Claude'un taramaması gereken dizinler net

---

## 8. ULTIMATE PROMPT'LAR

### 8a. Proje INIT — tüm iskeleti bir kerede üret
> Yeni projede bir kez çalıştır. Boş repo'da veya mevcut repo kökünde.

```
Bu repoyu Claude Code için ultimate şekilde kur. Stack: Laravel 11 + Next.js 14 +
MySQL/Redis, WSL2+Docker, modüler monolit, multi-tenant.

Önce repoyu tara (varsa) ve gerçek komutları/yapıyı tespit et. Bana SADECE
cevaplayamadığın kritik soruları sor (max 3), kalan her şeyde makul varsayım yap ve
varsayımını belirt — onay için durma.

Şunları üret:
1. ./CLAUDE.md — anayasa, <150 satır: stack, gerçek komutlar, değişmez mimari
   kuralları, "her zaman/asla" listesi, conventions.md'ye @import, aktif sprint pointer.
2. .claude/docs/conventions.md — kod stili, isimlendirme, klasör düzeni.
3. .claude/docs/architecture.md — domain haritası (import EDİLMEYECEK, referans).
4. .claude/docs/sprints/ROADMAP.md — bu proje için mantıklı 8-12 sprint, her biri
   bir session'a sığacak, bağımsız ve "done" tanımı net.
5. Her sprint için .claude/docs/sprints/sprint-XX.md — hedef/kapsam(IN-OUT)/görev
   checklist'i/dokunulacak dosyalar/done tanımı.
6. .claude/skills/ — bu stack için 2-3 skill (laravel-feature, review, db-migration),
   her birinde net "ne zaman kullanılır" description'ı.
7. .claude/agents/researcher.md ve reviewer.md — read-only, tools kısıtlı.
8. .claude/commands/sprint.md ve ship.md.

Hepsini gerçekten dosya olarak yaz. Bitince ROADMAP'i ve klasör ağacını özetle.
```

### 8b. Per-session SPRINT — her oturumda bunu yapıştır
> Yeni session → bu prompt. Tek satır.

```
.claude/docs/sprints/ROADMAP.md'deki aktif sprint'i oku, ilgili sprint dosyasını da
oku. Görevleri TDD planına çevir, dokunacağın dosyaları doğrula, planı bana göster ve
onay bekle. Onaylayınca uygula; her görevden sonra ilgili testi çalıştır, geçtiğini
gör. Kapsam (OUT) dışına çıkma. CLAUDE.md'deki "her zaman/asla" kurallarına uy.
```
(Slash command kurduysan: sadece `/sprint`.)

### 8c. Sprint KAPANIŞ — bitince
```
Sprint'i kapat:
1. Tüm testleri çalıştır (backend + frontend), build + typecheck.
2. pint + lint çalıştır.
3. Done tanımındaki her maddeyi tek tek doğrula, sonucu raporla.
4. sprint-XX.md'deki tüm görevleri [x] yap; eksik kaldıysa not düş.
5. ROADMAP.md'de bu sprint'i [x], sonrakini ← AKTİF yap.
6. Anlamlı bir conventional commit mesajı öner (commit'i ben atacağım).
Hiçbir şeyi otomatik push etme.
```

---

## Özet akış
```
İlk gün:   8a (init) → tüm iskelet hazır
Her gün:   yeni session → 8b (/sprint) → çalış → 8c (kapanış) → /clear
Tekrar eden işler zamanla → skill'e taşı
Ağır tarama gerektiğinde → researcher subagent
```
