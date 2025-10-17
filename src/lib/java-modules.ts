/**
 * Data Processing Modules for Datuum 2.0
 * 
 * Pure TypeScript implementation of data parsing, statistical analysis,
 * and chart recommendation functionality.
 * 
 * Replaces the previous Java/TeaVM modules with native TypeScript.
 */

// TypeScript interfaces
export interface ParsedData {
  headers: string[]
  rows: string[][]
  metadata: {
    rowCount: number
    columnCount: number
    format: string
  }
  errors: string[]
}

export interface ChartRecommendation {
  chartType: string
  confidence: number
  reasoning: string
  configuration?: Record<string, any>
  alternativeCharts?: string[]
  dataInsights?: string[]
}

export class ChartRecommendationImpl implements ChartRecommendation {
  chartType: string
  confidence: number
  reasoning: string
  configuration?: Record<string, any>
  alternativeCharts?: string[]
  dataInsights?: string[]

  constructor(chartType: string, confidence: number, reasoning: string) {
    this.chartType = chartType
    this.confidence = confidence
    this.reasoning = reasoning
    this.configuration = {}
    this.alternativeCharts = []
    this.dataInsights = []
  }
}

export interface Statistics {
  mean: number
  median: number
  mode: number
  standardDeviation: number
  variance: number
  min: number
  max: number
  range: number
  quartile25: number
  quartile75: number
  skewness: number
  kurtosis: number
}

export interface CorrelationResult {
  correlation: number
  rSquared: number
  interpretation: string
}

export class DataParser {
  static parseCSV(content: string): ParsedData {
    const result: ParsedData = {
      headers: [],
      rows: [],
      metadata: { rowCount: 0, columnCount: 0, format: 'CSV' },
      errors: []
    }
    
    try {
      const lines = content.split('\n')
      if (lines.length === 0) {
        result.errors.push('Empty CSV content')
        return result
      }
      
      // Parse headers
      result.headers = this.parseCSVLine(lines[0])
      
      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue
        const row = this.parseCSVLine(lines[i])
        if (row.length === result.headers.length) {
          result.rows.push(row)
        } else {
          result.errors.push(`Row ${i + 1} has incorrect number of columns`)
        }
      }
      
      // Add metadata
      result.metadata.rowCount = result.rows.length
      result.metadata.columnCount = result.headers.length
      result.metadata.format = 'CSV'
      
    } catch (error) {
      result.errors.push(`CSV parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    return result
  }

  static parseJSON(content: string): ParsedData {
    const result: ParsedData = {
      headers: [],
      rows: [],
      metadata: { rowCount: 0, columnCount: 0, format: 'JSON' },
      errors: []
    }
    
    if (!content || content.trim() === '') {
      result.errors.push('Empty JSON content')
      return result
    }
    
    try {
      // Simplified JSON parsing - expects array of objects
      const trimmed = content.trim()
      if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) {
        result.errors.push('JSON must be an array of objects')
        return result
      }
      
      if (trimmed.length <= 2) {
        result.errors.push('Empty JSON array')
        return result
      }
      
      // Remove brackets and split by objects
      const contentWithoutBrackets = trimmed.substring(1, trimmed.length - 1)
      const objects = contentWithoutBrackets.split('},{')
      
      if (objects.length === 0) {
        result.errors.push('Empty JSON array')
        return result
      }
      
      // Parse first object to get headers
      const firstObject = objects[0].startsWith('{') ? objects[0] : '{' + objects[0]
      const firstRow = this.parseJSONObject(firstObject)
      result.headers = Object.keys(firstRow)
      
      if (result.headers.length === 0) {
        result.errors.push('No valid headers found in JSON')
        return result
      }
      
      // Parse all objects
      for (const obj of objects) {
        if (!obj || obj.trim() === '') continue
        const objStr = obj.startsWith('{') ? obj : '{' + obj
        const objFinal = objStr.endsWith('}') ? objStr : objStr + '}'
        
        const rowData = this.parseJSONObject(objFinal)
        const row: string[] = []
        for (const header of result.headers) {
          row.push(rowData[header] || '')
        }
        result.rows.push(row)
      }
      
      result.metadata.rowCount = result.rows.length
      result.metadata.columnCount = result.headers.length
      result.metadata.format = 'JSON'
      
    } catch (error) {
      result.errors.push(`JSON parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    return result
  }

  static detectColumnTypes(data: ParsedData): string[] {
    if (data.headers.length === 0) return []
    
    const types: string[] = []
    
    for (let col = 0; col < data.headers.length; col++) {
      types[col] = this.detectColumnType(data, col)
    }
    
    return types
  }

  static validateData(data: ParsedData): string[] {
    const errors: string[] = []
    
    if (data.headers.length === 0) {
      errors.push('No headers found')
      return errors
    }
    
    for (let i = 0; i < data.rows.length; i++) {
      const row = data.rows[i]
      if (row.length !== data.headers.length) {
        errors.push(`Row ${i + 1} has ${row.length} columns, expected ${data.headers.length}`)
      }
    }
    
    return errors
  }

  // Helper methods
  private static parseCSVLine(line: string): string[] {
    if (!line) return []
    
    const fields: string[] = []
    let inQuotes = false
    let currentField = ''
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        fields.push(currentField.trim())
        currentField = ''
      } else {
        currentField += char
      }
    }
    
