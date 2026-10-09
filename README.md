# Transform & Conquer — animasyonlu sunum sitesi

CMP3005 · Bölüm 6 (Levitin, *Introduction to the Design & Analysis of Algorithms*) için hazırlanmış, animasyonlu bir sunum sitesi. Ana konu **Heaps & Heapsort**. Bölümün geri kalanı da (presorting, Gauss eliminasyonu, AVL ve 2-3 ağaçları, Horner kuralı, ikili üs alma, probleme indirgeme) kısa ve görsel olarak anlatılıyor. Animasyonlar, İngilizce bilmeyen biri bile fikri takip edebilsin diye tasarlandı. Ekrandaki tüm yazılar tek tuşla **Türkçe ⇄ İngilizce** değişir.

- **Konuşma metni:** [`KONUSMA_METNI.md`](KONUSMA_METNI.md). İngilizce metin ve altında Türkçe çevirisi var; `[▶ CLICK]` işaretleri ne zaman tıklayacağını gösterir. Süre yaklaşık 10 dakika.
- **Tek dosya sürümü:** `dist/transform-and-conquer.html`. Fontlar ve kodlar içine gömülüdür. USB belleğe atıp internetsiz açabilirsin.

## Açmak

1. Klasördeki **`index.html`** dosyasına çift tıkla. Chrome, Edge veya Firefox'ta açılır, internet gerekmez.
2. `F` ile tam ekran yap. `→` (ya da sunum kumandası) ile ilerle.

## Tuşlar

| Tuş | Ne yapar |
|---|---|
| `→` `Space` `PageDown`, tıklama | Sonraki animasyon / slayt |
| `←` `PageUp` | Bir adım geri (o adımın durumu birebir geri gelir) |
| `Home` / `End` | İlk / son slayt |
| `O` | Tüm slaytlara genel bakış (tıkla, git) |
| `L` | İngilizce ⇄ Türkçe |
| `T` | Koyu ⇄ açık tema (ışıklı sınıfta açık tema daha okunaklı olabilir) |
| `F` | Tam ekran |
| `N` | Konuşma notları (alt panel, prova için) |
| `S` | **Sunucu penceresi**: notlar, süre sayacı, "sonraki tıklama" ipucu |
| `B` veya `.` | Ekranı karart |
| `-` / `+` | Animasyon hızını azalt / artır |
| sayı + `Enter` | O numaralı slayta git (ör. `1` `2` `Enter`) |
| `?` | Yardım |

Animasyon oynarken `→`'ye basarsan animasyon hemen tamamlanır, sonraki basış ilerler; PowerPoint'teki gibi.

## Sunum günü için ipuçları

- **İki ekranla:** Projeksiyonu "genişlet" (extend) moduna al. Sunumu projeksiyon ekranında `F` ile tam ekran yap, sonra `S` ile açılan sunucu penceresini laptop ekranına taşı. Kumanda veya ok tuşları hangi pencere seçiliyse onu yönetir, sunucu penceresi de sunumu ilerletir.
- **Tek ekranla:** Prova ederken `N` notları gösterir. Sunumda kapat.
- Yanlışlıkla sayfayı yenilersen (F5) sunum aynı slayt ve adımda açılır.
- Sondaki **Ek** slaytlarında, soru gelirse kullanabileceğin interaktif bir **heapsort oyun alanı** var: kendi sayılarını yazıp adım adım izleyebilirsin.
- Başlık slaytında adının görünmesi için `js/config.js` içindeki `presenter: ''` satırına adını yaz.

## İnternette yayınlamak (isteğe bağlı)

- **GitHub Pages:** Repo'da *Settings → Pages → Build and deployment → Deploy from a branch* yolunu izle, bu dalı ve `/ (root)` klasörünü seç. Birkaç dakika sonra site `https://<kullanıcı>.github.io/<repo>/` adresinde açılır.
- **Tek dosya:** `dist/transform-and-conquer.html` dosyasını herhangi bir yere yükleyebilir ya da e-postayla gönderebilirsin.

## Geliştirme

```bash
node --test tests/*.test.js            # algoritma testleri (slaytlardaki tablolarla birebir)
NODE_PATH=/opt/node-tools/node_modules node tests/e2e/sweep.js   # tüm slayt ve adımlar: hata, taşma, ileri/geri tutarlılığı
NODE_PATH=/opt/node-tools/node_modules node tools/shots.js --ids=heap-build --steps=all --out=artifacts/shots
NODE_PATH=/opt/node-tools/node_modules node tools/build-speech.js  # KONUSMA_METNI.md'yi js/notes.js'ten üretir
node tools/bundle.js                   # dist/ altına tek dosyalık sürüm
python3 tools/fetch_fonts.py           # fontları yeniden indirir (gerekmedikçe çalıştırma)
```

Yapı:

- `index.html`: sahne ve script sırası.
- `js/core/`: animasyon motoru (`anim.js`), slayt motoru (`deck.js`), dil, efektler, sunucu penceresi.
- `js/algo/`: algoritmalar. Saf fonksiyonlardır ve olay listesi üretirler. `tests/` ile test edilir.
- `js/viz/`: görsel bileşenler (heap sahnesi, ağaçlar, matris, sözde kod paneli).
- `js/slides/`: slaytlar, sunum sırasıyla.
- `js/notes.js`: konuşma metni.
- `docs/AUTHORING.md`: yeni slayt yazma kuralları.

Kaynak: A. Levitin, *Introduction to the Design & Analysis of Algorithms*, Bölüm 6. Örnekler ve izleme tabloları ders slaytlarındakilerle aynıdır. Animasyonlar ve metinler bu proje için yeniden üretildi. Fontlar SIL Open Font License ile kullanılmaktadır.
