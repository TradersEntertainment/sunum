# Transform & Conquer — Konuşma Metni

> **Süre:** yaklaşık 10:24 dakika · **Ana konu:** Heaps & Heapsort · **Konuşma dili:** İngilizce (her bölümün altındaki Türkçe metin, ne söylediğini anlaman için)

## Nasıl kullanılır

- Sunumu aç: `index.html` dosyasına çift tıkla (internet gerekmez). `F` ile tam ekran yap.
- Metindeki her **[▶ CLICK]** / **[▶ TIKLA]** işareti = bir kez `→` (ya da sunum kumandasındaki ileri tuşu). O anda ekranda bir animasyon oynar.
- Animasyon oynarken tekrar basarsan animasyon hemen tamamlanır; yanlışlıkla ileri gittiysen `←` ile bir adım geri dön.
- `S`: sunucu penceresi. Bu metin, süre sayacı ve "sonraki tıklama" ipucu orada görünür; ikinci ekranda (laptop) aç, sunum projeksiyonda kalsın. Tek ekranda `N` notları altta gösterir.
- `L`: ekrandaki yazıları Türkçe ⇄ İngilizce yapar. Soru-cevapta Türkçe açıklamak istersen kullan.
- Konuşma yavaş ve net olsun: dakikada ~120 kelime. Animasyonlar zaten anlatıyor, acele etme.
- İki kişi sunuyorsanız her birinin kendi dosyaları var, dil dil ayrı: `KONUSMA_BOLUM_1_EN.txt` / `KONUSMA_BOLUM_1_TR.txt` ve `KONUSMA_BOLUM_2_EN.txt` / `KONUSMA_BOLUM_2_TR.txt` (devir teslim cümleleri ve kendi soruları dahil).

## Zaman planı

| # | Slayt | Tıklama | Süre | Başlangıç |
|---|---|---|---|---|
| 1 | Transform & Conquer | 0 | 0:13 | 0:00 |
| 2 | The idea: transform, then conquer | 4 | 0:30 | 0:13 |
| 3 | Presorting: are all elements distinct? | 4 | 0:34 | 0:43 |
| 4 | Gaussian elimination: make it triangular | 6 | 0:34 | 1:17 |
| 5 | Binary search trees: shape decides speed | 3 | 0:22 | 1:51 |
| 6 | AVL trees: rotate to stay balanced | 5 | 0:32 | 2:13 |
| 7 | 2-3 trees: a full node splits in two | 5 | 0:30 | 2:45 |
| 8 | Heaps & Heapsort | 0 | 0:12 | 3:15 |
| 9 | What is a heap? Two rules | 4 | 0:40 | 3:27 |
| 10 | A heap is secretly an array | 4 | 0:36 | 4:07 |
| 11 | Building a heap bottom-up | 5 | 0:50 | 4:43 |
| 12 | Heapsort: remove the max, again and again | 4 | 0:50 | 5:33 |
| 13 | How fast is heapsort? | 4 | 0:36 | 6:23 |
| 14 | Heaps power priority queues | 3 | 0:28 | 6:59 |
| 15 | Real world: who uses heaps? | 3 | 0:45 | 7:27 |
| 16 | Horner’s rule: fewer multiplications | 4 | 0:28 | 8:12 |
| 17 | Binary exponentiation: aⁿ by squaring | 3 | 0:26 | 8:40 |
| 18 | Reduce to a problem you can already solve | 4 | 0:28 | 9:06 |
| 19 | Counting paths = multiplying matrices | 4 | 0:25 | 9:34 |
| 20 | Three ways to transform, then conquer | 2 | 0:20 | 9:59 |
| 21 | Thank you! Questions? | 0 | 0:05 | 10:19 |
| | **Toplam** | | **10:24** | |

---

## 1 · Transform & Conquer
*Dönüştür ve Fethet* · Transform & Conquer / Dönüştür ve Fethet · **0:00 → 0:13** · 0 tıklama

**EN — söyleyeceğin:**

Hello everyone. Today’s topic is Chapter 6: **Transform and Conquer**. The idea: when a problem is hard, first change it into an easier one, then solve it.

**TR — anlamı:**

> Herkese merhaba. Bugünkü konum Bölüm 6: **Dönüştür ve Fethet**. Fikir şu: bir problem zorsa önce onu daha kolay bir probleme dönüştür, sonra çöz.

---

## 2 · The idea: transform, then conquer
*Fikir: önce dönüştür, sonra fethet* · Transform & Conquer / Dönüştür ve Fethet · **0:13 → 0:43** · 4 tıklama

**Tıklamalar:** (1) Pipeline: transform → conquer · (2) Way 1: instance simplification · (3) Way 2: representation change · (4) Way 3: problem reduction

**EN — söyleyeceğin:**

**[▶ CLICK]** We transform the problem into an easier one, then conquer it.

**[▶ CLICK]** There are three ways. One: **instance simplification**, the same problem with a simpler instance, like a sorted list. **[▶ CLICK]** Two: **representation change**, the same data in a different form, like an array seen as a tree. **[▶ CLICK]** Three: **problem reduction**, turning it into a problem we can already solve, like lcm through gcd.

**TR — anlamı:**

