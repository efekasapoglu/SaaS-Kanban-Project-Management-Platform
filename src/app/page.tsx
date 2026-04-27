import { redirect } from 'next/navigation'

export default function Home() {
  // Kök dizini doğrudan dashboard'a yönlendiriyoruz.
  // Eğer kullanıcı giriş yapmamışsa middleware onu /login sayfasına atacaktır.
  redirect('/dashboard')
}
