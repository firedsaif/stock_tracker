import { Nav } from '@/components/nav'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="md:pl-56">
      <Nav />
      <main className="mx-auto w-full max-w-3xl pb-32 pt-5 md:px-8 md:pb-16 md:pt-10">{children}</main>
    </div>
  )
}