> **[▶ TIKLA]** Problemi daha kolay bir probleme dönüştürür, sonra onu fethederiz.
>
> **[▶ TIKLA]** Bunun üç yolu var. Bir: **örneği basitleştirme**; aynı problem, daha basit bir örnek, mesela sıralı bir liste. **[▶ TIKLA]** İki: **gösterimi değiştirme**; aynı veri, farklı bir biçimde, mesela ağaç gibi okunan bir dizi. **[▶ TIKLA]** Üç: **probleme indirgeme**; onu zaten çözebildiğimiz bir probleme çevirmek, mesela gcd ile lcm hesaplamak.

---

## 3 · Presorting: are all elements distinct?
*Ön sıralama: tüm elemanlar farklı mı?* · Instance simplification / Örneği basitleştirme · **0:43 → 1:17** · 4 tıklama

**Tıklamalar:** (1) Brute force: compare every pair · (2) Presort, then compare neighbours · (3) n = 1,000,000: 5·10¹¹ vs 2·10⁷ · (4) Real world: sort | uniq, databases

**EN — söyleyeceğin:**

Example one: are all elements distinct? **[▶ CLICK]** Brute force compares every pair, up to n²/2 comparisons. **[▶ CLICK]** Presorting: sort first, then compare only neighbours, because duplicates end up side by side. That is n log n.

**[▶ CLICK]** For a million elements: 500 billion comparisons versus 20 million. Minutes versus a blink.

**[▶ CLICK]** In real life, the Unix pipeline sort | uniq works exactly like this, and so do databases for DISTINCT and GROUP BY.

**TR — anlamı:**

> Birinci örnek: tüm elemanlar farklı mı? **[▶ TIKLA]** Kaba kuvvet her çifti karşılaştırır, n²/2’ye kadar karşılaştırma. **[▶ TIKLA]** Önceden sıralama: önce sırala, sonra sadece komşuları karşılaştır, çünkü tekrarlar yan yana gelir. Bu n log n.
>
> **[▶ TIKLA]** Bir milyon eleman için: 500 milyar karşılaştırmaya karşı 20 milyon. Dakikalar ve göz açıp kapayıncaya kadar.
>
> **[▶ TIKLA]** Gerçek hayatta Unix’teki sort | uniq tam olarak böyle çalışır; veritabanları da DISTINCT ve GROUP BY için aynısını yapar.

---

## 4 · Gaussian elimination: make it triangular
*Gauss eliminasyonu: üçgen hâline getir* · Instance simplification / Örneği basitleştirme · **1:17 → 1:51** · 6 tıklama

**Tıklamalar:** (1) R₂ − 3/2·R₁ · (2) R₃ − 1/2·R₁ · (3) R₃ − 3/5·R₂ → triangle, Θ(n³) · (4) Back substitution: x = 2, 1, 6 · (5) Check ✓ · (6) Real world: NumPy/MATLAB, TOP500

**EN — söyleyeceğin:**

Example two: Gaussian elimination turns a system of equations into a triangle. **[▶ CLICK]** Row two minus 3/2 of row one: a zero. **[▶ CLICK]** Row three, the same. **[▶ CLICK]** One more step, and the matrix is triangular. This costs n³.

**[▶ CLICK]** Now we solve bottom-up: x₃ = 6, x₂ = 1, x₁ = 2. **[▶ CLICK]** They check out.

**[▶ CLICK]** In real life, NumPy and MATLAB solve systems this way, and the TOP500 supercomputers are ranked by how fast they do it.

**TR — anlamı:**

> İkinci örnek: Gauss eliminasyonu bir denklem sistemini üçgene çevirir. **[▶ TIKLA]** İkinci satırdan birinci satırın 3/2’si çıkar: bir sıfır. **[▶ TIKLA]** Üçüncü satıra da aynısı. **[▶ TIKLA]** Bir adım daha ve matris üst üçgen oldu. Bunun maliyeti n³.
>
> **[▶ TIKLA]** Şimdi aşağıdan yukarı çözüyoruz: x₃ = 6, x₂ = 1, x₁ = 2. **[▶ TIKLA]** Yerine koyunca hepsi tutuyor.
>
> **[▶ TIKLA]** Gerçek hayatta NumPy ve MATLAB sistemleri böyle çözer; TOP500 listesindeki süper bilgisayarlar da bunu ne kadar hızlı yaptıklarına göre sıralanır.

---

## 5 · Binary search trees: shape decides speed
*İkili arama ağacı: hızı şekil belirler* · Instance simplification / Örneği basitleştirme · **1:51 → 2:13** · 3 tıklama

**Tıklamalar:** (1) A bushy BST: fast · (2) Sorted keys → a stick, O(n) · (3) Two fixes: balance (AVL) / more keys per node (2-3)

**EN — söyleyeceğin:**

Now search trees. **[▶ CLICK]** A binary search tree is fast when it is bushy. **[▶ CLICK]** But if the keys arrive already sorted, it becomes a stick: search costs O(n).

**[▶ CLICK]** Two fixes: keep it balanced, like AVL trees, or put more keys in a node, like 2-3 trees.

**TR — anlamı:**