    fields.push(currentField.trim())
    return fields
  }
  
  private static parseJSONObject(json: string): Record<string, string> {
    const result: Record<string, string> = {}
    
    if (!json || json.trim() === '') return result
    
    const trimmed = json.trim()
    if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
      return result
    }
    
    try {
      const content = trimmed.substring(1, trimmed.length - 1)
      const pairs = content.split(',')
      
      for (const pair of pairs) {
        if (!pair || pair.trim() === '') continue
        const keyValue = pair.split(':')
        if (keyValue.length === 2) {
          const key = keyValue[0].trim().replace(/"/g, '')
          const value = keyValue[1].trim().replace(/"/g, '')
          if (key) {
            result[key] = value
          }
        }
      }
    } catch (error) {
      return {}
    }
    
    return result
  }
  
  private static detectColumnType(data: ParsedData, columnIndex: number): string {
    if (data.rows.length === 0 || columnIndex < 0 || columnIndex >= data.headers.length) {
      return 'string'
    }
    
    let numberCount = 0
    let dateCount = 0
    let booleanCount = 0
    let totalCount = 0
    
    for (const row of data.rows) {
      if (!row || columnIndex >= row.length) continue
      
      const value = row[columnIndex]
      if (!value || value.trim() === '') continue
      
      totalCount++
      
      if (this.isNumber(value)) {
        numberCount++
      } else if (this.isDate(value)) {
        dateCount++
      } else if (this.isBoolean(value)) {
        booleanCount++
      }
    }
    
    if (totalCount === 0) return 'string'
    
    const numberRatio = numberCount / totalCount
    const dateRatio = dateCount / totalCount
    const booleanRatio = booleanCount / totalCount
    
    if (numberRatio >= 0.8) return 'number'
    if (dateRatio >= 0.8) return 'date'
    if (booleanRatio >= 0.8) return 'boolean'
    
    return 'string'
  }
  
  private static isNumber(value: string): boolean {
    return !isNaN(Number(value))
  }
  
  private static isDate(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) ||
           /^\d{2}\/\d{2}\/\d{4}$/.test(value) ||
           /^\d{2}-\d{2}-\d{4}$/.test(value)
  }
  
  private static isBoolean(value: string): boolean {
    const lower = value.toLowerCase()
    return lower === 'true' || lower === 'false' ||
           lower === 'yes' || lower === 'no' ||
           lower === '1' || lower === '0'
  }
}

export class ChartRecommendationEngine {
  static analyze(data: ParsedData): ChartRecommendation[] {
    const recommendations: ChartRecommendation[] = []
    
    if (data.rows.length === 0) return recommendations
    
    const characteristics = this.analyzeData(data)
    
    // Time series analysis
    if (characteristics.hasTimeSeries) {
      recommendations.push(this.analyzeTimeSeries(characteristics, data))
    }
    
    // Categorical data analysis
    if (characteristics.hasCategories) {
      recommendations.push(...this.analyzeCategorical(characteristics, data))
    }
    
    // Numeric data analysis
    if (characteristics.hasNumericData) {
      recommendations.push(...this.analyzeNumeric(characteristics, data))
    }
    
    // Correlation analysis
    if (characteristics.numericColumnCount >= 2) {
      recommendations.push(this.analyzeCorrelation(characteristics, data))
    }
    
    // Distribution analysis
    if (characteristics.hasNumericData) {
      recommendations.push(this.analyzeDistribution(characteristics, data))
    }
    
    // Sort by confidence
    return recommendations.sort((a, b) => b.confidence - a.confidence)
  }

