'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Plus, 
  Trash2, 
  Move, 
  Save, 
  Download,
  BarChart3,
  Table,
  FileText,
  PieChart,
  TrendingUp,
  Calendar,
  DollarSign,
  Users,
  Eye,
  MousePointer
} from 'lucide-react'
// import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core'
// import { CSS } from '@dnd-kit/utilities'
// Note: Drag and drop functionality will be implemented when dependencies are available

interface ReportElement {
  id: string
  type: 'metric' | 'chart' | 'table' | 'text' | 'summary'
  config: Record<string, any>
}

interface ReportTemplate {
  id: string
  name: string
  description?: string
  elements: ReportElement[]
  layout: 'single' | 'two-column' | 'grid'
}

const availableMetrics = [
  { id: 'revenue', name: 'Revenue', icon: DollarSign, category: 'financial' },
  { id: 'spend', name: 'Ad Spend', icon: DollarSign, category: 'financial' },
  { id: 'roas', name: 'ROAS', icon: TrendingUp, category: 'performance' },
  { id: 'conversions', name: 'Conversions', icon: MousePointer, category: 'performance' },
  { id: 'impressions', name: 'Impressions', icon: Eye, category: 'engagement' },
  { id: 'clicks', name: 'Clicks', icon: MousePointer, category: 'engagement' },
  { id: 'ctr', name: 'CTR', icon: TrendingUp, category: 'engagement' },
  { id: 'cpc', name: 'CPC', icon: DollarSign, category: 'financial' },
  { id: 'cpa', name: 'CPA', icon: DollarSign, category: 'financial' },
  { id: 'reach', name: 'Reach', icon: Users, category: 'engagement' }
]

const chartTypes = [
  { id: 'line', name: 'Line Chart', icon: TrendingUp },
  { id: 'bar', name: 'Bar Chart', icon: BarChart3 },
  { id: 'pie', name: 'Pie Chart', icon: PieChart },
  { id: 'area', name: 'Area Chart', icon: TrendingUp }
]

function DraggableElement({ element, onRemove }: { element: ReportElement; onRemove: () => void }) {
  // const { attributes, listeners, setNodeRef, transform } = useDraggable({
  //   id: element.id,
  // })

  // const style = {
  //   transform: CSS.Transform.toString(transform),
  // }

  const getElementIcon = () => {
    switch (element.type) {
      case 'metric':
        const metric = availableMetrics.find(m => m.id === element.config.metric)
        return metric?.icon || BarChart3
      case 'chart':
        const chart = chartTypes.find(c => c.id === element.config.chartType)
        return chart?.icon || BarChart3
      case 'table':
        return Table
      case 'text':
        return FileText
      case 'summary':
        return BarChart3
      default:
        return BarChart3
    }
  }

  const Icon = getElementIcon()

  return (
    <div
      // ref={setNodeRef}
      // style={style}
      // {...attributes}
      className="relative group"
    >
      <Card className="p-4 hover:shadow-md transition-shadow cursor-move">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <Move className="h-4 w-4 text-muted-foreground" />
            </div>
            <Icon className="h-4 w-4" />
            <span className="font-medium">
              {element.config.title || element.type}
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onRemove}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
        {element.type === 'metric' && (
          <p className="text-sm text-muted-foreground mt-1">
            {element.config.metric}
          </p>
        )}
        {element.type === 'chart' && (
          <p className="text-sm text-muted-foreground mt-1">
            {element.config.chartType} - {element.config.metrics?.join(', ')}
          </p>
        )}
      </Card>
    </div>
  )
}

function DroppableArea({ children, id }: { children: React.ReactNode; id: string }) {
  // const { setNodeRef, isOver } = useDroppable({
  //   id,
  // })

  return (
    <div
      // ref={setNodeRef}
      className={`min-h-[400px] p-4 border-2 border-dashed rounded-lg transition-colors border-muted`}
    >
      {children}
    </div>
  )
}