> Şimdi arama ağaçları. **[▶ TIKLA]** İkili arama ağacı gür olduğunda hızlıdır. **[▶ TIKLA]** Ama anahtarlar zaten sıralı gelirse bir çubuğa dönüşür: arama O(n) olur.
>
> **[▶ TIKLA]** İki çözüm var: ağacı dengeli tutmak, AVL ağaçları gibi, ya da bir düğüme daha çok anahtar koymak, 2-3 ağaçları gibi.

---

## 6 · AVL trees: rotate to stay balanced
*AVL ağaçları: dengede kalmak için döndür* · Instance simplification / Örneği basitleştirme · **2:13 → 2:45** · 5 tıklama

**Tıklamalar:** (1) Insert 5, 6, 8 → L(5) · (2) Insert 3, 2 → R(5) · (3) Insert 4 → LR(6) · (4) Insert 7 → RL(6): balanced and sorted · (5) Real world: Linux scheduler, TreeMap

**EN — söyleyeceğin:**

An AVL tree keeps every balance factor at −1, 0 or 1. We insert 5, 6, 8, 3, 2, 4, 7. **[▶ CLICK]** After 8, node 5 tips over: one left rotation. **[▶ CLICK]** After 2: a right rotation. **[▶ CLICK]** After 4: a double rotation. **[▶ CLICK]** After 7: another double one. Balanced, and still sorted.

**[▶ CLICK]** In real life, the Linux CPU scheduler and Java’s TreeMap use red-black trees, the AVL tree’s cousin.

**TR — anlamı:**

> AVL ağacı her düğümün denge faktörünü −1, 0 veya 1’de tutar. 5, 6, 8, 3, 2, 4, 7 ekliyoruz. **[▶ TIKLA]** 8’den sonra 5 dengesini kaybediyor: bir sola döndürme. **[▶ TIKLA]** 2’den sonra: sağa döndürme. **[▶ TIKLA]** 4’ten sonra: çift döndürme. **[▶ TIKLA]** 7’den sonra bir çift döndürme daha. Dengeli ve hâlâ sıralı.
>
> **[▶ TIKLA]** Gerçek hayatta Linux’un işlemci zamanlayıcısı ve Java’nın TreeMap’i, AVL’nin kuzeni olan red-black ağaçlarını kullanır.

---

## 7 · 2-3 trees: a full node splits in two
*2-3 ağaçları: dolan düğüm ikiye bölünür* · Representation change / Gösterimi değiştirme · **2:45 → 3:15** · 5 tıklama

**Tıklamalar:** (1) 9, 5, 8 → split, 8 moves up · (2) Small nodes absorb keys · (3) Splits climb to the root · (4) All leaves on one level: Θ(log n) · (5) Real world: database indexes, file systems

**EN — söyleyeceğin:**

2-3 trees take the other road: a node holds one or two keys. **[▶ CLICK]** Three keys? The node splits, and the middle key moves up. **[▶ CLICK]** Small nodes just absorb keys. **[▶ CLICK]** Splits can climb to the root: the tree grows only at the top. **[▶ CLICK]** So all leaves stay on one level: log n.

**[▶ CLICK]** In real life, every index in MySQL, PostgreSQL and SQLite is a B-tree: a 2-3 tree with hundreds of keys per node.

**TR — anlamı:**

> 2-3 ağaçları diğer yolu seçer: bir düğüm bir ya da iki anahtar tutar. **[▶ TIKLA]** Üç anahtar mı oldu? Düğüm bölünür, ortadaki anahtar yukarı çıkar. **[▶ TIKLA]** Küçük düğümler anahtarları kolayca alır. **[▶ TIKLA]** Bölünmeler köke kadar tırmanabilir: ağaç sadece tepeden büyür. **[▶ TIKLA]** Böylece tüm yapraklar aynı seviyede kalır: log n.
>
> **[▶ TIKLA]** Gerçek hayatta MySQL, PostgreSQL ve SQLite’taki her indeks bir B-ağacıdır: düğüm başına yüzlerce anahtar tutan bir 2-3 ağacı.

---

## 8 · Heaps & Heapsort
*Heap ve Heapsort* · Heaps & Heapsort / Heap ve Heapsort · **3:15 → 3:27** · 0 tıklama

**EN — söyleyeceğin:**

Now the star of this chapter: **heaps and heapsort**. We **think** of the keys as a tree, but **store** them in a simple array.

**TR — anlamı:**

> Şimdi bölümün yıldızı: **heap ve heapsort**. Anahtarları bir ağaç gibi **düşünüyor**, ama basit bir dizide **saklıyoruz**.

---

## 9 · What is a heap? Two rules
*Heap nedir? İki kural* · Heaps & Heapsort / Heap ve Heapsort · **3:27 → 4:07** · 4 tıklama

**Tıklamalar:** (1) Rule 1: shape (slots fill in order) · (2) Rule 2: parent ≥ children · (3) Paths go down; no left-right order · (4) Heap or not? ✓ ✗ ✗

**EN — söyleyeceğin:**

A heap is a binary tree with two rules. **[▶ CLICK]** Rule one, **shape**: we fill the tree level by level, left to right. Only the last level can have gaps, and only on the right.

**[▶ CLICK]** Rule two, **order**: every parent is greater than or equal to its children. That is a max-heap.

