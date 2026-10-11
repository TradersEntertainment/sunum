# Transform & Conquer — animasyonlu sunum sitesi

CMP3005 · Bölüm 6 (Levitin, *Introduction to the Design & Analysis of Algorithms*) için hazırlanmış, animasyonlu bir sunum sitesi. Sunum, bölümün fikrini (önce dönüştür, sonra fethet; 3 yol) bir slaytta anlatır ve en önemli konusuna odaklanır: **Heaps & Heapsort**, toplam **8 slayt**. Bölümün geri kalanı (presorting, Gauss eliminasyonu, AVL ve 2-3 ağaçları, Horner kuralı, ikili üs alma, probleme indirgeme) silinmedi; **yedek slayt** olarak sitede duruyor ve soru gelirse açılıyor. Animasyonlar, İngilizce bilmeyen biri bile fikri takip edebilsin diye tasarlandı. Ekrandaki tüm yazılar tek tuşla **Türkçe ⇄ İngilizce** değişir.

- **Konuşma metni:** [`KONUSMA_METNI.md`](KONUSMA_METNI.md). İngilizce metin ve altında Türkçe çevirisi var; `[▶ CLICK]` işaretleri ne zaman tıklayacağını gösterir. Süre yaklaşık 6,5 dakika (6:26). Dosyanın başında, heap'in Dönüştür ve Fethet ile bağlantısını anlatan "Mantık bir dakikada" kutusu var (sesli okumak için değil, anlamak için). Sonunda yedek slaytların metinleri, olası sorular ve kısa cevaplar da var.
- **Gerçek hayatta kim kullanıyor?** Her tekniğin slaydı, kaynaklarla doğrulanmış bir "Gerçek hayatta · kim kullanıyor?" şeridiyle biter. Heap için ayrı bir slayt var: Linux çekirdeği, PostgreSQL, C++/.NET, Node.js/Go, internet yönlendiricileri, Elasticsearch, ZIP/PNG.
- **Tek dosya sürümü:** `dist/transform-and-conquer.html`. Fontlar ve kodlar içine gömülüdür. USB belleğe atıp internetsiz açabilirsin.

## Slaytlar

Sunum 8 slayttır. Hangi slaytların sunumda olduğunu `js/config.js` içindeki `agenda` listesi belirler.

| # | Slayt | Tıklama | Gerçek hayatta |
|---|---|---|---|
| 1 | Başlık: Transform & Conquer, ★ Heap ve Heapsort | 0 | — |
| 2 | **Fikir: önce dönüştür, sonra fethet** (zor problem → dönüştür → kolay problem → fethet; 3 yol, heap "gösterimi değiştirme" yolunda) | 4 | — |
| 3 | Heap nedir? İki kural (şekil, sıra) | 4 | — |
| 4 | Heap aslında bir dizidir (2j, 2j+1, ⌊j/2⌋) | 4 | — |
| 5 | Heap'i aşağıdan yukarı kurmak | 5 | — |
| 6 | Heapsort: en büyüğü tekrar tekrar çıkar | 4 | — |
| 7 | Heapsort ne kadar hızlı? Θ(n), Θ(n log n), yerinde, kararlı değil | 4 | — |
| 8 | **Gerçek hayatta heap'i kim kullanıyor?** | 3 | Linux `sort()`, PostgreSQL top-N heapsort, C++/.NET, Node.js/Go, OSPF, Elasticsearch, ZIP/PNG |

**Heap ile Dönüştür ve Fethet'in bağlantısı:** heapsort tam olarak bu fikirdir. *Dönüştür* (aşama 1) = diziyi, en büyüğün tepede durduğu bir heap'e çevirmek (gösterimi değiştirme); *fethet* (aşama 2) = artık kolay olan problemi çözmek: en büyüğü tekrar tekrar çıkarmak. Heap slaytlarının başlığında, 2. slayttaki dişli ve bayrakla aynı **Dönüştür › Fethet** etiketleri o slaytın hangi aşama olduğunu gösterir.

