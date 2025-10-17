/**
 * Sample Data for Datuum 2.0
 * 
 * Provides example datasets for users to try the application
 */

export interface SampleDataset {
  id: string
  name: string
  description: string
  category: string
  data: {
    headers: string[]
    rows: string[][]
    metadata: {
      rowCount: number
      columnCount: number
      format: string
    }
  }
  recommendedChart: string
  tags: string[]
}

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    id: 'sales-monthly',
    name: 'Monthly Sales Data',
    description: 'Sales performance over 12 months with revenue and units sold',
    category: 'Business',
    data: {
      headers: ['Month', 'Revenue', 'Units Sold', 'Growth Rate'],
      rows: [
        ['January', '45000', '1200', '5.2'],
        ['February', '52000', '1350', '15.6'],
        ['March', '48000', '1280', '-7.7'],
        ['April', '61000', '1520', '27.1'],
        ['May', '58000', '1450', '-4.9'],
        ['June', '67000', '1680', '15.5'],
        ['July', '72000', '1800', '7.5'],
        ['August', '69000', '1720', '-4.2'],
        ['September', '75000', '1880', '8.7'],
        ['October', '82000', '2050', '9.3'],
        ['November', '78000', '1950', '-4.9'],
        ['December', '95000', '2380', '21.8']
      ],
      metadata: {
        rowCount: 12,
        columnCount: 4,
        format: 'CSV'
      }
    },
    recommendedChart: 'line',
    tags: ['sales', 'revenue', 'time-series', 'business']
  },
  {
    id: 'product-categories',
    name: 'Product Category Performance',
    description: 'Sales breakdown by product categories',
    category: 'Business',
    data: {
      headers: ['Category', 'Sales', 'Market Share', 'Profit Margin'],
      rows: [
        ['Electronics', '125000', '35.2', '18.5'],
        ['Clothing', '89000', '25.1', '22.3'],
        ['Home & Garden', '67000', '18.9', '15.7'],
        ['Sports', '45000', '12.7', '20.1'],
        ['Books', '28000', '7.9', '12.4']
      ],
      metadata: {
        rowCount: 5,
        columnCount: 4,
        format: 'CSV'
      }
    },
    recommendedChart: 'bar',
    tags: ['products', 'categories', 'comparison', 'business']
  },
  {
    id: 'weather-temp',
    name: 'Temperature Trends',
    description: 'Daily temperature data for a month',
    category: 'Weather',
    data: {
      headers: ['Date', 'High', 'Low', 'Average', 'Humidity'],
      rows: [
        ['2024-01-01', '22', '8', '15', '65'],
        ['2024-01-02', '25', '10', '17.5', '58'],
        ['2024-01-03', '28', '12', '20', '52'],
        ['2024-01-04', '24', '9', '16.5', '71'],
        ['2024-01-05', '26', '11', '18.5', '63'],
        ['2024-01-06', '30', '14', '22', '45'],
        ['2024-01-07', '32', '16', '24', '38'],
        ['2024-01-08', '29', '13', '21', '55'],
        ['2024-01-09', '27', '12', '19.5', '67'],
        ['2024-01-10', '31', '15', '23', '49'],
        ['2024-01-11', '33', '17', '25', '42'],
        ['2024-01-12', '26', '10', '18', '73'],
        ['2024-01-13', '24', '8', '16', '81'],
        ['2024-01-14', '22', '6', '14', '88'],
        ['2024-01-15', '25', '9', '17', '69']
      ],
      metadata: {
        rowCount: 15,
        columnCount: 5,
        format: 'CSV'
      }
    },
    recommendedChart: 'line',
    tags: ['weather', 'temperature', 'time-series', 'environment']
  },
  {
    id: 'student-grades',
    name: 'Student Performance',
    description: 'Student grades across different subjects',
    category: 'Education',
    data: {
      headers: ['Student', 'Math', 'Science', 'English', 'History', 'Average'],
      rows: [
        ['Alice Johnson', '85', '92', '88', '90', '88.75'],
        ['Bob Smith', '78', '85', '82', '79', '81'],
        ['Carol Davis', '92', '89', '95', '87', '90.75'],
        ['David Wilson', '76', '81', '79', '83', '79.75'],
        ['Emma Brown', '88', '94', '91', '89', '90.5'],
        ['Frank Miller', '82', '87', '85', '88', '85.5'],
        ['Grace Lee', '95', '96', '93', '94', '94.5'],
        ['Henry Taylor', '71', '78', '75', '80', '76'],
        ['Ivy Chen', '89', '91', '87', '92', '89.75'],
        ['Jack Anderson', '83', '86', '84', '85', '84.5']
      ],
      metadata: {
        rowCount: 10,
        columnCount: 6,
        format: 'CSV'
      }
    },
    recommendedChart: 'bar',
    tags: ['education', 'grades', 'students', 'performance']
  },
  {
    id: 'website-traffic',
    name: 'Website Traffic Sources',
    description: 'Traffic sources and their performance metrics',
    category: 'Analytics',
    data: {
      headers: ['Source', 'Visitors', 'Bounce Rate', 'Avg. Session Duration'],
      rows: [
        ['Organic Search', '15420', '45.2', '3:24'],
        ['Direct', '8930', '38.7', '4:12'],
        ['Social Media', '5670', '52.1', '2:48'],
        ['Email', '3240', '28.9', '5:36'],
        ['Referral', '2890', '41.3', '3:18'],
        ['Paid Search', '4560', '48.6', '2:54'],
        ['Display Ads', '1890', '61.2', '1:42']
      ],
      metadata: {
        rowCount: 7,
        columnCount: 4,
        format: 'CSV'
      }
    },
    recommendedChart: 'pie',
    tags: ['analytics', 'traffic', 'marketing', 'web']
  },
  {
    id: 'stock-prices',
    name: 'Stock Price Movement',
    description: 'Daily stock prices for a tech company',
    category: 'Finance',
    data: {
      headers: ['Date', 'Open', 'High', 'Low', 'Close', 'Volume'],
      rows: [
        ['2024-01-01', '150.25', '152.80', '149.50', '151.20', '1250000'],
        ['2024-01-02', '151.20', '154.30', '150.10', '153.45', '1180000'],
        ['2024-01-03', '153.45', '155.90', '152.20', '154.80', '1320000'],
        ['2024-01-04', '154.80', '157.25', '153.60', '156.10', '1450000'],
        ['2024-01-05', '156.10', '158.75', '155.20', '157.90', '1380000'],
        ['2024-01-08', '157.90', '160.40', '156.80', '159.25', '1520000'],
        ['2024-01-09', '159.25', '161.80', '158.10', '160.50', '1410000'],
        ['2024-01-10', '160.50', '163.20', '159.30', '162.75', '1670000'],
        ['2024-01-11', '162.75', '165.40', '161.50', '164.20', '1590000'],
        ['2024-01-12', '164.20', '166.90', '163.10', '165.80', '1480000']
      ],
      metadata: {
        rowCount: 10,
        columnCount: 6,
        format: 'CSV'
      }
    },
    recommendedChart: 'line',
    tags: ['finance', 'stocks', 'trading', 'time-series']
  },
  {
    id: 'survey-responses',
    name: 'Customer Satisfaction Survey',
    description: 'Customer satisfaction ratings across different aspects',
    category: 'Research',
    data: {
      headers: ['Aspect', 'Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'],
      rows: [
        ['Product Quality', '45', '35', '15', '4', '1'],
        ['Customer Service', '38', '42', '12', '6', '2'],
        ['Price Value', '25', '40', '25', '8', '2'],
        ['Delivery Speed', '32', '38', '20', '7', '3'],
        ['Website Experience', '28', '35', '22', '12', '3'],
        ['Mobile App', '22', '30', '28', '15', '5']
      ],
      metadata: {
        rowCount: 6,
        columnCount: 6,
        format: 'CSV'
      }
    },
    recommendedChart: 'bar',
    tags: ['survey', 'satisfaction', 'customer', 'research']
  }
]