  private static analyzeData(data: ParsedData): any {
    const columnTypes = DataParser.detectColumnTypes(data)
    
    // Count numeric columns
    let numericColumnCount = 0
    for (const type of columnTypes) {
      if (type === 'number') {
        numericColumnCount++
      }
    }
    
    return {
      rowCount: data.rows.length,
      columnCount: data.headers.length,
      headers: data.headers,
      columnTypes,
      hasTimeSeries: this.hasTimeSeriesPattern(data),
      hasCategories: this.hasCategoricalData(data),
      hasNumericData: numericColumnCount > 0,
      categoryCount: this.countUniqueCategories(data),
      numericColumnCount,
      dataDensity: this.calculateDataDensity(data)
    }
  }
  
  private static analyzeTimeSeries(characteristics: any, data: ParsedData): ChartRecommendation {
    if (characteristics.rowCount < 10) {
      return new ChartRecommendationImpl('Line Chart', 0.6, 'Small time series dataset')
    }
    
    let confidence = 0.9
    if (characteristics.numericColumnCount > 1) {
      confidence = 0.95
    }
    
    const rec = new ChartRecommendationImpl('Line Chart', confidence, 
      `Time series data detected with ${characteristics.rowCount} data points`)
    rec.configuration = {
      showTrend: true,
      smooth: characteristics.rowCount > 50
    }
    
    return rec
  }
  
  private static analyzeCategorical(characteristics: any, data: ParsedData): ChartRecommendation[] {
    const recommendations: ChartRecommendation[] = []
    
    if (characteristics.categoryCount <= 10) {
      const confidence = characteristics.categoryCount <= 5 ? 0.9 : 0.7
      const barChart = new ChartRecommendationImpl('Bar Chart', confidence, 
        `Categorical data with ${characteristics.categoryCount} categories`)
      barChart.configuration = { orientation: 'vertical' }
      recommendations.push(barChart)
    }
    
    if (characteristics.categoryCount > 10 && characteristics.categoryCount <= 20) {
      const pieChart = new ChartRecommendationImpl('Pie Chart', 0.6, 
        `Many categories (${characteristics.categoryCount}) suitable for pie chart`)
      recommendations.push(pieChart)
    }
    
    if (this.hasLongCategoryNames(data)) {
      const hBarChart = new ChartRecommendationImpl('Horizontal Bar Chart', 0.8, 
        'Long category names detected, horizontal layout recommended')
      hBarChart.configuration = { orientation: 'horizontal' }
      recommendations.push(hBarChart)
    }
    
    return recommendations
  }
  
  private static analyzeNumeric(characteristics: any, data: ParsedData): ChartRecommendation[] {
    const recommendations: ChartRecommendation[] = []
    
    if (characteristics.numericColumnCount === 1) {
      const histogram = new ChartRecommendationImpl('Histogram', 0.8, 
        'Single numeric column suitable for distribution analysis')
      histogram.configuration = { bins: Math.min(20, characteristics.rowCount / 10) }
      recommendations.push(histogram)
      
      const boxPlot = new ChartRecommendationImpl('Box Plot', 0.7, 
        'Numeric data suitable for statistical summary')
      recommendations.push(boxPlot)
    }
    
    if (characteristics.numericColumnCount === 2) {
      const scatterPlot = new ChartRecommendationImpl('Scatter Plot', 0.9, 
        'Two numeric columns ideal for correlation analysis')
      scatterPlot.configuration = { showTrendLine: true }
      recommendations.push(scatterPlot)
    }
    
    if (characteristics.numericColumnCount > 2) {
      const heatmap = new ChartRecommendationImpl('Heatmap', 0.7, 
        'Multiple numeric columns suitable for correlation heatmap')
      recommendations.push(heatmap)
    }
    
    return recommendations
  }
  
  private static analyzeCorrelation(characteristics: any, data: ParsedData): ChartRecommendation {
    const correlation = this.calculateCorrelation(data)
    
    if (Math.abs(correlation) > 0.7) {
      return new ChartRecommendationImpl('Scatter Plot', 0.95, 
        `Strong correlation (${correlation.toFixed(2)}) detected between numeric columns`)
    } else if (Math.abs(correlation) > 0.3) {
      return new ChartRecommendationImpl('Scatter Plot', 0.8, 
        `Moderate correlation (${correlation.toFixed(2)}) detected`)
    } else {
      return new ChartRecommendationImpl('Scatter Plot', 0.6, 
        `Weak correlation (${correlation.toFixed(2)}) between numeric columns`)
    }
  }
  