**Yedek slaytlar (A1–A16)** sunumun akışında yok; soru gelirse `O` tuşuyla açılır (ya da adrese `#slayt-id` yazılır). Metinleri konuşma dosyalarının sonunda.

| Yedek | Slayt (id) | Gerçek hayatta |
|---|---|---|
| A1 | Presorting: tüm elemanlar farklı mı? (`presorting`) | `sort \| uniq`, PostgreSQL/MySQL `DISTINCT` |
| A2 | Gauss eliminasyonu (`gauss`) | TOP500 süper bilgisayarları, NumPy/MATLAB |
| A3–A5 | İkili arama ağacı, AVL, 2-3 ağacı (`bst-problem`, `avl`, `two-three`) | Linux zamanlayıcısı, Java TreeMap; MySQL/PostgreSQL/SQLite indeksleri (B-ağacı) |
| A6 | Heap bölüm kartı (`heap-intro`) | — |
| A7 | Öncelik kuyruğunun motoru: ekleme yukarı kabarır (`priority-queue`) | — |
| A8–A9 | Horner kuralı, ikili üs alma (`horner`, `binexp`) | Java `hashCode`, `parseInt`; HTTPS/RSA |
| A10–A11 | Probleme indirgeme, matris kuvvetiyle yol sayma (`reduction`, `paths`) | makine öğrenmesi, havayolları; sosyal ağlar, PageRank |
| A12–A13 | Özet, teşekkürler (`summary`, `thanks`) | — |
| A14–A16 | Heapsort oyun alanı, sıralama alt sınırı, AVL döndürmeleri (`playground`, `sort-bound`, `avl-rotations`) | — |

