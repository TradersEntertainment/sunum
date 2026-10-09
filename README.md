# Transform & Conquer — animasyonlu sunum sitesi

CMP3005 · Bölüm 6 (Levitin, *Introduction to the Design & Analysis of Algorithms*) için hazırlanmış, animasyonlu bir sunum sitesi. Ana konu **Heaps & Heapsort**. Bölümün geri kalanı da (presorting, Gauss eliminasyonu, AVL ve 2-3 ağaçları, Horner kuralı, ikili üs alma, probleme indirgeme) kısa ve görsel olarak anlatılıyor. Animasyonlar, İngilizce bilmeyen biri bile fikri takip edebilsin diye tasarlandı. Ekrandaki tüm yazılar tek tuşla **Türkçe ⇄ İngilizce** değişir.

- **Konuşma metni:** [`KONUSMA_METNI.md`](KONUSMA_METNI.md). İngilizce metin ve altında Türkçe çevirisi var; `[▶ CLICK]` işaretleri ne zaman tıklayacağını gösterir. Süre yaklaşık 10,5 dakika. Sonunda olası sorular ve kısa cevaplar da var.
- **Gerçek hayatta kim kullanıyor?** Her tekniğin slaydı, kaynaklarla doğrulanmış bir "Gerçek hayatta · kim kullanıyor?" şeridiyle biter. Heap için ayrı bir slayt var: Linux çekirdeği, PostgreSQL, C++/.NET, Node.js/Go, internet yönlendiricileri, Elasticsearch, ZIP/PNG.
- **Tek dosya sürümü:** `dist/transform-and-conquer.html`. Fontlar ve kodlar içine gömülüdür. USB belleğe atıp internetsiz açabilirsin.

## Slaytlar

| # | Slayt | Gerçek hayatta |
|---|---|---|
| 1–2 | Başlık, ana fikir (dönüştürmenin 3 yolu) | — |
| 3 | Presorting: tüm elemanlar farklı mı? | `sort \| uniq`, PostgreSQL/MySQL `DISTINCT` |
| 4 | Gauss eliminasyonu | TOP500 süper bilgisayarları, NumPy/MATLAB |
| 5–7 | İkili arama ağacı, AVL, 2-3 ağacı | Linux zamanlayıcısı, Java TreeMap; MySQL/PostgreSQL/SQLite indeksleri (B-ağacı) |
| 8–15 | **★ Heap & Heapsort:** tanım, ağaç ⇄ dizi, aşağıdan yukarı kurma, heapsort, analiz, öncelik kuyruğu, **heap'i kim kullanıyor?** | Linux `sort()`, PostgreSQL top-N heapsort, Node.js, OSPF, ZIP/PNG… |
| 16–17 | Horner kuralı, ikili üs alma | Java `hashCode`, `parseInt`; HTTPS/RSA |
| 18–19 | Probleme indirgeme, matris kuvvetiyle yol sayma | makine öğrenmesi, havayolları; sosyal ağlar, PageRank |
| 20–21 | Özet, teşekkürler | — |
| A1–A3 | Ek: heapsort oyun alanı, sıralama alt sınırı, AVL döndürmeleri | — |

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

## Telefon ve tablet

Site telefonda ve tablette de açılır. Dokunmatik ekranlarda altta (geniş ekranlarda sağda) büyük düğmeler çıkar: genel bakış, dil, tema, tam ekran, geri, ileri. Slayta dokunmak ileri gider, sağa/sola kaydırmak geri/ileri götürür. Parmakla yakınlaştırma çalışır; yakınlaştırılmışken kaydırma slayt değiştirmez.

- **Telefonu yatay tutun.** Slayt, 16:9 sabit bir tuvaldir. Dikey telefonda dar bir şerit olarak görünür; site bunu hatırlatan bir ipucu gösterir. Yatayda da yazılar küçüktür (gövde yazısı yaklaşık 9–10 px, iPad yatayda yaklaşık 16 px). Animasyonlar rahat izlenir, ama ayrıntılı yazıları okumak için tablet veya bilgisayar daha iyidir.
- Tam ekran düğmesi, tarayıcı desteklemiyorsa (iPhone Safari) görünmez.
- Test: `NODE_PATH=/opt/node-tools/node_modules node tests/e2e/mobile.js` (8 cihaz boyutunda gerçek dokunma olaylarıyla dener).

## İnternette yayınlamak (isteğe bağlı)

- **GitHub Pages:** Repo'da *Settings → Pages → Build and deployment → Deploy from a branch* yolunu izle, bu dalı ve `/ (root)` klasörünü seç. Birkaç dakika sonra site `https://<kullanıcı>.github.io/<repo>/` adresinde açılır.
- **Tek dosya:** `dist/transform-and-conquer.html` dosyasını herhangi bir yere yükleyebilir ya da e-postayla gönderebilirsin.

## Railway'de yayınlamak

Site tamamen statik: **veritabanı, Volume (kalıcı disk), ortam değişkeni ya da sunucu tarafı veri gerekmez.** Heapsort oyun alanı tarayıcıda çalışır; dil/tema tercihi sadece ziyaretçinin tarayıcısında (localStorage) tutulur. Ölçülen bellek kullanımı yaklaşık **55–65 MB**, bu yüzden kaynak sınırı ayarlamaya gerek yok.

Repo Railway için hazır: `server.js` (sıfır bağımlılıklı küçük statik sunucu: `PORT`'u okur, `0.0.0.0`'a bağlanır, `/healthz` cevaplar), `package.json` içinde `npm start` ve `railway.json` (başlatma komutu + sağlık kontrolü).

1. railway.com → **New Project → Deploy from GitHub repo** → `TradersEntertainment/sunum`. Repo bir organizasyondaysa Railway'in GitHub uygulamasına bu repo için erişim izni verilmiş olmalı. Branch olarak **`main`** seçin (sonradan değiştirmek için Settings → Source → Branch).
2. Hiçbir şey eklemeyin: Database yok, Volume yok, Variables yok. `PORT`'u Railway kendisi verir.
3. **Settings → Networking → Generate Domain**. Birkaç dakika sonra site `https://….up.railway.app` adresinde açılır.
4. Kontrol: `https://….up.railway.app/healthz` → `ok`. Tüm slaytları denemek için: `NODE_PATH=/opt/node-tools/node_modules node tests/e2e/sweep.js --url=https://….up.railway.app/ --langs=en --themes=dark`.

`main`'e her push'ta Railway otomatik yeniden yayınlar. Yerelde denemek için: `npm start` → http://localhost:3000.

Not: Yayınlanan sitede `js/notes.js` (konuşma metni) de herkese açık olur; kaynağı görüntüleyen herkes okuyabilir.

## Geliştirme

```bash
node --test tests/*.test.js            # algoritma testleri (slaytlardaki tablolarla birebir) + sunucu testleri
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
- `server.js`, `railway.json`: yayın (Railway) için statik sunucu ve ayarı.

Kaynak: A. Levitin, *Introduction to the Design & Analysis of Algorithms*, Bölüm 6. Örnekler ve izleme tabloları ders slaytlarındakilerle aynıdır. Animasyonlar ve metinler bu proje için yeniden üretildi. Fontlar SIL Open Font License ile kullanılmaktadır.
