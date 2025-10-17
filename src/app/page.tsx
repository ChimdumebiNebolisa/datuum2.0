import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Brain, Shield, Zap, FileText, Sparkles, ArrowRight } from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: <Brain className="h-6 w-6" />,
      title: "Python-Powered Analytics",
      description: "Real Python libraries (Pandas, NumPy, SciPy) running in your browser for advanced data analysis."
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Interactive Visualizations",
      description: "Create stunning charts with Plotly.js - from simple bar charts to complex 3D visualizations."
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Privacy-First",
      description: "All processing happens locally in your browser. Your data never leaves your device."
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Lightning Fast",
      description: "Modern WebAssembly technology delivers near-native performance for data processing."
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Multiple Formats",
      description: "Upload CSV, JSON, Excel files and get instant insights with automatic data type detection."
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "AI-Powered Insights",
      description: "Automatic outlier detection, clustering, correlation analysis, and chart recommendations."
    }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <span className="font-bold text-xl">Datuum 2.0</span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/workspace" className="text-sm font-medium transition-colors hover:text-primary">
                Workspace
              </Link>
              <Link href="#features" className="text-sm font-medium transition-colors hover:text-primary">
                Features
              </Link>
              <Link href="#about" className="text-sm font-medium transition-colors hover:text-primary">
                About
              </Link>
            </div>
            
            <div className="hidden md:flex items-center">
              <Button asChild>
                <Link href="/workspace">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button variant="outline" size="sm" asChild>
                <Link href="/workspace">
                  Get Started
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Advanced Data Visualization
            <span className="block text-primary-600 dark:text-primary-400">with Python Analytics</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto px-4">
            Upload your data, get instant insights, and create beautiful visualizations. 
            All powered by real Python libraries running in your browser.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
            <Button size="lg" asChild>
              <Link href="/workspace">
                Start Analyzing
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline">
              View Demo
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 px-4">
              Everything you need for professional data analysis and visualization
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Analyze Your Data?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 px-4">
              No installation required. No data upload to servers. 
              Just open your browser and start analyzing.
            </p>
            <Button size="lg" asChild>
              <Link href="/workspace">
                Launch Datuum 2.0
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="border-t bg-muted/30 py-12">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Datuum 2.0</h3>
              <p className="text-sm text-muted-foreground">
                Privacy-first data visualization platform powered by Python and WebAssembly technology.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Technology</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>Next.js 15 + React 19</li>
                <li>Pyodide (Python in Browser)</li>
                <li>Plotly.js + D3.js</li>
                <li>Tailwind CSS + Shadcn/ui</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Privacy</h3>
              <p className="text-sm text-muted-foreground">
                Your data never leaves your browser. All processing happens locally using WebAssembly.
              </p>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground px-4">
            <p>&copy; 2024 Datuum 2.0. Built with privacy and performance in mind.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