**[▶ CLICK]** So keys decrease along every path down. But there is no left-to-right order: 8 is lower, yet bigger than 4.

**[▶ CLICK]** Quick check: the first tree is a heap. The second has a hole in its shape. The third breaks the order: 6 is bigger than its parent 5.

**TR — anlamı:**

> Heap, iki kurala uyan bir ikili ağaçtır. **[▶ TIKLA]** Birinci kural, **şekil**: ağacı seviye seviye, soldan sağa doldururuz. Sadece son seviyede boşluk olabilir, o da sadece sağda.
>
> **[▶ TIKLA]** İkinci kural, **sıra**: her ebeveyn çocuklarından büyük ya da eşittir. Buna max-heap denir.
>
> **[▶ TIKLA]** Yani kökten aşağı her yolda anahtarlar azalır. Ama soldan sağa bir sıra yoktur: 8 daha aşağıda, ama 4’ten büyük.
>
> **[▶ TIKLA]** Hızlı kontrol: ilk ağaç bir heap. İkincisinin şeklinde boşluk var. Üçüncüsü sırayı bozuyor: 6, ebeveyni 5’ten büyük.

---

## 10 · A heap is secretly an array
*Heap aslında bir dizidir* · Heaps & Heapsort / Heap ve Heapsort · **4:07 → 4:43** · 4 tıklama

**Tıklamalar:** (1) Number the nodes, fly them into the array · (2) Children of j: 2j, 2j+1 · (3) Parent of j: ⌊j/2⌋ · (4) Parents first, max at H[1]

**EN — söyleyeceğin:**

Here is the trick. **[▶ CLICK]** We number the nodes top-down, left to right, and simply put them into an array. No pointers at all.

**[▶ CLICK]** For the node at position j, the children are at **2j** and **2j + 1**. For j = 2, that is 4 and 5.

**[▶ CLICK]** And the parent of j is at **j divided by 2, rounded down**. Five divided by two is two.

**[▶ CLICK]** So the parents fill the first half of the array, and the maximum is always at position one.

**TR — anlamı:**

> İşin püf noktası şu. **[▶ TIKLA]** Düğümleri yukarıdan aşağı, soldan sağa numaralandırıp doğrudan bir diziye koyuyoruz. Hiç işaretçi (pointer) yok.
>
> **[▶ TIKLA]** j konumundaki düğümün çocukları **2j** ve **2j + 1** konumlarındadır. j = 2 için bunlar 4 ve 5.
>
> **[▶ TIKLA]** j’nin ebeveyni ise **j bölü 2’nin aşağı yuvarlanmışıdır**. 5 bölü 2, 2 eder.
>
> **[▶ TIKLA]** Böylece ebeveynler dizinin ilk yarısını doldurur ve en büyük eleman her zaman 1. konumdadır.

---

## 11 · Building a heap bottom-up
*Heap’i aşağıdan yukarı kurmak* · Heaps & Heapsort / Heap ve Heapsort · **4:43 → 5:33** · 5 tıklama

**Tıklamalar:** (1) Parent 7: swap with 8 · (2) Parent 9: already OK ✓ · (3) Root 2: swap with 9 · (4) 2 keeps sinking: swap with 6 · (5) Done: heap 9 6 8 2 5 7

**EN — söyleyeceğin:**

To build a heap, we go **bottom-up**: start at the last parent, fix its subtree, and move back toward the root. Our list: 2, 9, 7, 6, 5, 8.

**[▶ CLICK]** The last parent is 7. Its bigger child is 8, so they swap. **[▶ CLICK]** Next is 9. It is already bigger than its children: nothing to do.

**[▶ CLICK]** Now the root, 2. Its bigger child is 9: swap. **[▶ CLICK]** 2 is still too small, so it keeps sinking: it swaps with 6 and reaches a leaf.

**[▶ CLICK]** Done: a heap, with the maximum, 9, at the root. The table matches our lecture slides.

**TR — anlamı:**

> Heap’i kurmak için **aşağıdan yukarı** gideriz: son ebeveynden başla, alt ağacını düzelt ve köke doğru geri gel. Listemiz: 2, 9, 7, 6, 5, 8.
>
> **[▶ TIKLA]** Son ebeveyn 7. Büyük çocuğu 8, o yüzden yer değiştirirler. **[▶ TIKLA]** Sırada 9 var. Zaten çocuklarından büyük: bir şey yapmaya gerek yok.
>
> **[▶ TIKLA]** Şimdi kök, yani 2. Büyük çocuğu 9: yer değiştir. **[▶ TIKLA]** 2 hâlâ çok küçük, batmaya devam ediyor: 6 ile yer değiştirip bir yaprağa ulaşıyor.
>
> **[▶ TIKLA]** Bitti: bir heap, en büyük eleman 9 kökte. Tablo, ders slaytlarımızdakiyle aynı.

---

## 12 · Heapsort: remove the max, again and again
*Heapsort: en büyüğü tekrar tekrar çıkar* · Heaps & Heapsort / Heap ve Heapsort · **5:33 → 6:23** · 4 tıklama