export function ReportBuilder() {
  const [template, setTemplate] = useState<ReportTemplate>({
    id: 'new',
    name: 'Custom Report',
    elements: [],
    layout: 'single'
  })
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('design')

  const addElement = (type: ReportElement['type']) => {
    const newElement: ReportElement = {
      id: Date.now().toString(),
      type,
      config: {
        title: `New ${type}`,
        ...(type === 'metric' && { metric: 'revenue', timeframe: '7d' }),
        ...(type === 'chart' && { chartType: 'line', metrics: ['revenue'], timeframe: '7d' }),
        ...(type === 'table' && { metrics: ['revenue', 'spend', 'roas'], groupBy: 'campaign' })
      }
    }
    setTemplate({
      ...template,
      elements: [...template.elements, newElement]
    })
  }

  const removeElement = (id: string) => {
    setTemplate({
      ...template,
      elements: template.elements.filter(e => e.id !== id)
    })
  }

  const updateElement = (id: string, config: Record<string, any>) => {
    setTemplate({
      ...template,
      elements: template.elements.map(e => 
        e.id === id ? { ...e, config: { ...e.config, ...config } } : e
      )
    })
  }

  const handleDragEnd = (event: any) => {
    // Implement reordering logic when drag and drop is available
    console.log('Drag ended:', event)
  }

  const selectedElementData = template.elements.find(e => e.id === selectedElement)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Report Builder</h2>
          <p className="text-muted-foreground">Create custom reports with drag-and-drop components</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Save className="h-4 w-4" />
            Save Template
          </Button>
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="design">Design</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="design" className="space-y-4">
          <div className="grid grid-cols-12 gap-6">
            {/* Components Panel */}
            <div className="col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Components</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => addElement('metric')}
                  >
                    <BarChart3 className="h-4 w-4" />
                    Metric Card
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => addElement('chart')}
                  >
                    <TrendingUp className="h-4 w-4" />
                    Chart
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => addElement('table')}
                  >
                    <Table className="h-4 w-4" />
                    Data Table
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => addElement('text')}
                  >
                    <FileText className="h-4 w-4" />
                    Text Block
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => addElement('summary')}
                  >
                    <BarChart3 className="h-4 w-4" />
                    Summary
                  </Button>
                </CardContent>
              </Card>

              {/* Layout Options */}
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-base">Layout</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={template.layout} onValueChange={(value: any) => setTemplate({...template, layout: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single Column</SelectItem>
                      <SelectItem value="two-column">Two Columns</SelectItem>
                      <SelectItem value="grid">Grid Layout</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>

            {/* Canvas */}
            <div className="col-span-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Report Canvas</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* <DndContext onDragEnd={handleDragEnd}> */}
                    <DroppableArea id="canvas">
                      {template.elements.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                          <Plus className="h-8 w-8 mb-2" />
                          <p>Add components to start building your report</p>
                        </div>
                      ) : (
                        <div className={`space-y-4 ${template.layout === 'two-column' ? 'grid grid-cols-2 gap-4' : ''}`}>
                          {template.elements.map(element => (
                            <DraggableElement
                              key={element.id}
                              element={element}
                              onRemove={() => removeElement(element.id)}
                            />
                          ))}
                        </div>
                      )}
                    </DroppableArea>
                  {/* </DndContext> */}
                </CardContent>
              </Card>
            </div>

            {/* Properties Panel */}
            <div className="col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Properties</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedElementData ? (
                    <div className="space-y-4">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={selectedElementData.config.title || ''}
                          onChange={(e) => updateElement(selectedElementData.id, { title: e.target.value })}
                        />
                      </div>

                      {selectedElementData.type === 'metric' && (
                        <>
                          <div>
                            <Label>Metric</Label>
                            <Select 
                              value={selectedElementData.config.metric}
                              onValueChange={(value) => updateElement(selectedElementData.id, { metric: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {availableMetrics.map(metric => (
                                  <SelectItem key={metric.id} value={metric.id}>
                                    {metric.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Timeframe</Label>
                            <Select
                              value={selectedElementData.config.timeframe || '7d'}
                              onValueChange={(value) => updateElement(selectedElementData.id, { timeframe: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1d">Last 24 hours</SelectItem>
                                <SelectItem value="7d">Last 7 days</SelectItem>
                                <SelectItem value="30d">Last 30 days</SelectItem>
                                <SelectItem value="90d">Last 90 days</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}

                      {selectedElementData.type === 'chart' && (
                        <>
                          <div>
                            <Label>Chart Type</Label>
                            <Select
                              value={selectedElementData.config.chartType}
                              onValueChange={(value) => updateElement(selectedElementData.id, { chartType: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {chartTypes.map(chart => (
                                  <SelectItem key={chart.id} value={chart.id}>
                                    {chart.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Select an element to edit its properties
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Report Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-8 bg-white rounded">
                <h1 className="text-2xl font-bold mb-4">{template.name}</h1>
                <div className="space-y-6">
                  {template.elements.map(element => (
                    <div key={element.id} className="border p-4 rounded">
                      <h3 className="font-semibold mb-2">{element.config.title}</h3>
                      <p className="text-muted-foreground">
                        [{element.type} component would be rendered here]
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Report Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Report Name</Label>
                <Input
                  value={template.name}
                  onChange={(e) => setTemplate({...template, name: e.target.value})}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={template.description || ''}
                  onChange={(e) => setTemplate({...template, description: e.target.value})}
                  placeholder="Optional description"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}