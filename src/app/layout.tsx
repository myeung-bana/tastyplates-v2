import type { Metadata } from 'next'
import { headers } from 'next/headers'
import '@/styles/global.scss'
import RootAppChrome from '@/components/layout/RootAppChrome'
import { generateMetadata as generateSEOMetadata, siteConfig } from '@/lib/seo'

const rootSeo = generateSEOMetadata({
  title: siteConfig.name,
  description: siteConfig.description,
  canonical: siteConfig.url,
  image: siteConfig.ogImage,
  type: 'website',
})

export const metadata: Metadata = {
  ...rootSeo,
  manifest: '/manifest.json',
  themeColor: '#ff7c0a',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: siteConfig.name,
  },
  icons: {
    icon: [
      {
        url: '/icons/Favicon_Orange_Square.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/icons/Favicon_Orange_Square.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    apple: '/icons/Favicon_Orange_Square.png',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const minimal = (await headers()).get('x-tp-minimal-layout') === '1'

  if (minimal) {
    return (
      <html lang="en">
        <body>{children}</body>
      </html>
    )
  }

  return (
    <html lang="en">
      <body>
        <RootAppChrome>{children}</RootAppChrome>
      </body>
    </html>
  )
}