**Tıklamalar:** (1) Swap root 9 with last; lock 9 · (2) Sift 7 down (swap with 8) · (3) Autoplay the remaining removals · (4) Sorted: 2 5 6 7 8 9

**EN — söyleyeceğin:**

Heapsort: stage one builds the heap, which we just did. Stage two removes the maximum again and again.

**[▶ CLICK]** Swap the root with the last key. Now 9 is in its final place, so we lock it, and the heap shrinks by one.

**[▶ CLICK]** The new root, 7, is too small, so we sift it down: it swaps with its bigger child, 8. The heap is fixed again.

**[▶ CLICK]** We repeat the same two moves: swap the max to the end, then sift down. Watch the sorted part grow on the right.

**[▶ CLICK]** And the array is sorted: 2, 5, 6, 7, 8, 9. Notice that we never needed a second array.

**TR — anlamı:**

> Heapsort: birinci aşama heap’i kurar, bunu az önce yaptık. İkinci aşama en büyük elemanı tekrar tekrar çıkarır.
>
> **[▶ TIKLA]** Kökü son anahtarla değiştir. Artık 9 son yerinde, onu kilitliyoruz ve heap bir eleman küçülüyor.
>
> **[▶ TIKLA]** Yeni kök 7 çok küçük, onu aşağı itiyoruz: büyük çocuğu 8 ile yer değiştiriyor. Heap yine düzgün.
>
> **[▶ TIKLA]** Aynı iki hamleyi tekrarlıyoruz: en büyüğü sona taşı, sonra aşağı it. Sağda sıralı kısmın büyüdüğüne bakın.
>
> **[▶ TIKLA]** Ve dizi sıralandı: 2, 5, 6, 7, 8, 9. Dikkat edin, hiç ikinci bir diziye ihtiyacımız olmadı.

---

## 13 · How fast is heapsort?
*Heapsort ne kadar hızlı?* · Heaps & Heapsort / Heap ve Heapsort · **6:23 → 6:59** · 4 tıklama

**Tıklamalar:** (1) Build = Θ(n): work per level · (2) Sort = Θ(n log n) · (3) Total Θ(n log n), in-place ✓ · (4) Not stable ✗ (1a 1b → 1b 1a)

**EN — söyleyeceğin:**

How fast is it? **[▶ CLICK]** Building the heap is **linear**. Most nodes are near the bottom and can only sink a little. For 15 keys that is at most 22 comparisons, less than 2n.

**[▶ CLICK]** Sorting does n − 1 removals, and each costs at most about 2 log n comparisons. So that part is **n log n**.

**[▶ CLICK]** In total, heapsort is n log n in the worst case and on average, and it works in place.

**[▶ CLICK]** One weakness: it is **not stable**. Two equal keys can change their order.

**TR — anlamı:**

> Peki ne kadar hızlı? **[▶ TIKLA]** Heap’i kurmak **doğrusal** zaman alır. Düğümlerin çoğu en altta ve sadece biraz batabilir. 15 anahtar için en fazla 22 karşılaştırma, yani 2n’den az.
>
> **[▶ TIKLA]** Sıralama n − 1 kez kök çıkarır, her biri en fazla yaklaşık 2 log n karşılaştırma. Yani bu kısım **n log n**.
>
> **[▶ TIKLA]** Toplamda heapsort hem en kötü hem ortalama durumda n log n’dir ve yerinde (in-place) çalışır.
>
> **[▶ TIKLA]** Bir zayıflığı var: **kararlı (stable) değil**. Eşit iki anahtarın sırası değişebilir.

---

## 14 · Heaps power priority queues
*Öncelik kuyruklarının motoru: heap* · Heaps & Heapsort / Heap ve Heapsort · **6:59 → 7:27** · 3 tıklama

**Tıklamalar:** (1) Priority queue operations · (2) Insert 10 at the end · (3) 10 bubbles up to the root

**EN — söyleyeceğin:**

Heaps are not only for sorting. **[▶ CLICK]** They are perfect for **priority queues**: find the max in constant time, insert or delete in log n. Like an emergency room: the most urgent patient goes first.

**[▶ CLICK]** To insert 10, we put it at the end. **[▶ CLICK]** Then it bubbles up while it beats its parent: past 8, past 9, up to the root. At most log n steps.

**TR — anlamı:**

> Heap sadece sıralama için değil. **[▶ TIKLA]** **Öncelik kuyrukları** için mükemmeldir: en büyüğü sabit zamanda bulur, ekleme ve silmeyi log n’de yapar. Acil servis gibi: en acil hasta önce.
>
> **[▶ TIKLA]** 10’u eklemek için onu sona koyuyoruz. **[▶ TIKLA]** Sonra ebeveyninden büyük oldukça yukarı çıkıyor: 8’i geçiyor, 9’u geçiyor, köke kadar. En fazla log n adım.

---

## 15 · Real world: who uses heaps?
*Gerçek hayatta heap’i kim kullanıyor?* · Heaps & Heapsort / Heap ve Heapsort · **7:27 → 8:12** · 3 tıklama

**Tıklamalar:** (1) Sorting: Linux, C++/.NET, PostgreSQL, std libraries · (2) Priority queues: timers, routers, search, ZIP/PNG · (3) Heaps are everywhere

**EN — söyleyeceğin:**