**Sunumdaki slaytları değiştirmek:** `js/config.js` içindeki `agenda` listesini düzenle (tüm id'ler dosyada yazıyor). Yedek bir slaytı sunuma almak için id'sini listeye ekle, çıkarmak için sil; `agenda: null` bölümün tamamını açar (21 slayt, ~10 dakika). Sonra konuşma dosyalarını yeniden üret: `NODE_PATH=/opt/node-tools/node_modules node tools/build-speech.js`. Sunumun son slaytından sonra `→` yedek slaytlara geçmez, yanlışlıkla yedeğe düşmezsin.

## Açmak

1. Klasördeki **`index.html`** dosyasına çift tıkla. Chrome, Edge veya Firefox'ta açılır, internet gerekmez.
2. `F` ile tam ekran yap. `→` (ya da sunum kumandası) ile ilerle.

## Tuşlar

| Tuş | Ne yapar |
|---|---|
| `→` `Space` `PageDown`, tıklama | Sonraki animasyon / slayt |
| `←` `PageUp` | Bir adım geri (o adımın durumu birebir geri gelir) |
| `Home` / `End` | Sunumun ilk / son slaytı |
| `O` | Tüm slaytlara genel bakış (tıkla, git); yedek slaytlar altta ayrı bölümde |
| `L` | İngilizce ⇄ Türkçe |
| `T` | Koyu ⇄ açık tema (ışıklı sınıfta açık tema daha okunaklı olabilir) |
| `F` | Tam ekran |
| `N` | Konuşma notları (alt panel, prova için) |
| `S` | **Sunucu penceresi**: notlar, süre sayacı, "sonraki tıklama" ipucu |
| `B` veya `.` | Ekranı karart |
| `-` / `+` | Animasyon hızını azalt / artır |
| sayı + `Enter` | O numaralı slayta git (ör. `5` `Enter`) |
| `?` | Yardım |

Animasyon oynarken `→`'ye basarsan animasyon hemen tamamlanır, sonraki basış ilerler; PowerPoint'teki gibi.

## Sunum günü için ipuçları

- **İki ekranla:** Projeksiyonu "genişlet" (extend) moduna al. Sunumu projeksiyon ekranında `F` ile tam ekran yap, sonra `S` ile açılan sunucu penceresini laptop ekranına taşı. Kumanda veya ok tuşları hangi pencere seçiliyse onu yönetir, sunucu penceresi de sunumu ilerletir.
- **Tek ekranla:** Prova ederken `N` notları gösterir. Sunumda kapat.
- Yanlışlıkla sayfayı yenilersen (F5) sunum aynı slayt ve adımda açılır.
- Soru gelirse **yedek slaytlar** var: `O` tuşuna bas, kartı seç. Örneğin `heapsort oyun alanı` (A14) interaktif: kendi sayılarını yazıp adım adım izleyebilirsin.
- Başlık slaytında adının görünmesi için `js/config.js` içindeki `presenter: ''` satırına adını yaz.

## İki kişi sunuyorsanız

Konuşma metni hem iki kişiye hem iki dile ayrılmış durumda (düz metin, UTF-8; telefonda da açılır). İngilizce dosya sesli söyleyeceğin metindir, Türkçe dosya aynı metnin anlamıdır; slayt sırası ve tıklama işaretleri ikisinde de aynıdır.

| Kişi | Slaytlar | İngilizce (söyleyeceğin) | Türkçe (anlamı) | Süre |
|---|---|---|---|---|
| 1. kişi | 1–4: başlık, fikir (dönüştür, fethet), heap nedir, heap bir dizidir | `KONUSMA_BOLUM_1_EN.txt` | `KONUSMA_BOLUM_1_TR.txt` | ~2:55 |
| 2. kişi | 5–8: heap'i kurmak, heapsort, ne kadar hızlı, gerçek hayatta heap | `KONUSMA_BOLUM_2_EN.txt` | `KONUSMA_BOLUM_2_TR.txt` | ~3:31 |

Her dosyada kendi zaman planı, devir teslim cümleleri, kendi konularına ait olası sorular ve yedek slaytların metinleri var. Bölüm 1 devir teslim cümlesiyle biter, Bölüm 2 "Teşekkürler, buradan ben devam ediyorum" cümlesiyle başlar. Yedek slaytlar konularına göre dağıtıldı: heap'ten önceki bölüm konuları (presorting, Gauss, ağaçlar, sıralama alt sınırı) ve heap bölüm kartı 1. kişide; sonrakiler (öncelik kuyruğu, Horner, üs alma, indirgeme, özet, teşekkür) ve oyun alanı 2. kişide. Tüm konuşma iki dilde tek dosyada da var: `KONUSMA_METNI.md`.

Bölme noktası varsayılan olarak iki kişinin süresini eşitler (yukarıdaki tablo). Değiştirmek için ikinci kişinin ilk slaytının id'sini verin. Örneğin 1. kişi sadece başlık ve fikir slaytını anlatsın (~1:15), 2. kişi heap'in tanımından itibaren devam etsin istersen:

```bash
NODE_PATH=/opt/node-tools/node_modules node tools/build-speech.js --split=heap-def
```

Sunumdaki slayt id'leri: `title, big-idea, heap-def, heap-array, heap-build, heapsort, heap-analysis, heap-real`.

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
NODE_PATH=/opt/node-tools/node_modules node tests/e2e/sweep.js   # tüm slayt ve adımlar (yedekler dahil): hata, taşma, ileri/geri tutarlılığı
NODE_PATH=/opt/node-tools/node_modules node tests/e2e/agenda.js  # sunum = agenda, yedek slaytlar, son slaytta durma
NODE_PATH=/opt/node-tools/node_modules node tests/e2e/mobile.js  # telefon ve tablet ölçüleri, dokunma, kaydırma
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
- `js/config.js`: adın, ders bilgisi ve `agenda` (sunumdaki slaytlar).
- `js/slides/`: tüm slaytlar (sunuma `agenda` ile seçilir).
- `js/notes.js`: konuşma metni.
- `docs/AUTHORING.md`: yeni slayt yazma kuralları.
- `server.js`, `railway.json`: yayın (Railway) için statik sunucu ve ayarı.

Kaynak: A. Levitin, *Introduction to the Design & Analysis of Algorithms*, Bölüm 6. Örnekler ve izleme tabloları ders slaytlarındakilerle aynıdır. Animasyonlar ve metinler bu proje için yeniden üretildi. Fontlar SIL Open Font License ile kullanılmaktadır.
