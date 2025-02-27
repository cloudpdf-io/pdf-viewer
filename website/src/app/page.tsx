import PDFViewer from '@/components/pdf-viewer'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl leading-20">
            <span className="block">Open Source PDF Viewer</span>
            <span className="block text-primary-500">for Modern Web Apps</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            A powerful PDF viewer that seamlessly integrates with any JavaScript project. Built for React, Vue, Angular, Svelte, or vanilla JavaScript.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="flex flex-row gap-6 justify-center items-center">
              <Link
                href="/docs/getting-started"
                className="flex items-center justify-center px-8 py-2 border border-transparent text-base font-medium rounded-md text-white bg-black hover:bg-black/80 md:py-4 md:text-lg md:px-10"
              >
                Get Started
              </Link>
              <Link
                href="/docs/getting-started"
                className="px-10 py-2 text-base text-gray-600 hover:text-gray-900 font-bold"
              >
                Github
              </Link>
            </div>
          </div>
        </div>
        <PDFViewer />
      </main>
    </div>
  ) 
}