Who uses this in real life? Almost everyone. **[▶ CLICK]** Sorting: the Linux kernel’s sort() **is** heapsort, because it guarantees n log n with no extra memory. C++ and .NET switch to heapsort when quicksort gets unlucky. PostgreSQL runs a “top-N heapsort” for ORDER BY with LIMIT.

**[▶ CLICK]** Priority queues: Node.js and Go keep their timers in a heap, routers run Dijkstra with a priority queue, Elasticsearch collects its top results in one, and ZIP and PNG build their Huffman codes with a heap.

**[▶ CLICK]** Kernels, databases, servers, networks, compression: heaps are everywhere.

**TR — anlamı:**

> Bunu gerçek hayatta kim kullanıyor? Neredeyse herkes. **[▶ TIKLA]** Sıralama: Linux çekirdeğinin sort() fonksiyonu doğrudan heapsort’tur, çünkü ek bellek olmadan n log n garanti eder. C++ ve .NET, quicksort’un şansı kötü giderse heapsort’a geçer. PostgreSQL, LIMIT’li ORDER BY için “top-N heapsort” çalıştırır.
>
> **[▶ TIKLA]** Öncelik kuyrukları: Node.js ve Go zamanlayıcılarını bir heap’te tutar, yönlendiriciler Dijkstra’yı öncelik kuyruğuyla çalıştırır, Elasticsearch en iyi sonuçları bir öncelik kuyruğunda toplar, ZIP ve PNG de Huffman kodlarını bir heap ile kurar.
>
> **[▶ TIKLA]** Çekirdekler, veritabanları, sunucular, ağlar, sıkıştırma: heap her yerde.

---

## 16 · Horner’s rule: fewer multiplications
*Horner kuralı: daha az çarpma* · Representation change / Gösterimi değiştirme · **8:12 → 8:40** · 4 tıklama

**Tıklamalar:** (1) Factor out x again and again · (2) Table at x = 3: 2, 5, 18, 55, 160 · (3) n multiplications instead of ~n²/2 · (4) Real world: hashCode, parseInt

**EN — söyleyeceğin:**

Back to representation change. **[▶ CLICK]** Horner’s rule rewrites a polynomial by factoring out x again and again. **[▶ CLICK]** At x = 3: multiply by 3, add the next coefficient: 2, 5, 18, 55, and p(3) = 160.

**[▶ CLICK]** Only n multiplications instead of about n²/2. **[▶ CLICK]** In real life, Java’s String.hashCode() is Horner’s rule, and so is every parseInt.

**TR — anlamı:**

> Gösterimi değiştirmeye geri dönelim. **[▶ TIKLA]** Horner kuralı bir polinomu tekrar tekrar x parantezine alarak yeniden yazar. **[▶ TIKLA]** x = 3 için: 3 ile çarp, sonraki katsayıyı ekle: 2, 5, 18, 55 ve p(3) = 160.
>
> **[▶ TIKLA]** Yaklaşık n²/2 yerine sadece n çarpma. **[▶ TIKLA]** Gerçek hayatta Java’nın String.hashCode() fonksiyonu Horner kuralıdır; her parseInt da öyle.

---

## 17 · Binary exponentiation: aⁿ by squaring
*İkili üs alma: kare alarak aⁿ* · Representation change / Gösterimi değiştirme · **8:40 → 9:06** · 3 tıklama

**Tıklamalar:** (1) Left to right: square, multiply on 1 · (2) Right to left: a · a⁴ · a⁸ · (3) Real world: HTTPS / RSA

**EN — söyleyeceğin:**

Binary exponentiation: to compute a¹³, write 13 in binary: 1101. **[▶ CLICK]** Left to right: square at every bit, and multiply by a when the bit is 1. a, a³, a⁶, a¹³: 5 multiplications instead of 12.

**[▶ CLICK]** Or right to left: multiply the powers a, a⁴ and a⁸. **[▶ CLICK]** In real life, every HTTPS connection that uses RSA computes huge powers exactly this way.

**TR — anlamı:**

> İkili üs alma: a¹³’ü hesaplamak için 13’ü ikilik tabanda yaz: 1101. **[▶ TIKLA]** Soldan sağa: her bitte kare al, bit 1 ise a ile de çarp. a, a³, a⁶, a¹³: 12 yerine 5 çarpma.
>
> **[▶ TIKLA]** Ya da sağdan sola: a, a⁴ ve a⁸ kuvvetlerini çarp. **[▶ TIKLA]** Gerçek hayatta RSA kullanan her HTTPS bağlantısı dev üsleri tam olarak böyle hesaplar.

---

## 18 · Reduce to a problem you can already solve
*Zaten çözebildiğin bir probleme indirge* · Problem reduction / Probleme indirgeme · **9:06 → 9:34** · 4 tıklama

**Tıklamalar:** (1) Idea: A → B (already solvable) → answer · (2) lcm(24, 60) via gcd = 12 → 120 · (3) max f = −min(−f); LP, graph search · (4) Real world: machine learning, airlines

**EN — söyleyeceğin:**

**[▶ CLICK]** Problem reduction: turn problem A into a problem B that we can already solve, then translate the answer back, if the detour is cheaper.

