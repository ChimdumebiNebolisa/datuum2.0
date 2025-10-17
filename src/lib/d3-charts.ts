/**
 * D3.js Chart Renderers for Advanced Visualizations
 * 
 * Provides Sankey diagrams, Network graphs, and Heatmaps
 */

// Dynamic imports to avoid SSR issues
let d3: any = null
let sankey: any = null
let sankeyLinkHorizontal: any = null

// Lazy load D3 modules
const loadD3 = async () => {
  if (typeof window === 'undefined') return false
  
  if (!d3) {
    d3 = await import('d3')
    const sankeyModule = await import('d3-sankey')
    sankey = sankeyModule.sankey
    sankeyLinkHorizontal = sankeyModule.sankeyLinkHorizontal
  }
  return true
}

export interface D3ChartConfig {
  width: number
  height: number
  margin?: { top: number; right: number; bottom: number; left: number }
  colors?: string[]
}

export interface SankeyData {
  nodes: Array<{ id: string; name: string }>
  links: Array<{ source: string; target: string; value: number }>
}

export interface NetworkData {
  nodes: Array<{ id: string; name: string; group?: string; size?: number } & any>
  links: Array<{ source: string; target: string; value?: number; strength?: number }>
}

export interface HeatmapData {
  data: Array<{ x: string; y: string; value: number }>
  xLabels: string[]
  yLabels: string[]
}

export class D3ChartRenderer {
  private container: HTMLElement
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null

  constructor(container: HTMLElement) {
    this.container = container
  }

  async renderSankey(data: SankeyData, config: D3ChartConfig) {
    const d3Loaded = await loadD3()
    if (!d3Loaded) return
    
    this.clear()
    
    const { width, height, margin = { top: 20, right: 20, bottom: 20, left: 20 } } = config
    
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)

    const chartWidth = width - margin.left - margin.right
    const chartHeight = height - margin.top - margin.bottom

    const g = this.svg?.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Create Sankey layout
    const sankeyGenerator = (sankey as any)()
      .nodeId((d: any) => d.id)
      .nodeWidth(15)
      .nodePadding(10)
      .extent([[1, 1], [chartWidth - 1, chartHeight - 1]])

    const { nodes, links } = sankeyGenerator(data)

    // Color scale
    const color = d3.scaleOrdinal(d3.schemeCategory10)

