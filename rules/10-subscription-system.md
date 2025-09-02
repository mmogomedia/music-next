# Phase 10: Subscription System

## 🎯 Objective
Implement a comprehensive subscription system using Stripe that allows users to upgrade to premium features, manage their subscriptions, and access advanced analytics and platform features.

## 📋 Prerequisites
- Phase 1, 2, 3, 4, 5, 6, 7, 8, & 9 completed successfully
- Smart links system functional
- Analytics system working
- Stripe account and API keys configured

## 🚀 Step-by-Step Implementation

### 1. Install Stripe Dependencies

```bash
# Stripe integration
yarn add stripe
yarn add @stripe/stripe-js

# Payment forms and validation
yarn add react-stripe-js
yarn add @stripe/react-stripe-js
```

### 2. Stripe Configuration

#### `src/lib/stripe.ts`
```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
})

export const stripeConfig = {
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
}

export const subscriptionPlans = [
  {
    id: 'basic',
    name: 'Basic',
    price: 0,
    features: [
      'Stream unlimited music',
      'Basic analytics',
      'Create playlists',
      'Follow artists'
    ],
    stripePriceId: null
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 9.99,
    features: [
      'All Basic features',
      'Advanced analytics',
      'Premium content access',
      'Ad-free experience',
      'High-quality streaming',
      'Download tracks',
      'Exclusive artist content'
    ],
    stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID
  },
  {
    id: 'artist-pro',
    name: 'Artist Pro',
    price: 19.99,
    features: [
      'All Premium features',
      'Advanced artist analytics',
      'Smart link customization',
      'Priority support',
      'Featured placement',
      'Revenue sharing',
      'Marketing tools'
    ],
    stripePriceId: process.env.STRIPE_ARTIST_PRO_PRICE_ID
  }
]

export const getPlanById = (id: string) => {
  return subscriptionPlans.find(plan => plan.id === id)
}

export const getPlanByStripePriceId = (stripePriceId: string) => {
  return subscriptionPlans.find(plan => plan.stripePriceId === stripePriceId)
}
```

### 3. Subscription Management Store

#### `src/store/subscription-store.ts`
```typescript
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export interface Subscription {
  id: string
  status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'unpaid'
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  plan: string
}

export interface SubscriptionState {
  subscription: Subscription | null
  isLoading: boolean
  error: string | null
  
  // Actions
  setSubscription: (subscription: Subscription | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  refreshSubscription: () => Promise<void>
  cancelSubscription: () => Promise<void>
  reactivateSubscription: () => Promise<void>
}

export const useSubscriptionStore = create<SubscriptionState>()(
  immer((set, get) => ({
    subscription: null,
    isLoading: false,
    error: null,

    setSubscription: (subscription) => {
      set((state) => {
        state.subscription = subscription
      })
    },

    setLoading: (loading) => {
      set((state) => {
        state.isLoading = loading
      })
    },

    setError: (error) => {
      set((state) => {
        state.error = error
      })
    },

    refreshSubscription: async () => {
      set((state) => {
        state.isLoading = true
        state.error = null
      })

      try {
        const response = await fetch('/api/subscription/current')
        if (response.ok) {
          const data = await response.json()
          set((state) => {
            state.subscription = data.subscription
          })
        }
      } catch (error) {
        set((state) => {
          state.error = 'Failed to refresh subscription'
        })
      } finally {
        set((state) => {
          state.isLoading = false
        })
      }
    },

    cancelSubscription: async () => {
      set((state) => {
        state.isLoading = true
        state.error = null
      })

      try {
        const response = await fetch('/api/subscription/cancel', {
          method: 'POST'
        })
        
        if (response.ok) {
          await get().refreshSubscription()
        } else {
          const error = await response.json()
          set((state) => {
            state.error = error.message || 'Failed to cancel subscription'
          })
        }
      } catch (error) {
        set((state) => {
          state.error = 'Failed to cancel subscription'
        })
      } finally {
        set((state) => {
          state.isLoading = false
        })
      }
    },

    reactivateSubscription: async () => {
      set((state) => {
        state.isLoading = true
        state.error = null
      })

      try {
        const response = await fetch('/api/subscription/reactivate', {
          method: 'POST'
        })
        
        if (response.ok) {
          await get().refreshSubscription()
        } else {
          const error = await response.json()
          set((state) => {
            state.error = error.message || 'Failed to reactivate subscription'
          })
        }
      } catch (error) {
        set((state) => {
          state.error = 'Failed to reactivate subscription'
        })
      } finally {
        set((state) => {
          state.isLoading = false
        })
      }
    },
  }))
)
```