**[▶ CLICK]** lcm of 24 and 60: Euclid gives gcd = 12, so lcm = 24·60/12 = 120. **[▶ CLICK]** To find a maximum, find the minimum of −f.

**[▶ CLICK]** In real life, training an AI model maximizes likelihood by minimizing a loss.

**TR — anlamı:**

> **[▶ TIKLA]** Probleme indirgeme: A problemini, zaten çözebildiğimiz bir B problemine çevir, sonra cevabı geri çevir; tabii bu dolambaç daha ucuzsa.
>
> **[▶ TIKLA]** 24 ve 60’ın lcm’i (EKOK): Öklid gcd’yi (EBOB) 12 bulur, yani lcm = 24·60/12 = 120. **[▶ TIKLA]** Bir maksimumu bulmak için −f’nin minimumunu bul.
>
> **[▶ TIKLA]** Gerçek hayatta bir yapay zekâ modelini eğitmek, bir kaybı (loss) en aza indirerek olabilirliği en büyütmektir.

---

## 19 · Counting paths = multiplying matrices
*Yol saymak = matris çarpmak* · Problem reduction / Probleme indirgeme · **9:34 → 9:59** · 4 tıklama

**Tıklamalar:** (1) Graph → adjacency matrix A · (2) A² = A · A · (3) (2, 4) = 2: the two paths · (4) Real world: social networks, PageRank

**EN — söyleyeceğin:**

One more reduction: counting paths. **[▶ CLICK]** Write the graph as an adjacency matrix A. **[▶ CLICK]** Square it. **[▶ CLICK]** Entry (2, 4) of A² is 2: exactly the two paths from 2 to 4. Counting paths is just matrix multiplication.

**[▶ CLICK]** In real life: “friends of friends” in social networks, and Google’s PageRank.

**TR — anlamı:**

> Bir indirgeme daha: yol saymak. **[▶ TIKLA]** Grafı bir komşuluk matrisi A olarak yaz. **[▶ TIKLA]** Karesini al. **[▶ TIKLA]** A²’nin (2, 4) elemanı 2: tam olarak 2’den 4’e giden iki yol. Yol saymak sadece matris çarpımıdır.
>
> **[▶ TIKLA]** Gerçek hayatta: sosyal ağlardaki “arkadaşın arkadaşı” ve Google’ın PageRank’i.

---

## 20 · Three ways to transform, then conquer
*Dönüştürmenin üç yolu, sonra fethet* · Wrap-up / Kapanış · **9:59 → 10:19** · 2 tıklama

**Tıklamalar:** (1) Three buckets, with where each is used · (2) Change the problem, then conquer it

**EN — söyleyeceğin:**

To sum up: **[▶ CLICK]** three ways to transform. Simplify the instance, change the representation, or reduce to another problem, and every one of them runs in real systems today.

**[▶ CLICK]** Change the problem, then conquer it.

**TR — anlamı:**

> Özetle: **[▶ TIKLA]** dönüştürmenin üç yolu var. Örneği basitleştir, gösterimi değiştir ya da başka bir probleme indirge; ve her biri bugün gerçek sistemlerde çalışıyor.
>
> **[▶ TIKLA]** Problemi değiştir, sonra fethet.

---

## 21 · Thank you! Questions?
*Teşekkürler! Sorular?* · Wrap-up / Kapanış · **10:19 → 10:24** · 0 tıklama

**EN — söyleyeceğin:**

Thank you for listening. I’m happy to take your questions.

**TR — anlamı:**

> Dinlediğiniz için teşekkürler. Sorularınızı memnuniyetle cevaplarım.

---

## Ek slaytlar (soru-cevap için)

### A1 · Try it: heapsort playground — *Deneyin: heapsort oyun alanı*

For questions: type your own numbers (up to 15), press Play or Step, and watch both stages with live comparison and swap counters. Try "Already sorted" to see that the build is still linear.

> Soru-cevap için: kendi sayılarınızı yazın (en fazla 15), Oynat ya da Adım’a basın ve iki aşamayı canlı karşılaştırma ve takas sayaçlarıyla izleyin. "Zaten sıralı" ile kurmanın yine doğrusal olduğunu gösterebilirsiniz.

### A2 · How fast can we sort? — *Ne kadar hızlı sıralayabiliriz?*

If someone asks how fast sorting can be: every comparison sort needs about n log₂ n comparisons in the worst case (a decision tree with n! leaves has height ⌈log₂ n!⌉), and mergesort reaches that bound. **[▶ CLICK]** Presorting pays off when you search many times: after about log₂ n searches, sorting once and using binary search wins. **[▶ CLICK]**

> Sıralamanın ne kadar hızlı olabileceği sorulursa: karşılaştırmaya dayalı her sıralama en kötü durumda yaklaşık n log₂ n karşılaştırma ister (n! yapraklı bir karar ağacının yüksekliği ⌈log₂ n!⌉’dir) ve mergesort bu sınıra ulaşır. **[▶ TIKLA]** Önceden sıralama çok sayıda arama yapıldığında kazandırır: yaklaşık log₂ n aramadan sonra bir kez sıralayıp ikili arama yapmak kazanır. **[▶ TIKLA]**

