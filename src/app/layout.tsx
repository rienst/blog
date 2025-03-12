import { Footer } from './footer'
import { Header } from './header'
import './styles.css'

export const metadata = {
  title: 'Rien Stenekes',
  description: 'Software engineer from the Netherlands.',
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="dark:bg-gray-950 dark:text-white">
        <div className="flex flex-col gap-12 max-w-screen-md px-4 py-12 mx-auto">
          <Header />

          {props.children}

          <Footer />
        </div>
      </body>
    </html>
  )
}
