'use client'

import { useEffect, useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { Button, Card, CardBody, Input, Divider } from '@heroui/react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const { status } = useSession()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const params = useSearchParams()
  const callbackUrl = params.get('callbackUrl') || '/dashboard'

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(callbackUrl)
    }
  }, [status, router, callbackUrl])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await signIn('credentials', { identifier, password, redirect: true, callbackUrl })
    setLoading(false)
    if (res && 'error' in res && res?.error) {
      setError('Invalid email or password')
      return
    }
  }

  const authError = params.get('error')

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
      
      <div className="relative w-full max-w-md mx-auto px-4 sm:px-6">
        <Card className="glass shadow-2xl border-0">
          <CardBody className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
              <p className="text-foreground/70">Sign in to your account to continue</p>
            </div>
            
            {(error || authError) && (
              <div className="mb-6 p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg">
                <p className="text-danger-600 dark:text-danger-400 text-sm text-center">{error || 'Authentication failed'}</p>
              </div>
            )}
            
            <form onSubmit={onSubmit} className="space-y-6">
              <Input
                label="Email or Username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                variant="bordered"
                size="lg"
                classNames={{
                  inputWrapper: "border-divider hover:border-primary/50 focus-within:border-primary",
                  input: "text-foreground"
                }}
                isRequired
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                variant="bordered"
                size="lg"
                classNames={{
                  inputWrapper: "border-divider hover:border-primary/50 focus-within:border-primary",
                  input: "text-foreground"
                }}
                isRequired
              />
              <Button 
                type="submit" 
                color="primary" 
                size="lg"
                className="w-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" 
                isLoading={loading}
              >
                Sign In
              </Button>
            </form>

            <Divider className="my-8" />

            <Button 
              variant="bordered" 
              size="lg"
              className="w-full border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 hover:scale-105 font-semibold" 
              onPress={() => signIn('google', { callbackUrl })}
            >
              Continue with Google
            </Button>
          </CardBody>
        </Card>
      </div>
    </main>
  )
}
