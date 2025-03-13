import { info } from '@/info'
import { Footer } from './footer'
import { Header } from './header'
import './styles.css'

export const metadata = {
  title: info.name,
  description: info.description,
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="dark:bg-gray-950 dark:text-white">
        <div className="flex flex-col gap-12 max-w-screen-md px-6 py-12 mx-auto">
          <Header />

          {props.children}

          <Footer />
        </div>
      </body>
    </html>
  )
}
