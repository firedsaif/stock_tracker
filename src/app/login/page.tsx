import type { Metadata } from 'next'
import { BrandMark } from '@/components/nav'
import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Log in' }

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <BrandMark className="size-8" />
          <div>
            <h1 className="font-condensed text-2xl leading-none font-semibold tracking-tight">Stock Khata</h1>
            <p className="mt-1 text-sm text-ink-soft">Your stock, and who took what.</p>
          </div>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
