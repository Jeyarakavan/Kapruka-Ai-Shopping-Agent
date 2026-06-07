import './globals.css';
import ErrorBoundary from '@/components/ErrorBoundary';

export const metadata = {
  title: 'Kapruka Genie — AI Shopping Assistant for Sri Lanka',
  description:
    "Sri Lanka's most intelligent shopping assistant. Find products, gifts, and more on Kapruka.com with AI-powered recommendations, instant delivery checks, and seamless checkout.",
  keywords: 'Kapruka, Sri Lanka shopping, AI assistant, gifts, online shopping, delivery',
  openGraph: {
    title: 'Kapruka Genie — AI Shopping Assistant',
    description: 'Your AI-powered shopping genie for Sri Lanka',
    type: 'website',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#06080f',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