### 4. Pricing Page

#### `src/app/pricing/page.tsx`
```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { subscriptionPlans } from '@/lib/stripe'
import PricingCards from '@/components/subscription/PricingCards'
import { CheckIcon } from '@heroicons/react/24/outline'

export default async function PricingPage() {
  const session = await getServerSession(authOptions)

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Unlock premium features and take your music experience to the next level. 
            Choose the plan that best fits your needs.
          </p>
        </div>

        {/* Pricing Cards */}
        <PricingCards plans={subscriptionPlans} user={session?.user} />

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I cancel my subscription anytime?
              </h3>
              <p className="text-gray-600">
                Yes, you can cancel your subscription at any time. Your premium features will remain active until the end of your current billing period.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What happens if I downgrade my plan?
              </h3>
              <p className="text-gray-600">
                When you downgrade, you'll lose access to premium features at the end of your current billing period. Your data and playlists will be preserved.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-gray-600">
                We offer a 30-day money-back guarantee for all premium subscriptions. If you're not satisfied, contact our support team for a full refund.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I upgrade my plan later?
              </h3>
              <p className="text-gray-600">
                Absolutely! You can upgrade your plan at any time. The new features will be available immediately, and you'll be charged the prorated difference.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">
            Still have questions? We're here to help!
          </p>
          <a
            href="/support"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  )
}
```

### 5. Pricing Cards Component

#### `src/components/subscription/PricingCards.tsx`
```typescript
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { CheckIcon, StarIcon } from '@heroicons/react/24/solid'
import { subscriptionPlans } from '@/lib/stripe'

interface PricingCardsProps {
  plans: any[]
  user: any
}

export default function PricingCards({ plans, user }: PricingCardsProps) {
  const { data: session } = useSession()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubscribe = async (planId: string) => {
    if (!session) {
      // Redirect to login
      window.location.href = '/login?redirect=/pricing'
      return
    }

    if (planId === 'basic') {
      return // Basic plan is free
    }

    setIsLoading(true)
    setSelectedPlan(planId)

    try {
      const response = await fetch('/api/subscription/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          successUrl: `${window.location.origin}/subscription/success`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to create checkout session')
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
      setSelectedPlan(null)
    }
  }

  const isCurrentPlan = (planId: string) => {
    // This would check against the user's current subscription
    return false
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
      {plans.map((plan, index) => (
        <motion.div
          key={plan.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ y: -5 }}
          className={`relative bg-white rounded-2xl shadow-lg p-8 ${
            plan.id === 'premium' ? 'ring-2 ring-primary-500 scale-105' : ''
          }`}
        >
          {/* Popular Badge */}
          {plan.id === 'premium' && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-primary-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-1">
                <StarIcon className="w-4 h-4" />
                <span>Most Popular</span>
              </div>
            </div>
          )}

          {/* Plan Header */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {plan.name}
            </h3>
            <div className="mb-4">
              <span className="text-4xl font-bold text-gray-900">
                ${plan.price}
              </span>
              {plan.price > 0 && (
                <span className="text-gray-500">/month</span>
              )}
            </div>
            {plan.price === 0 && (
              <p className="text-gray-600">Free forever</p>
            )}
          </div>

          {/* Features */}
          <ul className="space-y-4 mb-8">
            {plan.features.map((feature: string, featureIndex: number) => (
              <li key={featureIndex} className="flex items-start space-x-3">
                <CheckIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>

          {/* Action Button */}
          <div className="text-center">
            {isCurrentPlan(plan.id) ? (
              <div className="px-6 py-3 bg-gray-100 text-gray-700 rounded-md font-medium">
                Current Plan
              </div>
            ) : (
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={isLoading && selectedPlan === plan.id}
                className={`w-full px-6 py-3 rounded-md font-medium transition-colors ${
                  plan.id === 'premium'
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : plan.id === 'basic'
                    ? 'bg-gray-600 text-white hover:bg-gray-700'
                    : 'bg-secondary-500 text-white hover:bg-secondary-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading && selectedPlan === plan.id ? (
                  'Processing...'
                ) : plan.price === 0 ? (
                  'Get Started'
                ) : (
                  'Subscribe Now'
                )}
              </button>
            )}
          </div>

          {/* Additional Info */}
          {plan.price > 0 && (
            <p className="text-xs text-gray-500 text-center mt-4">
              Cancel anytime. 30-day money-back guarantee.
            </p>
          )}
        </motion.div>
      ))}
    </div>
  )
}
```

### 6. Stripe Checkout API

#### `src/app/api/subscription/create-checkout/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe, getPlanById } from '@/lib/stripe'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { planId, successUrl, cancelUrl } = body

    if (!planId || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const plan = getPlanById(planId)
    if (!plan || !plan.stripePriceId) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      )
    }

    // Get or create Stripe customer
    let customerId = session.user.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email!,
        name: session.user.name!,
        metadata: {
          userId: session.user.id,
        },
      })

      customerId = customer.id

      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customerId }
      })
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: session.user.id,
        planId: planId,
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
          planId: planId,
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 7. Stripe Webhook Handler

