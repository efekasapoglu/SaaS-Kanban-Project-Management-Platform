// Spaced Integers (Kesirli İndeksleme) Algoritması Yardımcısı
// Veritabanında (O)1 zaman karmaşıklığı ile araya eleman eklememizi sağlar.

export function calculateNewOrder(
  prevOrder: number | null,
  nextOrder: number | null
): number {
  // Eğer liste boşsa, varsayılan bir başlangıç değeri ver
  if (prevOrder === null && nextOrder === null) {
    return 65536; // Keyfi bir başlangıç aralığı
  }

  // En başa ekleniyorsa (prevOrder yoksa)
  if (prevOrder === null && nextOrder !== null) {
    return nextOrder / 2;
  }

  // En sona ekleniyorsa (nextOrder yoksa)
  if (prevOrder !== null && nextOrder === null) {
    return prevOrder + 65536;
  }

  // İki eleman arasına ekleniyorsa (İkisinin ortalamasını al)
  return (prevOrder! + nextOrder!) / 2;
}