export function getSampleDataset(id: string): SampleDataset | undefined {
  return SAMPLE_DATASETS.find(dataset => dataset.id === id)
}

export function getSampleDatasetsByCategory(category: string): SampleDataset[] {
  return SAMPLE_DATASETS.filter(dataset => dataset.category === category)
}

export function searchSampleDatasets(query: string): SampleDataset[] {
  const lowercaseQuery = query.toLowerCase()
  return SAMPLE_DATASETS.filter(dataset => 
    dataset.name.toLowerCase().includes(lowercaseQuery) ||
    dataset.description.toLowerCase().includes(lowercaseQuery) ||
    dataset.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  )
}

export function getRecommendedChartType(dataset: SampleDataset): string {
  return dataset.recommendedChart
}

export function getSampleDataStats(): {
  totalDatasets: number
  categories: string[]
  totalRows: number
  averageColumns: number
} {
  const categories = Array.from(new Set(SAMPLE_DATASETS.map(d => d.category)))
  const totalRows = SAMPLE_DATASETS.reduce((sum, d) => sum + d.data.metadata.rowCount, 0)
  const averageColumns = SAMPLE_DATASETS.reduce((sum, d) => sum + d.data.metadata.columnCount, 0) / SAMPLE_DATASETS.length

  return {
    totalDatasets: SAMPLE_DATASETS.length,
    categories,
    totalRows,
    averageColumns: Math.round(averageColumns * 10) / 10
  }
}
