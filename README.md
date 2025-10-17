# Datuum 2.0 - Advanced Data Visualization Platform

A modern, privacy-first data visualization platform powered by Python and WebAssembly technology. Upload your data, get instant insights, and create beautiful visualizations - all running locally in your browser.

## 🚀 Features

### Core Capabilities
- **Python-Powered Analytics**: Real Python libraries (Pandas, NumPy, SciPy) running in your browser
- **Interactive Visualizations**: Create stunning charts with Plotly.js - from simple bar charts to complex 3D visualizations
- **Privacy-First**: All processing happens locally in your browser. Your data never leaves your device
- **Multiple Formats**: Upload CSV, JSON, Excel files with automatic data type detection
- **AI-Powered Insights**: Automatic outlier detection, clustering, correlation analysis, and chart recommendations

### Chart Types
- **Bar Charts**: Compare values across categories
- **Line Charts**: Show trends and changes over time
- **Scatter Plots**: Show relationships between two variables
- **Pie Charts**: Show proportions of a whole
- **Histograms**: Show distribution of a single variable
- **Box Plots**: Show distribution and outliers
- **Heatmaps**: Show correlation matrix or 2D patterns

### Analytics Features
- **Descriptive Statistics**: Mean, median, standard deviation, quartiles
- **Correlation Analysis**: Pearson, Spearman correlation with significance testing
- **Regression Analysis**: Linear regression with feature importance
- **Hypothesis Testing**: t-tests, chi-square, ANOVA
- **Outlier Detection**: IQR, Z-score, Isolation Forest methods
- **Clustering**: K-means, DBSCAN algorithms
- **Time Series Analysis**: Trend analysis, seasonal decomposition, forecasting

## 🛠 Technology Stack

### Frontend
- **Next.js 15** + **React 19** + **TypeScript**
- **Tailwind CSS v4** + **Shadcn/ui** components
- **Plotly.js** + **D3.js** for visualizations
- **Framer Motion** for animations

### Python Runtime
- **Pyodide** (Python in WebAssembly)
- **Pandas** for data manipulation
- **NumPy** for numerical computing
- **SciPy** for statistical analysis
- **Scikit-learn** for machine learning
- **Matplotlib** + **Seaborn** for plotting

### State Management
- **Zustand** for global state management
- **LocalStorage** persistence
- **IndexedDB** for large data storage

## 📁 Project Structure

```
datuum2.0/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Landing page
│   │   └── workspace/
│   │       └── page.tsx            # Main workspace
│   ├── components/
│   │   ├── ui/                     # Shadcn/ui components
│   │   ├── ChartRenderer.tsx       # Plotly.js chart renderer
│   │   └── ChartSelector.tsx       # Chart type selector
│   ├── lib/
│   │   ├── pyodide-worker.ts       # Python Web Worker
│   │   ├── pyodide-bridge.ts       # React-Python bridge
│   │   └── python/                 # JavaScript wrappers
│   └── stores/                     # Zustand stores
├── public/
│   └── python/                     # Python modules
│       ├── data_processor.py
│       ├── statistics.py
│       ├── ml_insights.py
│       ├── chart_recommender.py
│       └── time_series.py
└── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

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

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
npm run export
```

The static files will be generated in the `out/` directory, ready for deployment to any static hosting service.

## 📊 Usage

### 1. Upload Data
- Navigate to the workspace
- Upload CSV, JSON, or Excel files
- Or try with sample data

### 2. Explore Data
- View data preview with automatic type detection
- See basic statistics and data quality metrics

### 3. Create Visualizations
- Choose from AI-recommended chart types
- Configure axes, colors, and styling
- Export charts as PNG, SVG, or PDF

### 4. Advanced Analytics
- Run statistical tests
- Detect outliers and patterns
- Perform clustering analysis
- Generate insights and recommendations

## 🔧 Development

### Adding New Chart Types

1. **Update ChartRenderer.tsx**
   ```typescript
   // Add new case in generatePlotData()
   case 'newChart':
     return [/* Plotly data config */];
   ```

2. **Update ChartSelector.tsx**
   ```typescript
   // Add to chartTypes array
   {
     id: 'newChart',
     name: 'New Chart',
     description: 'Chart description',
     icon: <NewIcon className="h-5 w-5" />,
     suitableFor: ['Use case 1', 'Use case 2']
   }
   ```

### Adding Python Modules

1. **Create Python file** in `public/python/`
2. **Create JavaScript wrapper** in `src/lib/python/`
3. **Update pyodide-worker.ts** to load the module

### State Management

The app uses Zustand stores for state management:

- **useDataStore**: Current dataset and metadata
- **useChartStore**: Chart configurations and history
- **useUIStore**: UI preferences and theme
- **useProjectStore**: Project management and persistence

## 🎨 Customization

### Themes
The app supports light, dark, and system themes. Customize colors in `src/app/globals.css`:

```css
:root {
  --primary: 221.2 83.2% 53.3%;
  --secondary: 210 40% 96%;
  /* ... other color variables */
}
```

### Chart Styling
Modify chart appearance in `ChartRenderer.tsx`:

```typescript
const generateLayout = (type: string, config: any) => {
  return {
    title: { font: { size: 16 } },
    margin: { l: 50, r: 50, t: 50, b: 50 },
    // ... other layout options
  };
};
```

## 🔒 Privacy & Security

- **No Data Upload**: All processing happens locally in your browser
- **No Tracking**: No analytics or user tracking
- **Local Storage**: Data is stored locally using browser APIs
- **WebAssembly**: Secure sandboxed execution environment

## 📈 Performance

- **Web Workers**: Python execution doesn't block the UI
- **Virtual Scrolling**: Handle large datasets efficiently
- **Lazy Loading**: Components load on demand
- **Code Splitting**: Optimized bundle sizes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Pyodide** team for bringing Python to the browser
- **Plotly.js** for excellent charting capabilities
- **Shadcn/ui** for beautiful component library
- **Vercel** for Next.js framework

## 🔮 Roadmap

### Phase 1 (Current)
- ✅ Core Python integration
- ✅ Basic chart types
- ✅ Data upload and preview
- ✅ State management

### Phase 2 (Next)
- [ ] Advanced data transformations
- [ ] More chart types (3D, network, geographic)
- [ ] Export to multiple formats
- [ ] Project sharing

### Phase 3 (Future)
- [ ] Real-time data connections
- [ ] Collaborative features
- [ ] Plugin system
- [ ] Advanced ML models

---

Built with ❤️ for the data visualization community. Happy analyzing! 📊✨
