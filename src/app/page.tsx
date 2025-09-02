'use client'

import { Button, Card, CardBody } from '@heroui/react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <section className="text-center py-16">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
          Welcome to Flemoji
        </h1>
        <p className="text-lg text-foreground/60 mb-8">
          Modern, accessible, and fast music streaming built with Next.js
        </p>
        <div className="flex gap-4 justify-center">
          <Button as={Link} href="/browse" color="primary" size="lg">
            Explore Music
          </Button>
          <Button as={Link} href="/register" variant="bordered" size="lg">
            Get Started
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-soft">
          <CardBody>
            <h3 className="font-semibold text-xl mb-2">Stream</h3>
            <p className="text-foreground/70">Play your favorite tracks with a sleek, responsive player.</p>
          </CardBody>
        </Card>
        <Card className="shadow-soft">
          <CardBody>
            <h3 className="font-semibold text-xl mb-2">Upload</h3>
            <p className="text-foreground/70">Share your music with the world using simple uploads.</p>
          </CardBody>
        </Card>
        <Card className="shadow-soft">
          <CardBody>
            <h3 className="font-semibold text-xl mb-2">Discover</h3>
            <p className="text-foreground/70">Find new artists and playlists curated for you.</p>
          </CardBody>
        </Card>
      </section>
    </main>
  )
}