#### `src/app/api/webhooks/stripe/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { stripe, stripeConfig } from '@/lib/stripe'
import { prisma } from '@/lib/db'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = headers().get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    let event: any

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        stripeConfig.webhookSecret
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object)
        break
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object)
        break
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object)
        break
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object)
        break
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutCompleted(session: any) {
  const { userId, planId } = session.metadata
  
  // Update user's subscription status
  await prisma.user.update({
    where: { id: userId },
    data: { 
      isPremium: true,
      // Add other premium flags based on plan
    }
  })
}

async function handleSubscriptionCreated(subscription: any) {
  const { userId, planId } = subscription.metadata
  
  // Create subscription record
  await prisma.subscription.create({
    data: {
      userId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      stripePriceId: subscription.items.data[0].price.id,
      status: subscription.status.toUpperCase(),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    }
  })
}

async function handleSubscriptionUpdated(subscription: any) {
  // Update subscription record
  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: subscription.status.toUpperCase(),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    }
  })
}

async function handleSubscriptionDeleted(subscription: any) {
  const { userId } = subscription.metadata
  
  // Update user's premium status
  await prisma.user.update({
    where: { id: userId },
    data: { isPremium: false }
  })
  
  // Update subscription record
  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: { status: 'CANCELED' }
  })
}

async function handlePaymentSucceeded(invoice: any) {
  // Handle successful payment
  console.log('Payment succeeded:', invoice.id)
}

async function handlePaymentFailed(invoice: any) {
  // Handle failed payment
  console.log('Payment failed:', invoice.id)
}
```

### 8. Subscription Management Page

#### `src/app/(dashboard)/subscription/page.tsx`
```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import SubscriptionDetails from '@/components/subscription/SubscriptionDetails'
import BillingHistory from '@/components/subscription/BillingHistory'

async function getSubscriptionData(userId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  })

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isPremium: true,
      stripeCustomerId: true,
    }
  })

  return { subscription, user }
}

export default async function SubscriptionPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  const { subscription, user } = await getSubscriptionData(session.user.id)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Subscription & Billing
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your subscription, update payment methods, and view billing history
          </p>
        </div>

        <div className="space-y-8">
          <SubscriptionDetails subscription={subscription} user={user} />
          <BillingHistory userId={session.user.id} />
        </div>
      </div>
    </div>
  )
}
```

## ✅ Testing Requirements

### Before Moving to Next Phase:
1. **Subscription creation works** - Can create Stripe checkout sessions
2. **Webhook handling functional** - Subscription events are processed correctly
3. **Premium features accessible** - Users can access premium content after subscription
4. **Billing management works** - Can view and manage subscription details
5. **Payment processing** - Stripe payments are processed successfully
6. **Subscription lifecycle** - Can cancel, reactivate, and upgrade subscriptions

### Test Commands:
```bash
# Test subscription flow
# 1. Create test subscription
# 2. Verify webhook processing
# 3. Test premium feature access
# 4. Verify billing management

# Test Stripe integration
# 1. Use Stripe test cards
# 2. Test webhook events
# 3. Verify customer creation
# 4. Test subscription updates
```

## 🚨 Common Issues & Solutions

### Issue: Stripe checkout not working
**Solution**: Verify API keys, check webhook configuration, validate price IDs

### Issue: Webhooks not processing
**Solution**: Check webhook endpoint, verify signature validation, test with Stripe CLI

### Issue: Premium features not accessible
**Solution**: Check subscription status, verify user premium flags, check database updates

### Issue: Payment failures
**Solution**: Verify Stripe account status, check payment method validation, test with valid cards

## 📝 Notes
- Use Stripe test mode for development
- Implement proper error handling for payment failures
- Consider adding subscription tiers and upgrades
- Implement usage-based billing if needed
- Add proper logging for webhook events

## 🔗 Next Phase
Once this phase is complete and tested, proceed to [Phase 11: Premium Analytics](./11-premium-analytics.md)
