'use client'

import { useState } from 'react'
import { X, Upload, BarChart3, Download, Shield, Zap, Brain } from 'lucide-react'

interface HowItWorksModalProps {
  isOpen: boolean
  onClose: () => void
}

export function HowItWorksModal({ isOpen, onClose }: HowItWorksModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              How Datuum 2.0 Works
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-8">
            {/* Privacy First Section */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
                    Privacy-First Design
                  </h3>
                  <p className="text-blue-800 dark:text-blue-300">
                    Your data never leaves your browser. Everything is processed locally using advanced 
                    JavaScript libraries and native TypeScript modules, ensuring complete privacy and security.
                  </p>
                </div>
              </div>
            </div>

            {/* How It Works Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                  <Upload className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  1. Upload Your Data
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Drag and drop your CSV, JSON, or Excel files. Our intelligent parser automatically 
                  detects data types and structures.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-4">
                  <Brain className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  2. Smart Analysis
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Our intelligent engine analyzes your data structure and recommends the best chart types 
                  with confidence scores and reasoning.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-4">
                  <BarChart3 className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  3. Create & Customize
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Choose from recommended charts or select manually. Customize colors, 
                  fonts, dimensions, and animations to your liking.
                </p>
              </div>
            </div>

            {/* Advanced Features */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Advanced Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <span className="text-gray-700 dark:text-gray-300">Real-time data transformation</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Download className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700 dark:text-gray-300">Export in multiple formats</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-blue-500" />
                  <span className="text-gray-700 dark:text-gray-300">Local project management</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Brain className="h-5 w-5 text-purple-500" />
                  <span className="text-gray-700 dark:text-gray-300">Smart chart recommendations</span>
                </div>
              </div>
            </div>

            {/* Technology Stack */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Technology Stack
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm font-medium text-blue-900 dark:text-blue-200">Next.js 15</div>
                  <div className="text-xs text-blue-700 dark:text-blue-300">React Framework</div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-sm font-medium text-green-900 dark:text-green-200">Chart.js</div>
                  <div className="text-xs text-green-700 dark:text-green-300">Visualization</div>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-sm font-medium text-purple-900 dark:text-purple-200">TypeScript</div>
                  <div className="text-xs text-purple-700 dark:text-purple-300">Data Processing</div>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-sm font-medium text-orange-900 dark:text-orange-200">IndexedDB</div>
                  <div className="text-xs text-orange-700 dark:text-orange-300">Local Storage</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