### A3 · The four AVL rotations — *Dört AVL döndürmesi*

For questions about balanced trees: **[▶ CLICK]** an AVL tree’s height is at most about 1.44 log₂ n, and one insertion needs at most one single or double rotation, which only re-links a few pointers. **[▶ CLICK]** A 2-3 tree’s height is between log₃ n and log₂ n; search, insert and delete are Θ(log n) in both.

> Dengeli ağaçlarla ilgili sorular için: **[▶ TIKLA]** bir AVL ağacının yüksekliği en fazla yaklaşık 1,44 log₂ n’dir ve bir ekleme en fazla bir tekli ya da çift döndürme ister; döndürme sadece birkaç işaretçiyi yeniden bağlar. **[▶ TIKLA]** 2-3 ağacının yüksekliği log₃ n ile log₂ n arasındadır; arama, ekleme ve silme ikisinde de Θ(log n).

---

## Olası sorular ve kısa cevaplar

**1. Where exactly is heapsort used in practice?**  
*Heapsort pratikte tam olarak nerede kullanılıyor?*

The Linux kernel’s generic sort() in lib/sort.c is a heapsort (guaranteed n log n, no extra memory, no recursion). C++ std::sort and .NET Array.Sort use introsort, which falls back to heapsort. PostgreSQL uses a top-N heapsort for ORDER BY with a small LIMIT.

> Linux çekirdeğinin lib/sort.c içindeki genel sort() fonksiyonu heapsort’tur (garanti n log n, ek bellek yok, özyineleme yok). C++ std::sort ve .NET Array.Sort introsort kullanır; introsort gerektiğinde heapsort’a geçer. PostgreSQL küçük bir LIMIT ile ORDER BY için top-N heapsort kullanır.

**2. Why is building a heap only O(n), not O(n log n)?**  
*Heap kurmak neden O(n log n) değil de O(n)?*

Most nodes are leaves or near the leaves, and they can sink only a few levels. Only the root can sink log n levels. If you add up the work level by level, it is less than 2n comparisons.

> Düğümlerin çoğu yaprak ya da yaprağa yakın ve sadece birkaç seviye batabilir. Sadece kök log n seviye batabilir. İşi seviye seviye toplarsanız 2n’den az karşılaştırma çıkar.

**3. Heapsort, quicksort or mergesort?**  
*Heapsort mu, quicksort mu, mergesort mu?*

All three are n log n on average. Heapsort is in place and has no bad worst case, but quicksort is usually faster in practice. Mergesort is stable, but it needs an extra array.

> Üçü de ortalamada n log n. Heapsort yerinde çalışır ve kötü bir en kötü durumu yoktur, ama pratikte quicksort genelde daha hızlıdır. Mergesort kararlıdır ama ek bir dizi ister.

**4. Why is heapsort not stable?**  
*Heapsort neden kararlı değil?*

The root is swapped with the last key of the heap, which jumps over other keys. Two equal keys can end up in the opposite order, like 1a and 1b on the slide.

> Kök, heap’in son anahtarıyla yer değiştirir ve bu hamle diğer anahtarların üzerinden atlar. Slayttaki 1a ve 1b gibi iki eşit anahtar ters sırada kalabilir.

**5. What is a min-heap?**  
*Min-heap nedir?*

The same structure with the opposite rule: every parent is smaller than or equal to its children, so the minimum is at the root. It is used when a smaller number means a higher priority.

> Aynı yapı, ters kuralla: her ebeveyn çocuklarından küçük ya da eşittir, bu yüzden en küçük eleman köktedir. Küçük sayının yüksek öncelik anlamına geldiği durumlarda kullanılır.

**6. Why build bottom-up instead of inserting the keys one by one?**  
*Neden anahtarları tek tek eklemek yerine aşağıdan yukarı kuruyoruz?*

Inserting n keys one by one (top-down) can cost n log n. Bottom-up construction costs only O(n).

> n anahtarı tek tek eklemek (yukarıdan aşağı) n log n tutabilir. Aşağıdan yukarı kurmak sadece O(n) tutar.

**7. AVL tree or 2-3 tree?**  
*AVL ağacı mı, 2-3 ağacı mı?*

Both keep the height at O(log n). AVL trees stay binary and fix the balance with rotations. 2-3 trees allow two keys in a node and fix overflows by splitting, so all leaves stay on the same level.

> İkisi de yüksekliği O(log n) tutar. AVL ağaçları ikili kalır ve dengeyi döndürmelerle (rotation) düzeltir. 2-3 ağaçları bir düğümde iki anahtara izin verir ve taşmayı bölünmeyle düzeltir, böylece tüm yapraklar aynı seviyede kalır.

**8. Why is Gaussian elimination Θ(n³)?**  
*Gauss eliminasyonu neden Θ(n³)?*

There are three nested loops: one over the pivot rows, one over the rows below, and one over the columns. That gives about n³/3 multiplications.

> İç içe üç döngü var: pivot satırları, alttaki satırlar ve sütunlar üzerinde. Bu da yaklaşık n³/3 çarpma eder.


<sub>Bu dosya `node tools/build-speech.js` ile js/notes.js dosyasından üretildi. Toplam 1342 İngilizce kelime.</sub>
