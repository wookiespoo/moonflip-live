import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '@/styles/premium.css'
import { WalletProvider } from '@/components/WalletProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { SentryInit } from '@/components/SentryInit'
import { OracleBanner } from '@/components/OracleBanner'
import { NetworkIndicator } from '@/components/NetworkIndicator'
import { PremiumBackground } from '@/components/PremiumUI'
import { LowBankrollBanner } from '@/components/HouseBankrollCounter'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MoonFlip.live - 60-Second Memecoin Flips',
  description: 'Bet on Solana memecoin price direction in 60 seconds. Instant 1.90x payouts.',
  keywords: 'solana, memecoin, gambling, crypto, flip, moonflip',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  openGraph: {
    title: 'MoonFlip.live - 60-Second Memecoin Flips',
    description: 'Bet on Solana memecoin price direction in 60 seconds. Instant 1.90x payouts.',
    images: ['/moonflip-og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MoonFlip.live - 60-Second Memecoin Flips',
    description: 'Bet on Solana memecoin price direction in 60 seconds. Instant 1.90x payouts.',
    images: ['/moonflip-og.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="premium-dark">
      <body className={`${inter.className} bg-solana-dark text-white`}>
        <SentryInit />
        <ErrorBoundary>
          <WalletProvider>
            <PremiumBackground variant="solana" particleCount={100} />
            <OracleBanner />
            <NetworkIndicator />
            <LowBankrollBanner />
            {children}
          </WalletProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}