  private static analyzeDistribution(characteristics: any, data: ParsedData): ChartRecommendation {
    const skewness = this.calculateSkewness(data)
    
    if (Math.abs(skewness) > 1) {
      return new ChartRecommendationImpl('Histogram', 0.8, 
        `Skewed distribution (skewness: ${skewness.toFixed(2)}) detected`)
    } else {
      return new ChartRecommendationImpl('Histogram', 0.7, 
        'Normal distribution suitable for histogram visualization')
    }
  }
  
  // Helper methods
  private static hasTimeSeriesPattern(data: ParsedData): boolean {
    if (data.headers.length === 0) return false
    
    const firstHeader = data.headers[0].toLowerCase()
    return firstHeader.includes('date') || firstHeader.includes('time') || 
           firstHeader.includes('year') || firstHeader.includes('month')
  }
  
  private static hasCategoricalData(data: ParsedData): boolean {
    const columnTypes = DataParser.detectColumnTypes(data)
    return columnTypes.some(type => type === 'string')
  }
  
  private static countUniqueCategories(data: ParsedData): number {
    const uniqueValues = new Set<string>()
    
    const columnTypes = DataParser.detectColumnTypes(data)
    for (const row of data.rows) {
      if (!row) continue
      for (let i = 0; i < Math.min(row.length, Math.min(data.headers.length, columnTypes.length)); i++) {
        const type = columnTypes[i]
        if (type === 'string' && row[i]) {
          uniqueValues.add(row[i])
        }
      }
    }
    
    return uniqueValues.size
  }
  
  private static calculateDataDensity(data: ParsedData): number {
    const totalCells = data.headers.length * data.rows.length
    let emptyCells = 0
    
    for (const row of data.rows) {
      if (!row) {
        emptyCells += data.headers.length
        continue
      }
      for (const cell of row) {
        if (!cell || cell.trim() === '') {
          emptyCells++
        }
      }
    }
    
    return (totalCells - emptyCells) / totalCells
  }
  
  private static hasLongCategoryNames(data: ParsedData): boolean {
    for (const row of data.rows) {
      if (!row) continue
      for (const cell of row) {
        if (cell && cell.length > 15) {
          return true
        }
      }
    }
    return false
  }
  
  private static calculateCorrelation(data: ParsedData): number {
    const xValues: number[] = []
    const yValues: number[] = []
    
    for (const row of data.rows) {
      if (!row || row.length < 2) continue
      try {
        const x = Number(row[0])
        const y = Number(row[1])
        if (!isNaN(x) && !isNaN(y)) {
          xValues.push(x)
          yValues.push(y)
        }
      } catch (error) {
        // Skip non-numeric values
      }
    }
    
    if (xValues.length < 2) return 0.0
    
    return StatisticalAnalysis.calculateCorrelation(xValues, yValues).correlation
  }
  
  private static calculateSkewness(data: ParsedData): number {
    const values: number[] = []
    
    for (const row of data.rows) {
      if (!row) continue
      for (const cell of row) {
        if (cell) {
          const value = Number(cell)
          if (!isNaN(value)) {
            values.push(value)
          }
        }
      }
    }
    
    if (values.length < 3) return 0.0
    
    const stats = StatisticalAnalysis.calculateStatistics(values)
    return stats.skewness
  }
}

export class StatisticalAnalysis {
  static calculateStatistics(values: number[]): Statistics {
    const stats: Statistics = {
      mean: 0, median: 0, mode: 0, standardDeviation: 0, variance: 0,
      min: 0, max: 0, range: 0, quartile25: 0, quartile75: 0,
      skewness: 0, kurtosis: 0
    }
    
    if (!values || values.length === 0) return stats
    
    // Filter out invalid values
    const validValues = values.filter(val => 
      val !== null && !isNaN(val) && isFinite(val)
    )
    
    if (validValues.length === 0) return stats
    
    // Sort values for median and quartile calculations
    const sortedValues = [...validValues].sort((a, b) => a - b)
    
    // Basic statistics
    stats.mean = this.calculateMean(validValues)
    stats.median = this.calculateMedian(sortedValues)
    stats.mode = this.calculateMode(validValues)
    stats.min = sortedValues[0]
    stats.max = sortedValues[sortedValues.length - 1]
    stats.range = stats.max - stats.min
    
    // Variance and standard deviation
    stats.variance = this.calculateVariance(validValues, stats.mean)
    stats.standardDeviation = Math.sqrt(stats.variance)
    
    // Quartiles
    stats.quartile25 = this.calculatePercentile(sortedValues, 25)
    stats.quartile75 = this.calculatePercentile(sortedValues, 75)
    
    // Skewness and kurtosis
    stats.skewness = this.calculateSkewness(validValues, stats.mean, stats.standardDeviation)
    stats.kurtosis = this.calculateKurtosis(validValues, stats.mean, stats.standardDeviation)
    
    return stats
  }
  
