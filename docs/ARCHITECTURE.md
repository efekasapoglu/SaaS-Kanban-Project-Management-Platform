# 🏗️ TaskFlow | Mimari ve Kalite Analizi

Bu döküman; projenin **Güvenilirlik (Reliability)**, **Ölçeklenebilirlik (Scalability)** ve **Yeniden Kullanılabilirlik (Reusability)** prensiplerine göre denetim sonuçlarını içerir.

---

## 1. Güvenilirlik (Reliability)
*Sistemin tutarlı çalışması ve veri güvenliği.*

- **Veri Güvenliği (RLS):** Fixed RLS politikaları sayesinde, her kullanıcı sadece yetkisi olan panoları görebilir. `SECURITY DEFINER` fonksiyonu ile döngüsel bağımlılıklar kırılarak veritabanı kilitlenmeleri önlenmiştir.
- **Tip Güvenliği (TypeScript):** Projenin tamamı TypeScript ile yazılmıştır. `any` tiplerinden arındırılmış olması, çalışma zamanında (runtime) oluşabilecek beklenmedik çökmeleri engeller.
- **Server-Side Validation:** `Server Actions` kullanılarak veri doğrulaması sunucu tarafında yapılır. İstemci (client) manipülasyonlarına karşı korumalıdır.
- **Hata Yönetimi:** Pano ve görev işlemlerinde `try-catch` blokları ve `error` state'leri ile kullanıcıya anlamlı geri bildirimler verilir.

## 2. Ölçeklenebilirlik (Scalability)
*Sistemin artan veri ve kullanıcı yükünü kaldırabilme kapasitesi.*

- **Spaced Integer Algoritması:** Görev ve sütun sıralama işlemlerinde kullanılan kesirli indeksleme (Double Precision) sayesinde, binlerce kart olsa bile araya eleman eklemek `(O)1` zaman karmaşıklığındadır. Tüm listeyi yeniden numaralandırmaya (O(N)) gerek kalmaz.
- **Serverless Hazırlığı:** Next.js App Router mimarisi sayesinde uygulama Vercel/AWS gibi ortamlarda global olarak ölçeklenebilir (Edge Runtime desteği).
- **Veritabanı Katmanı:** PostgreSQL (Supabase) kullanımı, projenin milyonlarca satır veriye kadar performans kaybı yaşamadan büyümesini sağlar.
- **Modular Data Fetching:** `initialColumns` ve `initialTasks` props'ları üzerinden veri akışı sağlanarak "Prop Drilling" önlenmiş ve bileşenler arası veri tutarlılığı optimize edilmiştir.

## 3. Yeniden Kullanılabilirlik (Reusability)
*Kodun farklı yerlerde veya projelerde tekrar kullanılabilme kolaylığı.*

- **Atomic Component Yapısı:** 
  - `TaskCard`: Her türlü kart görünümü için bağımsız bir birimdir.
  - `Column`: Herhangi bir liste yapısı için adapte edilebilir.
  - `CreateBoardModal`: Benzer form yapıları için şablon olarak kullanılabilir.
- **Merkezi Tip Yönetimi:** `src/types/index.ts` dosyası tüm projede ortak dil konuşulmasını sağlar.
- **Dnd-Utils:** Sıralama algoritması (`calculateNewOrder`) sadece Kanban'da değil, herhangi bir sürükle-bırak sıralama listesinde tekrar kullanılabilir.
- **CSS Design System:** `globals.css` içindeki CSS değişkenleri (Variables) sayesinde tema değişikliği tek bir noktadan yapılabilir.

---

### 🚀 Gelişim Tavsiyeleri
- **Reliability:** İleride `Sentry` gibi bir hata izleme aracı entegre edilebilir.
- **Scalability:** Çok büyük panolar için "Virtual Scrolling" (Sadece ekrandaki kartları render etme) eklenebilir.
- **Reusability:** UI bileşenleri `Shadcn/UI` veya `Radix` gibi kütüphanelerle daha da standardize edilebilir.