    // Create links
    g?.append('g')
      .selectAll('path')
      .data(links)
      .enter()
      .append('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke', (d: any) => color(d.source.id))
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d: any) => Math.max(1, d.width))
      .attr('fill', 'none')

    // Create nodes
    const node = g?.append('g')
      .selectAll('rect')
      .data(nodes)
      .enter()
      .append('rect')
      .attr('x', (d: any) => d.x0)
      .attr('y', (d: any) => d.y0)
      .attr('height', (d: any) => d.y1 - d.y0)
      .attr('width', (d: any) => d.x1 - d.x0)
      .attr('fill', (d: any) => color(d.id))
      .attr('opacity', 0.8)

    // Add labels
    g?.append('g')
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .attr('x', (d: any) => d.x0 < chartWidth / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr('y', (d: any) => (d.y1 + d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', (d: any) => d.x0 < chartWidth / 2 ? 'start' : 'end')
      .text((d: any) => d.name)
      .style('font-size', '12px')
      .style('fill', '#333')
  }

  async renderNetwork(data: NetworkData, config: D3ChartConfig) {
    const d3Loaded = await loadD3()
    if (!d3Loaded) return
    
    this.clear()
    
    const { width, height, margin = { top: 20, right: 20, bottom: 20, left: 20 } } = config
    
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)

    const chartWidth = width - margin.left - margin.right
    const chartHeight = height - margin.top - margin.bottom

    const g = this.svg?.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Create force simulation
    const simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(chartWidth / 2, chartHeight / 2))
      .force('collision', d3.forceCollide().radius(20))

    // Color scale
    const color = d3.scaleOrdinal(d3.schemeCategory10)

    // Create links
    const link = g?.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(data.links)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d: any) => Math.sqrt(d.value || 1))

    // Create nodes
    const node = g?.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(data.nodes)
      .enter()
      .append('circle')
      .attr('r', (d: any) => Math.sqrt(d.size || 10) * 2)
      .attr('fill', (d: any) => color(d.group || 'default'))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      ?.call(this.drag(simulation))

    // Add labels
    const label = g?.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(data.nodes)
      .enter()
      .append('text')
      .text((d: any) => d.name)
      .style('font-size', '12px')
      .style('fill', '#333')
      .style('text-anchor', 'middle')
      .style('pointer-events', 'none')

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        ?.attr('x1', (d: any) => d.source.x)
        ?.attr('y1', (d: any) => d.source.y)
        ?.attr('x2', (d: any) => d.target.x)
        ?.attr('y2', (d: any) => d.target.y)

      node
        ?.attr('cx', (d: any) => d.x)
        ?.attr('cy', (d: any) => d.y)

      label
        ?.attr('x', (d: any) => d.x)
        ?.attr('y', (d: any) => d.y + 4)
    })

    // Add tooltips
    node
      ?.append('title')
      ?.text((d: any) => d.name)
  }

  async renderHeatmap(data: HeatmapData, config: D3ChartConfig) {
    const d3Loaded = await loadD3()
    if (!d3Loaded) return
    
    this.clear()
    
    const { width, height, margin = { top: 40, right: 40, bottom: 40, left: 40 } } = config
    
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)

    const chartWidth = width - margin.left - margin.right
    const chartHeight = height - margin.top - margin.bottom

    const g = this.svg?.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Create scales
    const xScale = d3.scaleBand()
      .domain(data.xLabels)
      .range([0, chartWidth])
      .padding(0.1)

    const yScale = d3.scaleBand()
      .domain(data.yLabels)
      .range([0, chartHeight])
      .padding(0.1)

    // Color scale
    const values = data.data.map(d => d.value)
    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([d3.min(values) || 0, d3.max(values) || 1])

    // Create heatmap cells
    g?.selectAll('rect')
      .data(data.data)
      .enter()
      .append('rect')
      .attr('x', (d: any) => xScale(d.x) || 0)
      .attr('y', (d: any) => yScale(d.y) || 0)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('fill', (d: any) => colorScale(d.value))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)

    // Add tooltips
    g?.selectAll('rect')
      .append('title')
      .text((d: any) => `${d.x} × ${d.y}: ${d.value}`)

    // Add axes
    g?.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('font-size', '12px')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)')

    g?.append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .style('font-size', '12px')

    // Add color legend
    const legendWidth = 200
    const legendHeight = 20
    const legendX = chartWidth - legendWidth
    const legendY = -30

    const legendScale = d3.scaleLinear()
      .domain([d3.min(values) || 0, d3.max(values) || 1])
      .range([0, legendWidth])

    const legendAxis = d3.axisBottom(legendScale)
      .tickSize(legendHeight)
      .ticks(5)

    const legend = g?.append('g')
      .attr('transform', `translate(${legendX},${legendY})`)

    const defs = this.svg?.append('defs')
    const gradient = defs?.append('linearGradient')
      .attr('id', 'heatmap-gradient')

    gradient?.selectAll('stop')
      .data(d3.range(0, 1.1, 0.1))
      .enter()
      .append('stop')
      .attr('offset', (d: any) => d)
      .attr('stop-color', (d: any) => colorScale(legendScale.invert(d * legendWidth)))

    legend?.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#heatmap-gradient)')

    legend?.append('g')
      .attr('transform', `translate(0,${legendHeight})`)
      .call(legendAxis)
  }

  private drag(simulation: d3.Simulation<any, undefined>) {
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y
    }

    function dragged(event: any, d: any) {
      d.fx = event.x
      d.fy = event.y
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0)
      d.fx = null
      d.fy = null
    }

    return (d3.drag as any)()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended)
  }

  clear() {
    if (this.svg) {
      this.svg.remove()
      this.svg = null
    }
    d3.select(this.container).selectAll('*').remove()
  }

  export(format: 'svg' | 'png' | 'pdf' = 'svg'): string {
    if (!this.svg) return ''
    
    if (format === 'svg') {
      return this.svg.node()?.outerHTML || ''
    } else {
      // For PNG export, we'd need to use html2canvas or similar
      // For now, return SVG as base64
      const svgString = this.svg.node()?.outerHTML || ''
      return 'data:image/svg+xml;base64,' + btoa(svgString)
    }
  }
}