  static calculateCorrelation(xValues: number[], yValues: number[]): CorrelationResult {
    if (!xValues || !yValues || xValues.length !== yValues.length || xValues.length < 2) {
      return { correlation: 0, rSquared: 0, interpretation: 'Insufficient data' }
    }
    
    // Filter out invalid values
    const validX: number[] = []
    const validY: number[] = []
    
    for (let i = 0; i < xValues.length; i++) {
      const x = xValues[i]
      const y = yValues[i]
      if (x !== null && y !== null && !isNaN(x) && !isNaN(y) && 
          isFinite(x) && isFinite(y)) {
        validX.push(x)
        validY.push(y)
      }
    }
    
    if (validX.length < 2) {
      return { correlation: 0, rSquared: 0, interpretation: 'Insufficient valid data' }
    }
    
    const correlation = this.calculatePearsonCorrelation(validX, validY)
    return { correlation, rSquared: correlation * correlation, interpretation: this.interpretCorrelation(correlation) }
  }
  
  static linearRegression(xValues: number[], yValues: number[]): Record<string, number> {
    const result: Record<string, number> = {}
    
    if (!xValues || !yValues || xValues.length !== yValues.length || xValues.length < 2) {
      result.slope = 0
      result.intercept = 0
      result.rSquared = 0
      return result
    }
    
    // Filter out invalid values
    const validX: number[] = []
    const validY: number[] = []
    
    for (let i = 0; i < xValues.length; i++) {
      const x = xValues[i]
      const y = yValues[i]
      if (x !== null && y !== null && !isNaN(x) && !isNaN(y) && 
          isFinite(x) && isFinite(y)) {
        validX.push(x)
        validY.push(y)
      }
    }
    
    if (validX.length < 2) {
      result.slope = 0
      result.intercept = 0
      result.rSquared = 0
      return result
    }
    
    const n = validX.length
    const sumX = validX.reduce((sum, val) => sum + val, 0)
    const sumY = validY.reduce((sum, val) => sum + val, 0)
    let sumXY = 0
    let sumX2 = 0
    
    for (let i = 0; i < n; i++) {
      const x = validX[i]
      const y = validY[i]
      sumXY += x * y
      sumX2 += x * x
    }
    
    const denominator = n * sumX2 - sumX * sumX
    if (Math.abs(denominator) < 1e-10) {
      result.slope = 0
      result.intercept = sumY / n
      result.rSquared = 0
      return result
    }
    
    const slope = (n * sumXY - sumX * sumY) / denominator
    const intercept = (sumY - slope * sumX) / n
    
    // Calculate R-squared
    const correlation = this.calculatePearsonCorrelation(validX, validY)
    const rSquared = correlation * correlation
    
    result.slope = slope
    result.intercept = intercept
    result.rSquared = rSquared
    
    return result
  }
  
  static detectOutliers(values: number[]): number[] {
    const outliers: number[] = []
    
    if (!values || values.length < 4) return outliers
    
    // Filter out invalid values while preserving indices
    const validValues: number[] = []
    const validIndices: number[] = []
    
    for (let i = 0; i < values.length; i++) {
      const value = values[i]
      if (value !== null && !isNaN(value) && isFinite(value)) {
        validValues.push(value)
        validIndices.push(i)
      }
    }
    
    if (validValues.length < 4) return outliers
    
    const sortedValues = [...validValues].sort((a, b) => a - b)
    
    const q1 = this.calculatePercentile(sortedValues, 25)
    const q3 = this.calculatePercentile(sortedValues, 75)
    const iqr = q3 - q1
    
    if (iqr <= 0) return outliers
    
    const lowerBound = q1 - 1.5 * iqr
    const upperBound = q3 + 1.5 * iqr
    
    for (let i = 0; i < validValues.length; i++) {
      const value = validValues[i]
      if (value < lowerBound || value > upperBound) {
        outliers.push(validIndices[i])
      }
    }
    
    return outliers
  }
  
