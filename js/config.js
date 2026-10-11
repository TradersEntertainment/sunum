/* Presentation settings. Put your name here and it appears on the title slide.
 * Sunum ayarları: adınızı buraya yazın, başlık slaytında görünür. */
window.CONFIG = {
  presenter: '',                                   // e.g. 'Ömer Yılmaz'
  course: 'CMP3005 · Analysis of Algorithms',
  chapter: { en: 'Chapter 6', tr: 'Bölüm 6' },
  source: 'A. Levitin, Introduction to the Design & Analysis of Algorithms, Ch. 6',

  /* The talk: the ids of the slides that are presented, in this order (8 slides, ~5½ min).
   * Every other slide stays in the site as a backup slide for questions: press O (overview)
   * or add #slide-id to the address. After changing this list, run
   * `node tools/build-speech.js` to rebuild the speech files.
   * Sunum: sunulacak slaytların id'leri, bu sırayla. Diğer tüm slaytlar soru gelirse
   * kullanmak için yedekte durur: O (genel bakış) tuşu ya da adrese #slayt-id.
   * `agenda: null` = tüm bölüm (21 slayt, ~10 dk).
   * All ids / Tüm id'ler: title, big-idea, presorting, gauss, bst-problem, avl, two-three,
   * heap-intro, heap-def, heap-array, heap-build, heapsort, heap-analysis, priority-queue,
   * heap-real, horner, binexp, reduction, paths, summary, thanks (+ playground, sort-bound,
   * avl-rotations) */
  agenda: ['title', 'heap-def', 'heap-array', 'heap-build', 'heapsort', 'heap-analysis', 'priority-queue', 'heap-real'],
};
