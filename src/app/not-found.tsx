import { Title } from './title'

export default function NotFound() {
  return (
    <main className="flex flex-col gap-4">
      <Title>The post could not be found</Title>

      <p>It might have been moved or deleted.</p>
    </main>
  )
}