  static analyzeDistribution(values: number[]): Record<string, any> {
    const result: Record<string, any> = {}
    
    if (values.length === 0) return result
    
    const stats = this.calculateStatistics(values)
    
    // Distribution shape
    let shape = 'normal'
    if (Math.abs(stats.skewness) > 1) {
      shape = stats.skewness > 0 ? 'right-skewed' : 'left-skewed'
    } else if (Math.abs(stats.skewness) > 0.5) {
      shape = stats.skewness > 0 ? 'slightly right-skewed' : 'slightly left-skewed'
    }
    
    // Kurtosis interpretation
    let kurtosisType = 'mesokurtic'
    if (stats.kurtosis > 3) {
      kurtosisType = 'leptokurtic'
    } else if (stats.kurtosis < 3) {
      kurtosisType = 'platykurtic'
    }
    
    result.shape = shape
    result.kurtosisType = kurtosisType
    result.isNormal = Math.abs(stats.skewness) < 0.5 && Math.abs(stats.kurtosis - 3) < 1
    result.outlierCount = this.detectOutliers(values).length
    
    return result
  }
  
  // Helper methods
  private static calculateMean(values: number[]): number {
    if (!values || values.length === 0) return 0.0
    return values.reduce((sum, val) => sum + val, 0) / values.length
  }
  
  private static calculateMedian(sortedValues: number[]): number {
    if (!sortedValues || sortedValues.length === 0) return 0.0
    const size = sortedValues.length
    if (size % 2 === 0) {
      return (sortedValues[size / 2 - 1] + sortedValues[size / 2]) / 2.0
    } else {
      return sortedValues[Math.floor(size / 2)]
    }
  }
  
  private static calculateMode(values: number[]): number {
    const frequency = new Map<number, number>()
    values.forEach(val => {
      frequency.set(val, (frequency.get(val) || 0) + 1)
    })
    
    let maxFreq = 0
    let mode = 0
    frequency.forEach((freq, value) => {
      if (freq > maxFreq) {
        maxFreq = freq
        mode = value
      }
    })
    
    return mode
  }
  
  private static calculateVariance(values: number[], mean: number): number {
    if (!values || values.length === 0) return 0.0
    const sumSquaredDiffs = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0)
    return sumSquaredDiffs / values.length
  }
  
  private static calculatePercentile(sortedValues: number[], percentile: number): number {
    const size = sortedValues.length
    const index = (percentile / 100.0) * (size - 1)
    
    if (index === Math.floor(index)) {
      return sortedValues[index]
    } else {
      const lower = Math.floor(index)
      const upper = Math.ceil(index)
      const weight = index - lower
      return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight
    }
  }
  
  private static calculateSkewness(values: number[], mean: number, stdDev: number): number {
    if (stdDev === 0) return 0.0
    
    const sumCubed = values.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 3), 0)
    return sumCubed / values.length
  }
  
  private static calculateKurtosis(values: number[], mean: number, stdDev: number): number {
    if (stdDev === 0) return 0.0
    
    const sumFourth = values.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 4), 0)
    return (sumFourth / values.length) - 3 // Excess kurtosis
  }
  
  private static calculatePearsonCorrelation(xValues: number[], yValues: number[]): number {
    const n = xValues.length
    const sumX = xValues.reduce((sum, val) => sum + val, 0)
    const sumY = yValues.reduce((sum, val) => sum + val, 0)
    let sumXY = 0
    let sumX2 = 0
    let sumY2 = 0
    
    for (let i = 0; i < n; i++) {
      const x = xValues[i]
      const y = yValues[i]
      sumXY += x * y
      sumX2 += x * x
      sumY2 += y * y
    }
    
    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
    
    return denominator === 0 ? 0 : numerator / denominator
  }
  
  private static interpretCorrelation(corr: number): string {
    const abs = Math.abs(corr)
    if (abs >= 0.9) return 'Very strong correlation'
    if (abs >= 0.7) return 'Strong correlation'
    if (abs >= 0.5) return 'Moderate correlation'
    if (abs >= 0.3) return 'Weak correlation'
    return 'Very weak or no correlation'
  }
}

// Utility function to initialize modules
export function initializeModules(): void {
  console.log('Data processing modules initialized')
}

// Export all classes for easy importing
export {
  DataParser as DataParserModule,
  ChartRecommendationEngine as ChartRecommendationModule,
  StatisticalAnalysis as StatisticalAnalysisModule
}