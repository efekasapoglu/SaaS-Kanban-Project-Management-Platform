import Link from 'next/link'
import { login } from '../actions'

export default async function LoginPage(props: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const { error, message } = await props.searchParams
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white dark:bg-zinc-900 p-8 shadow-xl ring-1 ring-zinc-200 dark:ring-zinc-800">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">TaskFlow Giriş</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Hesabınıza giriş yaparak panolarınıza ulaşın.
          </p>
        </div>

        <form className="mt-8 space-y-6" action={login}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                E-posta Adresi
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 block w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                placeholder="ornek@email.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Şifre
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1 block w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-500 text-center bg-red-50 dark:bg-red-950/50 p-2 rounded">
              {error}
            </div>
          )}

          {message && (
            <div className="text-sm text-emerald-500 text-center bg-emerald-50 dark:bg-emerald-950/50 p-2 rounded">
              {message}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            >
              Giriş Yap
            </button>
          </div>
          <div className="text-sm text-center text-zinc-600 dark:text-zinc-400">
            Hesabınız yok mu?{' '}
            <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              Kayıt Olun
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
