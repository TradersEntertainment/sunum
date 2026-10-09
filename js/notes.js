/* Speaker notes: the speech script, one entry per slide id.
 *   time  — speaking budget in seconds
 *   cues  — what each click shows (presenter window: "next click")
 *   en/tr — paragraphs; [click] marks the moment to press → (one per step)
 * KONUSMA_METNI.md is generated from this file: node tools/build-speech.js */
window.NOTES = {

  /* ---------------- opening ---------------- */

  'title': {
    time: 13,
    cues: [],
    en: ['Hello everyone. Today’s topic is Chapter 6: <b>Transform and Conquer</b>. The idea: when a problem is hard, first change it into an easier one, then solve it.'],
    tr: ['Herkese merhaba. Bugünkü konum Bölüm 6: <b>Dönüştür ve Fethet</b>. Fikir şu: bir problem zorsa önce onu daha kolay bir probleme dönüştür, sonra çöz.'],
  },

  'big-idea': {
    time: 30,
    cues: ['Pipeline: transform → conquer', 'Way 1: instance simplification', 'Way 2: representation change', 'Way 3: problem reduction'],
    en: [
      '[click] We transform the problem into an easier one, then conquer it.',
      '[click] There are three ways. One: <b>instance simplification</b>, the same problem with a simpler instance, like a sorted list. [click] Two: <b>representation change</b>, the same data in a different form, like an array seen as a tree. [click] Three: <b>problem reduction</b>, turning it into a problem we can already solve, like lcm through gcd.',
    ],
    tr: [
      '[click] Problemi daha kolay bir probleme dönüştürür, sonra onu fethederiz.',
      '[click] Bunun üç yolu var. Bir: <b>örneği basitleştirme</b>; aynı problem, daha basit bir örnek, mesela sıralı bir liste. [click] İki: <b>gösterimi değiştirme</b>; aynı veri, farklı bir biçimde, mesela ağaç gibi okunan bir dizi. [click] Üç: <b>probleme indirgeme</b>; onu zaten çözebildiğimiz bir probleme çevirmek, mesela gcd ile lcm hesaplamak.',
    ],
  },

  /* ---------------- instance simplification ---------------- */

  'presorting': {
    time: 34,
    cues: ['Brute force: compare every pair', 'Presort, then compare neighbours', 'n = 1 000 000: 5·10¹¹ vs 2·10⁷', 'Real world: sort | uniq, databases'],
    en: [
      'Example one: are all elements distinct? [click] Brute force compares every pair, up to n²/2 comparisons. [click] Presorting: sort first, then compare only neighbours, because duplicates end up side by side. That is n log n.',
      '[click] For a million elements: 500 billion comparisons versus 20 million. Minutes versus a blink.',
      '[click] In real life, the Unix pipeline <code>sort | uniq</code> works exactly like this, and so do databases for DISTINCT and GROUP BY.',
    ],
    tr: [
      'Birinci örnek: tüm elemanlar farklı mı? [click] Kaba kuvvet her çifti karşılaştırır, n²/2’ye kadar karşılaştırma. [click] Önceden sıralama: önce sırala, sonra sadece komşuları karşılaştır, çünkü tekrarlar yan yana gelir. Bu n log n.',
      '[click] Bir milyon eleman için: 500 milyar karşılaştırmaya karşı 20 milyon. Dakikalar ve göz açıp kapayıncaya kadar.',
      '[click] Gerçek hayatta Unix’teki <code>sort | uniq</code> tam olarak böyle çalışır; veritabanları da DISTINCT ve GROUP BY için aynısını yapar.',
    ],
  },

  'gauss': {
    time: 34,
    cues: ['R₂ − 3/2·R₁', 'R₃ − 1/2·R₁', 'R₃ − 3/5·R₂ → triangle, Θ(n³)', 'Back substitution: x = 2, 1, 6', 'Check ✓', 'Real world: NumPy/MATLAB, TOP500'],
    en: [
      'Example two: Gaussian elimination turns a system of equations into a triangle. [click] Row two minus 3/2 of row one: a zero. [click] Row three, the same. [click] One more step, and the matrix is triangular. This costs n³.',
      '[click] Now we solve bottom-up: x₃ = 6, x₂ = 1, x₁ = 2. [click] They check out.',
      '[click] In real life, NumPy and MATLAB solve systems this way, and the TOP500 supercomputers are ranked by how fast they do it.',
    ],
    tr: [
      'İkinci örnek: Gauss eliminasyonu bir denklem sistemini üçgene çevirir. [click] İkinci satırdan birinci satırın 3/2’si çıkar: bir sıfır. [click] Üçüncü satıra da aynısı. [click] Bir adım daha ve matris üst üçgen oldu. Bunun maliyeti n³.',
      '[click] Şimdi aşağıdan yukarı çözüyoruz: x₃ = 6, x₂ = 1, x₁ = 2. [click] Yerine koyunca hepsi tutuyor.',
      '[click] Gerçek hayatta NumPy ve MATLAB sistemleri böyle çözer; TOP500 listesindeki süper bilgisayarlar da bunu ne kadar hızlı yaptıklarına göre sıralanır.',
    ],
  },

  /* ---------------- search trees ---------------- */

  'bst-problem': {
    time: 22,
    cues: ['A bushy BST: fast', 'Sorted keys → a stick, O(n)', 'Two fixes: balance (AVL) / more keys per node (2-3)'],
    en: [
      'Now search trees. [click] A binary search tree is fast when it is bushy. [click] But if the keys arrive already sorted, it becomes a stick: search costs O(n).',
      '[click] Two fixes: keep it balanced, like AVL trees, or put more keys in a node, like 2-3 trees.',
    ],
    tr: [
      'Şimdi arama ağaçları. [click] İkili arama ağacı gür olduğunda hızlıdır. [click] Ama anahtarlar zaten sıralı gelirse bir çubuğa dönüşür: arama O(n) olur.',
      '[click] İki çözüm var: ağacı dengeli tutmak, AVL ağaçları gibi, ya da bir düğüme daha çok anahtar koymak, 2-3 ağaçları gibi.',
    ],
  },

  'avl': {
    time: 32,
    cues: ['Insert 5, 6, 8 → L(5)', 'Insert 3, 2 → R(5)', 'Insert 4 → LR(6)', 'Insert 7 → RL(6): balanced and sorted', 'Real world: Linux scheduler, TreeMap'],
    en: [
      'An AVL tree keeps every balance factor at −1, 0 or 1. We insert 5, 6, 8, 3, 2, 4, 7. [click] After 8, node 5 tips over: one left rotation. [click] After 2: a right rotation. [click] After 4: a double rotation. [click] After 7: another double one. Balanced, and still sorted.',
      '[click] In real life, the Linux CPU scheduler and Java’s TreeMap use red-black trees, the AVL tree’s cousin.',
    ],
    tr: [
      'AVL ağacı her düğümün denge faktörünü −1, 0 veya 1’de tutar. 5, 6, 8, 3, 2, 4, 7 ekliyoruz. [click] 8’den sonra 5 dengesini kaybediyor: bir sola döndürme. [click] 2’den sonra: sağa döndürme. [click] 4’ten sonra: çift döndürme. [click] 7’den sonra bir çift döndürme daha. Dengeli ve hâlâ sıralı.',
      '[click] Gerçek hayatta Linux’un işlemci zamanlayıcısı ve Java’nın TreeMap’i, AVL’nin kuzeni olan red-black ağaçlarını kullanır.',
    ],
  },

  'two-three': {
    time: 30,
    cues: ['9, 5, 8 → split, 8 moves up', 'Small nodes absorb keys', 'Splits climb to the root', 'All leaves on one level: Θ(log n)', 'Real world: database indexes, file systems'],
    en: [
      '2-3 trees take the other road: a node holds one or two keys. [click] Three keys? The node splits, and the middle key moves up. [click] Small nodes just absorb keys. [click] Splits can climb to the root: the tree grows only at the top. [click] So all leaves stay on one level: log n.',
      '[click] In real life, every index in MySQL, PostgreSQL and SQLite is a B-tree: a 2-3 tree with hundreds of keys per node.',
    ],
    tr: [
      '2-3 ağaçları diğer yolu seçer: bir düğüm bir ya da iki anahtar tutar. [click] Üç anahtar mı oldu? Düğüm bölünür, ortadaki anahtar yukarı çıkar. [click] Küçük düğümler anahtarları kolayca alır. [click] Bölünmeler köke kadar tırmanabilir: ağaç sadece tepeden büyür. [click] Böylece tüm yapraklar aynı seviyede kalır: log n.',
      '[click] Gerçek hayatta MySQL, PostgreSQL ve SQLite’taki her indeks bir B-ağacıdır: düğüm başına yüzlerce anahtar tutan bir 2-3 ağacı.',
    ],
  },

  /* ---------------- ★ Heaps & Heapsort ---------------- */

  'heap-intro': {
    time: 12,
    cues: [],
    en: ['Now the star of this chapter: <b>heaps and heapsort</b>. We <b>think</b> of the keys as a tree, but <b>store</b> them in a simple array.'],
    tr: ['Şimdi bölümün yıldızı: <b>heap ve heapsort</b>. Anahtarları bir ağaç gibi <b>düşünüyor</b>, ama basit bir dizide <b>saklıyoruz</b>.'],
  },

  'heap-def': {
    time: 40,
    cues: ['Rule 1: shape (slots fill in order)', 'Rule 2: parent ≥ children', 'Paths go down; no left-right order', 'Heap or not? ✓ ✗ ✗'],
    en: [
      'A heap is a binary tree with two rules. [click] Rule one, <b>shape</b>: we fill the tree level by level, left to right. Only the last level can have gaps, and only on the right.',
      '[click] Rule two, <b>order</b>: every parent is greater than or equal to its children. That is a max-heap.',
      '[click] So keys decrease along every path down. But there is no left-to-right order: 8 is lower, yet bigger than 4.',
      '[click] Quick check: the first tree is a heap. The second has a hole in its shape. The third breaks the order: 6 is bigger than its parent 5.',
    ],
    tr: [
      'Heap, iki kurala uyan bir ikili ağaçtır. [click] Birinci kural, <b>şekil</b>: ağacı seviye seviye, soldan sağa doldururuz. Sadece son seviyede boşluk olabilir, o da sadece sağda.',
      '[click] İkinci kural, <b>sıra</b>: her ebeveyn çocuklarından büyük ya da eşittir. Buna max-heap denir.',
      '[click] Yani kökten aşağı her yolda anahtarlar azalır. Ama soldan sağa bir sıra yoktur: 8 daha aşağıda, ama 4’ten büyük.',
      '[click] Hızlı kontrol: ilk ağaç bir heap. İkincisinin şeklinde boşluk var. Üçüncüsü sırayı bozuyor: 6, ebeveyni 5’ten büyük.',
    ],
  },

  'heap-array': {
    time: 36,
    cues: ['Number the nodes, fly them into the array', 'Children of j: 2j, 2j+1', 'Parent of j: ⌊j/2⌋', 'Parents first, max at H[1]'],
    en: [
      'Here is the trick. [click] We number the nodes top-down, left to right, and simply put them into an array. No pointers at all.',
      '[click] For the node at position j, the children are at <b>2j</b> and <b>2j + 1</b>. For j = 2, that is 4 and 5.',
      '[click] And the parent of j is at <b>j divided by 2, rounded down</b>. Five divided by two is two.',
      '[click] So the parents fill the first half of the array, and the maximum is always at position one.',
    ],
    tr: [
      'İşin püf noktası şu. [click] Düğümleri yukarıdan aşağı, soldan sağa numaralandırıp doğrudan bir diziye koyuyoruz. Hiç işaretçi (pointer) yok.',
      '[click] j konumundaki düğümün çocukları <b>2j</b> ve <b>2j + 1</b> konumlarındadır. j = 2 için bunlar 4 ve 5.',
      '[click] j’nin ebeveyni ise <b>j bölü 2’nin aşağı yuvarlanmışıdır</b>. 5 bölü 2, 2 eder.',
      '[click] Böylece ebeveynler dizinin ilk yarısını doldurur ve en büyük eleman her zaman 1. konumdadır.',
    ],
  },

  'heap-build': {
    time: 50,
    cues: ['Parent 7: swap with 8', 'Parent 9: already OK ✓', 'Root 2: swap with 9', '2 keeps sinking: swap with 6', 'Done: heap 9 6 8 2 5 7'],
    en: [
      'To build a heap, we go <b>bottom-up</b>: start at the last parent, fix its subtree, and move back toward the root. Our list: 2, 9, 7, 6, 5, 8.',
      '[click] The last parent is 7. Its bigger child is 8, so they swap. [click] Next is 9. It is already bigger than its children: nothing to do.',
      '[click] Now the root, 2. Its bigger child is 9: swap. [click] 2 is still too small, so it keeps sinking: it swaps with 6 and reaches a leaf.',
      '[click] Done: a heap, with the maximum, 9, at the root. The table matches our lecture slides.',
    ],
    tr: [
      'Heap’i kurmak için <b>aşağıdan yukarı</b> gideriz: son ebeveynden başla, alt ağacını düzelt ve köke doğru geri gel. Listemiz: 2, 9, 7, 6, 5, 8.',
      '[click] Son ebeveyn 7. Büyük çocuğu 8, o yüzden yer değiştirirler. [click] Sırada 9 var. Zaten çocuklarından büyük: bir şey yapmaya gerek yok.',
      '[click] Şimdi kök, yani 2. Büyük çocuğu 9: yer değiştir. [click] 2 hâlâ çok küçük, batmaya devam ediyor: 6 ile yer değiştirip bir yaprağa ulaşıyor.',
      '[click] Bitti: bir heap, en büyük eleman 9 kökte. Tablo, ders slaytlarımızdakiyle aynı.',
    ],
  },

  'heapsort': {
    time: 50,
    cues: ['Swap root 9 with last; lock 9', 'Sift 7 down (swap with 8)', 'Autoplay the remaining removals', 'Sorted: 2 5 6 7 8 9'],
    en: [
      'Heapsort: stage one builds the heap, which we just did. Stage two removes the maximum again and again.',
      '[click] Swap the root with the last key. Now 9 is in its final place, so we lock it, and the heap shrinks by one.',
      '[click] The new root, 7, is too small, so we sift it down: it swaps with its bigger child, 8. The heap is fixed again.',
      '[click] We repeat the same two moves: swap the max to the end, then sift down. Watch the sorted part grow on the right.',
      '[click] And the array is sorted: 2, 5, 6, 7, 8, 9. Notice that we never needed a second array.',
    ],
    tr: [
      'Heapsort: birinci aşama heap’i kurar, bunu az önce yaptık. İkinci aşama en büyük elemanı tekrar tekrar çıkarır.',
      '[click] Kökü son anahtarla değiştir. Artık 9 son yerinde, onu kilitliyoruz ve heap bir eleman küçülüyor.',
      '[click] Yeni kök 7 çok küçük, onu aşağı itiyoruz: büyük çocuğu 8 ile yer değiştiriyor. Heap yine düzgün.',
      '[click] Aynı iki hamleyi tekrarlıyoruz: en büyüğü sona taşı, sonra aşağı it. Sağda sıralı kısmın büyüdüğüne bakın.',
      '[click] Ve dizi sıralandı: 2, 5, 6, 7, 8, 9. Dikkat edin, hiç ikinci bir diziye ihtiyacımız olmadı.',
    ],
  },

  'heap-analysis': {
    time: 36,
    cues: ['Build = Θ(n): work per level', 'Sort = Θ(n log n)', 'Total Θ(n log n), in-place ✓', 'Not stable ✗ (1a 1b → 1b 1a)'],
    en: [
      'How fast is it? [click] Building the heap is <b>linear</b>. Most nodes are near the bottom and can only sink a little. For 15 keys that is at most 22 comparisons, less than 2n.',
      '[click] Sorting does n − 1 removals, and each costs at most about 2 log n comparisons. So that part is <b>n log n</b>.',
      '[click] In total, heapsort is n log n in the worst case and on average, and it works in place.',
      '[click] One weakness: it is <b>not stable</b>. Two equal keys can change their order.',
    ],
    tr: [
      'Peki ne kadar hızlı? [click] Heap’i kurmak <b>doğrusal</b> zaman alır. Düğümlerin çoğu en altta ve sadece biraz batabilir. 15 anahtar için en fazla 22 karşılaştırma, yani 2n’den az.',
      '[click] Sıralama n − 1 kez kök çıkarır, her biri en fazla yaklaşık 2 log n karşılaştırma. Yani bu kısım <b>n log n</b>.',
      '[click] Toplamda heapsort hem en kötü hem ortalama durumda n log n’dir ve yerinde (in-place) çalışır.',
      '[click] Bir zayıflığı var: <b>kararlı (stable) değil</b>. Eşit iki anahtarın sırası değişebilir.',
    ],
  },

  'priority-queue': {
    time: 28,
    cues: ['Priority queue operations', 'Insert 10 at the end', '10 bubbles up to the root'],
    en: [
      'Heaps are not only for sorting. [click] They are perfect for <b>priority queues</b>: find the max in constant time, insert or delete in log n. Like an emergency room: the most urgent patient goes first.',
      '[click] To insert 10, we put it at the end. [click] Then it bubbles up while it beats its parent: past 8, past 9, up to the root. At most log n steps.',
    ],
    tr: [
      'Heap sadece sıralama için değil. [click] <b>Öncelik kuyrukları</b> için mükemmeldir: en büyüğü sabit zamanda bulur, ekleme ve silmeyi log n’de yapar. Acil servis gibi: en acil hasta önce.',
      '[click] 10’u eklemek için onu sona koyuyoruz. [click] Sonra ebeveyninden büyük oldukça yukarı çıkıyor: 8’i geçiyor, 9’u geçiyor, köke kadar. En fazla log n adım.',
    ],
  },

  'heap-real': {
    time: 45,
    cues: ['Sorting: Linux, C++/.NET, PostgreSQL, std libraries', 'Priority queues: timers, routers, search, ZIP/PNG', 'Heaps are everywhere'],
    en: [
      'Who uses this in real life? Almost everyone. [click] Sorting: the Linux kernel’s <code>sort()</code> <b>is</b> heapsort, because it guarantees n log n with no extra memory. C++ and .NET switch to heapsort when quicksort gets unlucky. PostgreSQL runs a “top-N heapsort” for <code>ORDER BY</code> with <code>LIMIT</code>.',
      '[click] Priority queues: Node.js and Go keep their timers in a heap, routers run Dijkstra with a priority queue, Elasticsearch collects its top results in one, and ZIP and PNG build their Huffman codes with a heap.',
      '[click] Kernels, databases, servers, networks, compression: heaps are everywhere.',
    ],
    tr: [
      'Bunu gerçek hayatta kim kullanıyor? Neredeyse herkes. [click] Sıralama: Linux çekirdeğinin <code>sort()</code> fonksiyonu doğrudan heapsort’tur, çünkü ek bellek olmadan n log n garanti eder. C++ ve .NET, quicksort’un şansı kötü giderse heapsort’a geçer. PostgreSQL, <code>LIMIT</code>’li <code>ORDER BY</code> için “top-N heapsort” çalıştırır.',
      '[click] Öncelik kuyrukları: Node.js ve Go zamanlayıcılarını bir heap’te tutar, yönlendiriciler Dijkstra’yı öncelik kuyruğuyla çalıştırır, Elasticsearch en iyi sonuçları bir öncelik kuyruğunda toplar, ZIP ve PNG de Huffman kodlarını bir heap ile kurar.',
      '[click] Çekirdekler, veritabanları, sunucular, ağlar, sıkıştırma: heap her yerde.',
    ],
  },

  /* ---------------- representation change: Horner & powers ---------------- */

  'horner': {
    time: 28,
    cues: ['Factor out x again and again', 'Table at x = 3: 2, 5, 18, 55, 160', 'n multiplications instead of ~n²/2', 'Real world: hashCode, parseInt'],
    en: [
      'Back to representation change. [click] Horner’s rule rewrites a polynomial by factoring out x again and again. [click] At x = 3: multiply by 3, add the next coefficient: 2, 5, 18, 55, and p(3) = 160.',
      '[click] Only n multiplications instead of about n²/2. [click] In real life, Java’s <code>String.hashCode()</code> is Horner’s rule, and so is every <code>parseInt</code>.',
    ],
    tr: [
      'Gösterimi değiştirmeye geri dönelim. [click] Horner kuralı bir polinomu tekrar tekrar x parantezine alarak yeniden yazar. [click] x = 3 için: 3 ile çarp, sonraki katsayıyı ekle: 2, 5, 18, 55 ve p(3) = 160.',
      '[click] Yaklaşık n²/2 yerine sadece n çarpma. [click] Gerçek hayatta Java’nın <code>String.hashCode()</code> fonksiyonu Horner kuralıdır; her <code>parseInt</code> da öyle.',
    ],
  },

  'binexp': {
    time: 26,
    cues: ['Left to right: square, multiply on 1', 'Right to left: a · a⁴ · a⁸', 'Real world: HTTPS / RSA'],
    en: [
      'Binary exponentiation: to compute a¹³, write 13 in binary: 1101. [click] Left to right: square at every bit, and multiply by a when the bit is 1. a, a³, a⁶, a¹³: 5 multiplications instead of 12.',
      '[click] Or right to left: multiply the powers a, a⁴ and a⁸. [click] In real life, every HTTPS connection that uses RSA computes huge powers exactly this way.',
    ],
    tr: [
      'İkili üs alma: a¹³’ü hesaplamak için 13’ü ikilik tabanda yaz: 1101. [click] Soldan sağa: her bitte kare al, bit 1 ise a ile de çarp. a, a³, a⁶, a¹³: 12 yerine 5 çarpma.',
      '[click] Ya da sağdan sola: a, a⁴ ve a⁸ kuvvetlerini çarp. [click] Gerçek hayatta RSA kullanan her HTTPS bağlantısı dev üsleri tam olarak böyle hesaplar.',
    ],
  },

  /* ---------------- problem reduction ---------------- */

  'reduction': {
    time: 28,
    cues: ['Idea: A → B (already solvable) → answer', 'lcm(24, 60) via gcd = 12 → 120', 'max f = −min(−f); LP, graph search', 'Real world: machine learning, airlines'],
    en: [
      '[click] Problem reduction: turn problem A into a problem B that we can already solve, then translate the answer back, if the detour is cheaper.',
      '[click] lcm of 24 and 60: Euclid gives gcd = 12, so lcm = 24·60/12 = 120. [click] To find a maximum, find the minimum of −f.',
      '[click] In real life, training an AI model maximizes likelihood by minimizing a loss.',
    ],
    tr: [
      '[click] Probleme indirgeme: A problemini, zaten çözebildiğimiz bir B problemine çevir, sonra cevabı geri çevir; tabii bu dolambaç daha ucuzsa.',
      '[click] 24 ve 60’ın lcm’i (EKOK): Öklid gcd’yi (EBOB) 12 bulur, yani lcm = 24·60/12 = 120. [click] Bir maksimumu bulmak için −f’nin minimumunu bul.',
      '[click] Gerçek hayatta bir yapay zekâ modelini eğitmek, bir kaybı (loss) en aza indirerek olabilirliği en büyütmektir.',
    ],
  },

  'paths': {
    time: 25,
    cues: ['Graph → adjacency matrix A', 'A² = A · A', '(2, 4) = 2: the two paths', 'Real world: social networks, PageRank'],
    en: [
      'One more reduction: counting paths. [click] Write the graph as an adjacency matrix A. [click] Square it. [click] Entry (2, 4) of A² is 2: exactly the two paths from 2 to 4. Counting paths is just matrix multiplication.',
      '[click] In real life: “friends of friends” in social networks, and Google’s PageRank.',
    ],
    tr: [
      'Bir indirgeme daha: yol saymak. [click] Grafı bir komşuluk matrisi A olarak yaz. [click] Karesini al. [click] A²’nin (2, 4) elemanı 2: tam olarak 2’den 4’e giden iki yol. Yol saymak sadece matris çarpımıdır.',
      '[click] Gerçek hayatta: sosyal ağlardaki “arkadaşın arkadaşı” ve Google’ın PageRank’i.',
    ],
  },

  /* ---------------- closing ---------------- */

  'summary': {
    time: 20,
    cues: ['Three buckets, with where each is used', 'Change the problem, then conquer it'],
    en: [
      'To sum up: [click] three ways to transform. Simplify the instance, change the representation, or reduce to another problem, and every one of them runs in real systems today.',
      '[click] Change the problem, then conquer it.',
    ],
    tr: [
      'Özetle: [click] dönüştürmenin üç yolu var. Örneği basitleştir, gösterimi değiştir ya da başka bir probleme indirge; ve her biri bugün gerçek sistemlerde çalışıyor.',
      '[click] Problemi değiştir, sonra fethet.',
    ],
  },

  'thanks': {
    time: 5,
    cues: [],
    en: ['Thank you for listening. I’m happy to take your questions.'],
    tr: ['Dinlediğiniz için teşekkürler. Sorularınızı memnuniyetle cevaplarım.'],
  },

  /* ---------------- appendix ---------------- */

  'sort-bound': {
    en: ['If someone asks how fast sorting can be: every comparison sort needs about n log₂ n comparisons in the worst case (a decision tree with n! leaves has height ⌈log₂ n!⌉), and mergesort reaches that bound. [click] Presorting pays off when you search many times: after about log₂ n searches, sorting once and using binary search wins. [click]'],
    tr: ['Sıralamanın ne kadar hızlı olabileceği sorulursa: karşılaştırmaya dayalı her sıralama en kötü durumda yaklaşık n log₂ n karşılaştırma ister (n! yapraklı bir karar ağacının yüksekliği ⌈log₂ n!⌉’dir) ve mergesort bu sınıra ulaşır. [click] Önceden sıralama çok sayıda arama yapıldığında kazandırır: yaklaşık log₂ n aramadan sonra bir kez sıralayıp ikili arama yapmak kazanır. [click]'],
  },

  'avl-rotations': {
    en: ['For questions about balanced trees: [click] an AVL tree’s height is at most about 1.44 log₂ n, and one insertion needs at most one single or double rotation, which only re-links a few pointers. [click] A 2-3 tree’s height is between log₃ n and log₂ n; search, insert and delete are Θ(log n) in both.'],
    tr: ['Dengeli ağaçlarla ilgili sorular için: [click] bir AVL ağacının yüksekliği en fazla yaklaşık 1,44 log₂ n’dir ve bir ekleme en fazla bir tekli ya da çift döndürme ister; döndürme sadece birkaç işaretçiyi yeniden bağlar. [click] 2-3 ağacının yüksekliği log₃ n ile log₂ n arasındadır; arama, ekleme ve silme ikisinde de Θ(log n).'],
  },

  'playground': {
    en: ['For questions: type your own numbers (up to 15), press Play or Step, and watch both stages with live comparison and swap counters. Try "Already sorted" to see that the build is still linear.'],
    tr: ['Soru-cevap için: kendi sayılarınızı yazın (en fazla 15), Oynat ya da Adım’a basın ve iki aşamayı canlı karşılaştırma ve takas sayaçlarıyla izleyin. "Zaten sıralı" ile kurmanın yine doğrusal olduğunu gösterebilirsiniz.'],
  },

  /* ---------------- likely questions (for KONUSMA_METNI.md) ---------------- */
  __qa: [
    {
      q: 'Where exactly is heapsort used in practice?',
      qtr: 'Heapsort pratikte tam olarak nerede kullanılıyor?',
      a: 'The Linux kernel’s generic sort() in lib/sort.c is a heapsort (guaranteed n log n, no extra memory, no recursion). C++ std::sort and .NET Array.Sort use introsort, which falls back to heapsort. PostgreSQL uses a top-N heapsort for ORDER BY with a small LIMIT.',
      atr: 'Linux çekirdeğinin lib/sort.c içindeki genel sort() fonksiyonu heapsort’tur (garanti n log n, ek bellek yok, özyineleme yok). C++ std::sort ve .NET Array.Sort introsort kullanır; introsort gerektiğinde heapsort’a geçer. PostgreSQL küçük bir LIMIT ile ORDER BY için top-N heapsort kullanır.',
    },
    {
      q: 'Why is building a heap only O(n), not O(n log n)?',
      qtr: 'Heap kurmak neden O(n log n) değil de O(n)?',
      a: 'Most nodes are leaves or near the leaves, and they can sink only a few levels. Only the root can sink log n levels. If you add up the work level by level, it is less than 2n comparisons.',
      atr: 'Düğümlerin çoğu yaprak ya da yaprağa yakın ve sadece birkaç seviye batabilir. Sadece kök log n seviye batabilir. İşi seviye seviye toplarsanız 2n’den az karşılaştırma çıkar.',
    },
    {
      q: 'Heapsort, quicksort or mergesort?',
      qtr: 'Heapsort mu, quicksort mu, mergesort mu?',
      a: 'All three are n log n on average. Heapsort is in place and has no bad worst case, but quicksort is usually faster in practice. Mergesort is stable, but it needs an extra array.',
      atr: 'Üçü de ortalamada n log n. Heapsort yerinde çalışır ve kötü bir en kötü durumu yoktur, ama pratikte quicksort genelde daha hızlıdır. Mergesort kararlıdır ama ek bir dizi ister.',
    },
    {
      q: 'Why is heapsort not stable?',
      qtr: 'Heapsort neden kararlı değil?',
      a: 'The root is swapped with the last key of the heap, which jumps over other keys. Two equal keys can end up in the opposite order, like 1a and 1b on the slide.',
      atr: 'Kök, heap’in son anahtarıyla yer değiştirir ve bu hamle diğer anahtarların üzerinden atlar. Slayttaki 1a ve 1b gibi iki eşit anahtar ters sırada kalabilir.',
    },
    {
      q: 'What is a min-heap?',
      qtr: 'Min-heap nedir?',
      a: 'The same structure with the opposite rule: every parent is smaller than or equal to its children, so the minimum is at the root. It is used when a smaller number means a higher priority.',
      atr: 'Aynı yapı, ters kuralla: her ebeveyn çocuklarından küçük ya da eşittir, bu yüzden en küçük eleman köktedir. Küçük sayının yüksek öncelik anlamına geldiği durumlarda kullanılır.',
    },
    {
      q: 'Why build bottom-up instead of inserting the keys one by one?',
      qtr: 'Neden anahtarları tek tek eklemek yerine aşağıdan yukarı kuruyoruz?',
      a: 'Inserting n keys one by one (top-down) can cost n log n. Bottom-up construction costs only O(n).',
      atr: 'n anahtarı tek tek eklemek (yukarıdan aşağı) n log n tutabilir. Aşağıdan yukarı kurmak sadece O(n) tutar.',
    },
    {
      q: 'AVL tree or 2-3 tree?',
      qtr: 'AVL ağacı mı, 2-3 ağacı mı?',
      a: 'Both keep the height at O(log n). AVL trees stay binary and fix the balance with rotations. 2-3 trees allow two keys in a node and fix overflows by splitting, so all leaves stay on the same level.',
      atr: 'İkisi de yüksekliği O(log n) tutar. AVL ağaçları ikili kalır ve dengeyi döndürmelerle (rotation) düzeltir. 2-3 ağaçları bir düğümde iki anahtara izin verir ve taşmayı bölünmeyle düzeltir, böylece tüm yapraklar aynı seviyede kalır.',
    },
    {
      q: 'Why is Gaussian elimination Θ(n³)?',
      qtr: 'Gauss eliminasyonu neden Θ(n³)?',
      a: 'There are three nested loops: one over the pivot rows, one over the rows below, and one over the columns. That gives about n³/3 multiplications.',
      atr: 'İç içe üç döngü var: pivot satırları, alttaki satırlar ve sütunlar üzerinde. Bu da yaklaşık n³/3 çarpma eder.',
    },
  ],
};
