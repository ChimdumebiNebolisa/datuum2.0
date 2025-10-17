# Datuum 2.0 - Frontend-Only Data Visualization

A revolutionary data visualization platform that operates entirely in the browser, eliminating the need for backend servers, databases, or external APIs. Built with Next.js 15 and Java computational modules compiled via TeaVM.

## 🚀 Features

- **Zero Infrastructure**: No servers, databases, or external dependencies
- **Privacy-First**: All data processing occurs locally in the user's browser
- **Instant Deployment**: Static export ready for Vercel, Netlify, or any CDN
- **Enterprise-Grade Logic**: Java computational modules provide robust data processing
- **Modern UX**: React 18+ with TailwindCSS for responsive, accessible interfaces

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 15 (React 18+ with App Router)
- **Language**: TypeScript for type safety
- **Styling**: TailwindCSS for utility-first responsive design
- **Computational Engine**: Java modules compiled to JavaScript/WASM via TeaVM
- **Visualization**: Chart.js and D3.js for interactive charts
- **Storage**: IndexedDB for persistent local data storage

### Component Structure
```
src/
├── app/                    # Next.js App Router
├── components/             # React components
│   ├── Header.tsx         # Navigation and controls
│   ├── FileUpload.tsx     # Data upload interface
│   ├── ChartConfig.tsx    # Chart configuration panel
│   └── ChartCanvas.tsx    # Visualization canvas
├── lib/                   # Utility libraries
│   ├── java-modules.ts    # Java module integration
│   └── storage.ts         # IndexedDB storage layer
└── java-modules/          # Java source code
    ├── pom.xml           # Maven configuration
    └── src/main/java/    # Java modules
```

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ and npm
- Java 11+ and Maven 3.6+
- Git for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd datuum2.0
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Compile Java modules**
   ```bash
   # On Unix/Linux/macOS
   chmod +x scripts/build-java.sh
   ./scripts/build-java.sh
   
   # On Windows
   scripts\build-java.bat
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:3000`

### Development Workflow

1. **Java Module Changes**: Edit Java files in `java-modules/src/main/java/`
2. **Recompile**: Run the build script to update JavaScript modules
3. **Frontend Changes**: Edit React components and TypeScript files
4. **Hot Reload**: Next.js automatically reloads on file changes

## 📦 Build Process

### Complete Build Pipeline
```bash
# Build Java modules
npm run build:java

# Build Next.js application
npm run build

# Generate static export
npm run export
```

### Individual Commands
```bash
# Java modules only
npm run build:java

# Next.js only
npm run build

# Static export
npm run export
```

## 🚀 Deployment

### Vercel Deployment

1. **Connect to Vercel**
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Configure Build Settings**
   - Build Command: `npm run build:all`
   - Output Directory: `out`
   - Install Command: `npm install`

### Manual Static Export

1. **Build the application**
   ```bash
   npm run build:all
   ```

2. **Deploy static files**
   Upload the contents of the `out` directory to any static hosting service.

## 🔧 Configuration

### Next.js Configuration
The application is configured for static export in `next.config.js`:
- `output: 'export'` - Enables static export
- `trailingSlash: true` - Adds trailing slashes to URLs
- `images.unoptimized: true` - Disables image optimization for static export

### TeaVM Configuration
Java modules are configured in `java-modules/pom.xml`:
- Target directory: `../src/lib/java-modules`
- Minification enabled for production
- Source maps generated for debugging

## 📊 Java Modules

### Available Modules
- **DataParser**: Handles CSV, JSON, and XLSX parsing
- **ChartRecommendation**: Heuristic engine for chart type suggestions
- **StatisticalAnalysis**: Basic statistical functions

### Integration
Java modules are compiled to JavaScript and imported in `src/lib/java-modules.ts`:
```typescript
import { DataParser, ChartRecommendationEngine } from '@/lib/java-modules'

// Parse CSV data
const data = await DataParser.parseCSV(csvContent)

// Get chart recommendations
const recommendations = await ChartRecommendationEngine.analyze(data)
```

## 💾 Data Storage

### Local Storage
- **IndexedDB**: Persistent storage for user projects and configurations
- **No External APIs**: All data remains in the user's browser
- **Privacy Guaranteed**: Data never leaves the user's device

### Storage API
```typescript
import { storage } from '@/lib/storage'

// Save a project
await storage.saveProject(project)

// Load projects
const projects = await storage.getAllProjects()

// Export data
const exportBlob = await storage.exportData()
```

## 🎨 Customization

### Themes
The application supports light and dark themes using TailwindCSS:
- Toggle via the theme button in the header
- Preferences are saved to IndexedDB
- CSS variables defined in `src/app/globals.css`

### Chart Types
Supported chart types:
- Line Chart (time series)
- Bar Chart (categorical)
- Pie Chart (proportions)
- Scatter Plot (correlations)
- Area Chart (cumulative data)

## 🐛 Troubleshooting

### Common Issues

#### Java Module Compilation
- **Maven not found**: Install Maven and ensure it's in your PATH
- **Java version**: Ensure Java 11+ is installed
- **TeaVM errors**: Check Java source code for compilation errors

#### Next.js Build Issues
- **Memory errors**: Increase Node.js memory limit: `NODE_OPTIONS="--max-old-space-size=4096"`
- **Path issues**: Verify file paths in configurations
- **Dependency conflicts**: Check package.json for version conflicts

#### Browser Compatibility
- **IndexedDB not supported**: Use a modern browser with IndexedDB support
- **Canvas issues**: Ensure browser supports HTML5 Canvas
- **File API**: Modern browsers required for file upload functionality

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` and checking browser console for detailed error messages.

## 📈 Performance

### Optimization Features
- **Code Splitting**: Automatic code splitting with Next.js
- **Tree Shaking**: Unused code elimination
- **Minification**: JavaScript and CSS minification in production
- **Lazy Loading**: Components loaded on demand

### Performance Targets
- **Initial Load**: < 3 seconds on 3G connection
- **Data Processing**: < 1 second for datasets up to 10MB
- **Chart Rendering**: < 500ms for complex visualizations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [TeaVM](https://teavm.org/) - Java to JavaScript compiler
- [Chart.js](https://www.chartjs.org/) - Chart library
- [D3.js](https://d3js.org/) - Data visualization library
- [TailwindCSS](https://tailwindcss.com/) - CSS framework

---

*Built with ❤️ for the data visualization community*
