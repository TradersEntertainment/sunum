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

  /* ---------------- ★ Heaps & Heapsort ---------------- */

  'heap-intro': {
    time: 12,
    cues: [],
    en: ['And now, the star of this chapter: <b>heaps and heapsort</b>. This is representation change at its best: we <b>think</b> of the keys as a tree, but we <b>store</b> them in a simple array.'],
    tr: ['Ve şimdi bu bölümün yıldızı: <b>heap ve heapsort</b>. Gösterimi değiştirmenin en güzel örneği: anahtarları bir ağaç gibi <b>düşünüyoruz</b>, ama basit bir dizide <b>saklıyoruz</b>.'],
  },

  'heap-def': {
    time: 45,
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
    time: 40,
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
    time: 55,
    cues: ['Parent 7: swap with 8', 'Parent 9: already OK ✓', 'Root 2: swap with 9', '2 keeps sinking: swap with 6', 'Done: heap 9 6 8 2 5 7'],
    en: [
      'How do we turn any list into a heap? We go <b>bottom-up</b>: we start at the last parent, fix each subtree, and move back toward the root. Our list is 2, 9, 7, 6, 5, 8.',
      '[click] The last parent is 7. Its bigger child is 8, so they swap. [click] Next is 9. It is already bigger than its children: nothing to do.',
      '[click] Now the root, 2. Its bigger child is 9: swap. [click] 2 is still too small, so it keeps sinking: it swaps with 6 and reaches a leaf.',
      '[click] Done. We have a heap, and the maximum, 9, sits at the root. The table on the right is exactly the one in our lecture slides.',
    ],
    tr: [
      'Herhangi bir listeyi nasıl heap’e çeviririz? <b>Aşağıdan yukarı</b> gideriz: son ebeveynden başlar, her alt ağacı düzeltir ve köke doğru geri geliriz. Listemiz 2, 9, 7, 6, 5, 8.',
      '[click] Son ebeveyn 7. Büyük çocuğu 8, o yüzden yer değiştirirler. [click] Sırada 9 var. Zaten çocuklarından büyük: bir şey yapmaya gerek yok.',
      '[click] Şimdi kök, yani 2. Büyük çocuğu 9: yer değiştir. [click] 2 hâlâ çok küçük, batmaya devam ediyor: 6 ile yer değiştirip bir yaprağa ulaşıyor.',
      '[click] Bitti. Artık bir heap’imiz var ve en büyük eleman 9 kökte. Sağdaki tablo, ders slaytlarımızdaki tablonun aynısı.',
    ],
  },

  'heapsort': {
    time: 55,
    cues: ['Swap root 9 with last; lock 9', 'Sift 7 down (swap with 8)', 'Autoplay the remaining removals', 'Sorted: 2 5 6 7 8 9'],
    en: [
      'Heapsort has two stages. Stage one builds the heap, which we just did. Stage two removes the maximum again and again.',
      '[click] Swap the root with the last key. Now 9 is in its final place, so we lock it, and the heap shrinks by one.',
      '[click] The new root, 7, is too small, so we sift it down: it swaps with its bigger child, 8. The heap is fixed again.',
      '[click] We repeat the same two moves: swap the max to the end, then sift down. Watch the sorted part grow on the right.',
      '[click] And the array is sorted: 2, 5, 6, 7, 8, 9. Notice that we never needed a second array.',
    ],
    tr: [
      'Heapsort iki aşamadan oluşur. Birinci aşama heap’i kurar, bunu az önce yaptık. İkinci aşama en büyük elemanı tekrar tekrar çıkarır.',
      '[click] Kökü son anahtarla değiştir. Artık 9 son yerinde, onu kilitliyoruz ve heap bir eleman küçülüyor.',
      '[click] Yeni kök 7 çok küçük, onu aşağı itiyoruz: büyük çocuğu 8 ile yer değiştiriyor. Heap yine düzgün.',
      '[click] Aynı iki hamleyi tekrarlıyoruz: en büyüğü sona taşı, sonra aşağı it. Sağda sıralı kısmın büyüdüğüne bakın.',
      '[click] Ve dizi sıralandı: 2, 5, 6, 7, 8, 9. Dikkat edin, hiç ikinci bir diziye ihtiyacımız olmadı.',
    ],
  },

  'heap-analysis': {
    time: 40,
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
    time: 30,
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

  /* ---------------- appendix ---------------- */

  'sort-bound': {
    en: ['If someone asks how fast sorting can be: every comparison sort needs about n log₂ n comparisons in the worst case (a decision tree with n! leaves has height ⌈log₂ n!⌉), and mergesort reaches that bound. [click] Presorting pays off when you search many times: after about log₂ n searches, sorting once and using binary search wins. [click]'],
    tr: ['Sıralamanın ne kadar hızlı olabileceği sorulursa: karşılaştırmaya dayalı her sıralama en kötü durumda yaklaşık n log₂ n karşılaştırma ister (n! yapraklı bir karar ağacının yüksekliği ⌈log₂ n!⌉’dir) ve mergesort bu sınıra ulaşır. [click] Önceden sıralama çok sayıda arama yapıldığında kazandırır: yaklaşık log₂ n aramadan sonra bir kez sıralayıp ikili arama yapmak kazanır. [click]'],
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