// Utility functions for data transformation
export function transformDataForSankey(data: any): SankeyData {
  const headers = data.headers || []
  const rows = data.rows || []
  
  // Find source and target columns
  const sourceIndex = headers.findIndex((h: string) => h.toLowerCase().includes('source'))
  const targetIndex = headers.findIndex((h: string) => h.toLowerCase().includes('target'))
  const valueIndex = headers.findIndex((h: string) => h.toLowerCase().includes('value') || h.toLowerCase().includes('amount'))
  
  if (sourceIndex === -1 || targetIndex === -1) {
    throw new Error('Sankey diagram requires source and target columns')
  }
  
  const nodes = new Set<string>()
  const links: Array<{ source: string; target: string; value: number }> = []
  
  rows.forEach((row: string[]) => {
    const source = row[sourceIndex]
    const target = row[targetIndex]
    const value = valueIndex !== -1 ? parseFloat(row[valueIndex]) || 1 : 1
    
    nodes.add(source)
    nodes.add(target)
    
    links.push({ source, target, value })
  })
  
  return {
    nodes: Array.from(nodes).map(id => ({ id, name: id })),
    links
  }
}

export function transformDataForNetwork(data: any): NetworkData {
  const headers = data.headers || []
  const rows = data.rows || []
  
  // Find node and connection columns
  const node1Index = headers.findIndex((h: string) => h.toLowerCase().includes('node1') || h.toLowerCase().includes('from'))
  const node2Index = headers.findIndex((h: string) => h.toLowerCase().includes('node2') || h.toLowerCase().includes('to'))
  const valueIndex = headers.findIndex((h: string) => h.toLowerCase().includes('value') || h.toLowerCase().includes('weight'))
  const groupIndex = headers.findIndex((h: string) => h.toLowerCase().includes('group') || h.toLowerCase().includes('category'))
  
  if (node1Index === -1 || node2Index === -1) {
    throw new Error('Network graph requires node connection columns')
  }
  
  const nodes = new Set<string>()
  const links: Array<{ source: string; target: string; value?: number; strength?: number }> = []
  
  rows.forEach((row: string[]) => {
    const node1 = row[node1Index]
    const node2 = row[node2Index]
    const value = valueIndex !== -1 ? parseFloat(row[valueIndex]) : 1
    
    nodes.add(node1)
    nodes.add(node2)
    
    links.push({ 
      source: node1, 
      target: node2, 
      value,
      strength: value 
    })
  })
  
  return {
    nodes: Array.from(nodes).map(id => ({ 
      id, 
      name: id,
      size: Math.random() * 20 + 10 // Random size for now
    })),
    links
  }
}

export function transformDataForHeatmap(data: any): HeatmapData {
  const headers = data.headers || []
  const rows = data.rows || []
  
  // Find X, Y, and value columns
  const xIndex = headers.findIndex((h: string) => h.toLowerCase().includes('x') || h.toLowerCase().includes('column'))
  const yIndex = headers.findIndex((h: string) => h.toLowerCase().includes('y') || h.toLowerCase().includes('row'))
  const valueIndex = headers.findIndex((h: string) => h.toLowerCase().includes('value') || h.toLowerCase().includes('count'))
  
  if (xIndex === -1 || yIndex === -1 || valueIndex === -1) {
    throw new Error('Heatmap requires X, Y, and value columns')
  }
  
  const heatmapData: Array<{ x: string; y: string; value: number }> = []
  const xLabels = new Set<string>()
  const yLabels = new Set<string>()
  
  rows.forEach((row: string[]) => {
    const x = row[xIndex]
    const y = row[yIndex]
    const value = parseFloat(row[valueIndex]) || 0
    
    xLabels.add(x)
    yLabels.add(y)
    heatmapData.push({ x, y, value })
  })
  
  return {
    data: heatmapData,
    xLabels: Array.from(xLabels),
    yLabels: Array.from(yLabels)
  }
}

// Export singleton instance (lazy-initialized)
let _d3ChartRenderer: D3ChartRenderer | null = null

export const getD3ChartRenderer = () => {
  if (typeof window === 'undefined') {
    throw new Error('D3ChartRenderer can only be used on the client side')
  }
  if (!_d3ChartRenderer) {
    _d3ChartRenderer = new D3ChartRenderer(document.createElement('div'))
  }
  return _d3ChartRenderer
}

// For backward compatibility, but this will throw on server-side
export const d3ChartRenderer = new Proxy({} as D3ChartRenderer, {
  get(target, prop) {
    return getD3ChartRenderer()[prop as keyof D3ChartRenderer]
  }
})
