# Sprint 02 — Trend grafikleri + fotoğraf + before/after

## Hedef
Ölçümlerin zaman içindeki değişimini grafikle göster; poz fotoğrafları ekle/sakla; iki fotoğrafı karşılaştır.

## Görevler
- [x] Sekmeli navigasyon: Ölçümler / Grafikler / Fotoğraflar
- [x] recharts ile trend grafiği (metrik seçici: kilo, yağ%, kas, BMI, su%, BMR...)
- [x] `photos` SQLite tablosu + CRUD
- [x] Fotoğraf ekleme: dosya seçici (main dialog) + userData/photos'a kopyalama
- [x] Güvenli yerel gösterim: `spor-photo://` özel protokol + CSP
- [x] Galeri + poz/tarih etiketleri + silme
- [x] Before/after karşılaştırma (iki seçim yan yana)
- [x] 16.03.2026 referans ölçümü eklendi (seedBaseline tarih-bazlı, tekrarlamaz)
- [x] typecheck + build yeşil, runtime doğrulandı (grafik + foto ekranda)

## Done tanımı
- Grafik 2+ ölçümle çiziliyor (kullanıcı ekranında doğrulandı). ✓
- Fotoğraf ekleniyor, galeride görünüyor, karşılaştırılıyor. ✓
