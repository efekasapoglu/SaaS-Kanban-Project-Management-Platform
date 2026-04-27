# 🚀 TaskFlow | Modern Kanban & Ekip Yönetimi

TaskFlow, ekiplerin projelerini görselleştirmesi ve gerçek zamanlı işbirliği yapması için tasarlanmış, **Premium Dark Mode** estetiğine sahip yüksek performanslı bir Kanban uygulamasıdır.

## ✨ Temel Özellikler

- 🎨 **Premium Tasarım:** Cam morfolojisi (glassmorphism) ve dinamik geçişlerle donatılmış koyu tema.
- 🤝 **Ekip İşbirliği:** Paylaşılan link üzerinden anlık katılım ve ortak düzenleme (Editör Modu).
- ⚡ **AI Enhance:** Görev açıklamalarını yapay zeka ile otomatik zenginleştirme ve formatlama.
- 📝 **Markdown Desteği:** Görev detaylarında zengin metin düzenleme (başlıklar, listeler, kalın yazılar).
- 🎯 **Öncelik Yönetimi:** Renk kodlu (Yüksek, Orta, Düşük) öncelik rozetleri ile iş takibi.
- 🔄 **Canlı Sürükle-Bırak:** `dnd-kit` ile pürüzsüz ve hızlı görev yönetimi.
- 📜 **Aktivite Geçmişi:** Kimin, ne zaman, hangi değişikliği yaptığını takip eden şeffaf log sistemi.

## 🛠️ Teknoloji Yığını

- **Framework:** Next.js 15+ (App Router)
- **Veritabanı & Auth:** Supabase (PostgreSQL + RLS)
- **Styling:** Tailwind CSS 4 (Vibrant Dark Theme)
- **Drag & Drop:** dnd-kit
- **Dil:** TypeScript

- [📄 Kullanım Kılavuzu](docs/USAGE.md)
- [🏗️ Mimari Analiz (Reliability, Scalability, Reusability)](docs/ARCHITECTURE.md)

## 🚀 Hızlı Kurulum

### 1. Depoyu Klonlayın
```bash
git clone <repository-url>
cd Koc_Sistem
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Çevresel Değişkenleri Ayarlayın
`.env.local` dosyası oluşturun ve Supabase bilgilerinizi ekleyin:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Veritabanı Şemasını Uygulayın
`database/schema.sql` içerisindeki tüm kodları kopyalayıp Supabase **SQL Editor** kısmına yapıştırın ve **Run** tuşuna basın.

### 5. Uygulamayı Başlatın
```bash
npm run dev
```

Artık [http://localhost:3000](http://localhost:3000) adresinden uygulamaya erişebilirsiniz.

---
*Geliştiren: FalconEfo*
