import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">Welcome to Your Next.js App!</h1>
      <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
        This is a starter template to help you get up and running quickly with Next.js, Tailwind CSS, and shadcn/ui.
      </p>
      <div className="mt-10 flex items-center justify-center gap-x-6">
        <Button asChild>
          <Link href="/about">Learn More About Us</Link>
        </Button>
        <Button variant="outline" asChild>
          <a href="https://nextjs.org/docs" target="_blank" rel="noopener noreferrer">
            Next.js Docs
          </a>
        </Button>
      </div>
    </div>
  )
}
