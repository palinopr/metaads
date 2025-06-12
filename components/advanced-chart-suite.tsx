'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ScatterChart,
  Scatter,
  Cell,
  FunnelChart,
  Funnel,
  LabelList,
  ComposedChart,
  ReferenceLine,
} from 'recharts';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { 
  Download, 
  Settings, 
  TrendingUp, 
  BarChart3, 
  Scatter3D, 
  PieChart,
  Filter,
  Maximize2,
  Minimize2
} from 'lucide-react';

// Type definitions
export interface MetricData {
  id: string;
  name: string;
  value: number;
  category?: string;
  date?: string;
  timestamp?: number;
  color?: string;
  x?: number;
  y?: number;
  size?: number;
  stage?: string;
}

export interface ChartConfig {
  type: 'line' | 'area' | 'bar' | 'scatter' | 'heatmap' | 'funnel' | 'stacked-bar' | 'multi-axis' | 'composed';
  title?: string;
  xAxisKey: string;
  yAxisKey: string;
  secondaryYAxisKey?: string;
  groupBy?: string;
  colorScheme?: string[];
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  isStacked?: boolean;
  smoothLine?: boolean;
  fillArea?: boolean;
  width?: number;
  height?: number;
  responsive?: boolean;
}

export interface HeatmapData {
  x: string;
  y: string;
  value: number;
  intensity?: number;
}

export interface FunnelData {
  name: string;
  value: number;
  fill?: string;
}

interface AdvancedChartSuiteProps {
  data: MetricData[];
  heatmapData?: HeatmapData[];
  funnelData?: FunnelData[];
  config: ChartConfig;
  className?: string;
  onConfigChange?: (config: ChartConfig) => void;
  exportFormats?: string[];
}

// Color schemes
const COLOR_SCHEMES = {
  default: ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'],
  business: ['#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea'],
  ocean: ['#0369a1', '#0891b2', '#059669', '#0d9488', '#7c3aed'],
  sunset: ['#dc2626', '#ea580c', '#d97706', '#ca8a04', '#16a34a'],
  monochrome: ['#374151', '#6b7280', '#9ca3af', '#d1d5db', '#f3f4f6'],
};

// Utility functions
const formatTooltipValue = (value: any, name: string) => {
  if (typeof value === 'number') {
    return [new Intl.NumberFormat().format(value), name];
  }
  return [value, name];
};

const downloadChart = (chartRef: React.RefObject<HTMLDivElement>, filename: string, format: string) => {
  if (!chartRef.current) return;

  if (format === 'png' || format === 'jpg') {
    import('html2canvas').then((html2canvas) => {
      html2canvas.default(chartRef.current!).then((canvas) => {
        const link = document.createElement('a');
        link.download = `${filename}.${format}`;
        link.href = canvas.toDataURL(`image/${format}`);
        link.click();
      });
    });
  } else if (format === 'svg') {
    const svgElement = chartRef.current.querySelector('svg');
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${filename}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }
  }
};

// Chart Components
const MultiAxisChart: React.FC<{ data: MetricData[]; config: ChartConfig; colors: string[] }> = ({
  data,
  config,
  colors,
}) => (
  <ResponsiveContainer width="100%" height={400}>
    <ComposedChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey={config.xAxisKey} />
      <YAxis yAxisId="left" />
      <YAxis yAxisId="right" orientation="right" />
      <Tooltip formatter={formatTooltipValue} />
      <Legend />
      <Bar
        yAxisId="left"
        dataKey={config.yAxisKey}
        fill={colors[0]}
        name="Primary Metric"
      />
      <Line
        yAxisId="right"
        type="monotone"
        dataKey={config.secondaryYAxisKey || 'value'}
        stroke={colors[1]}
        strokeWidth={2}
        name="Secondary Metric"
      />
    </ComposedChart>
  </ResponsiveContainer>
);

const HeatmapChart: React.FC<{ data: HeatmapData[]; config: ChartConfig }> = ({ data, config }) => {
  const processedData = useMemo(() => {
    const uniqueX = [...new Set(data.map(d => d.x))];
    const uniqueY = [...new Set(data.map(d => d.y))];
    
    return uniqueY.map(y => {
      const row: any = { y };
      uniqueX.forEach(x => {
        const point = data.find(d => d.x === x && d.y === y);
        row[x] = point?.value || 0;
      });
      return row;
    });
  }, [data]);

  const maxValue = Math.max(...data.map(d => d.value));
  const getHeatmapColor = (value: number) => {
    const intensity = value / maxValue;
    return `rgba(34, 197, 94, ${intensity})`;
  };

  return (
    <div className="grid gap-1 p-4">
      {processedData.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1">
          <div className="w-16 text-sm font-medium flex items-center">
            {row.y}
          </div>
          {Object.entries(row).filter(([key]) => key !== 'y').map(([key, value]) => (
            <div
              key={key}
              className="w-12 h-8 flex items-center justify-center text-xs font-medium rounded border"
              style={{ backgroundColor: getHeatmapColor(value as number) }}
              title={`${key}: ${value}`}
            >
              {value as number}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const FunnelChartComponent: React.FC<{ data: FunnelData[]; config: ChartConfig; colors: string[] }> = ({
  data,
  config,
  colors,
}) => (
  <ResponsiveContainer width="100%" height={400}>
    <FunnelChart>
      <Tooltip formatter={formatTooltipValue} />
      <Funnel
        dataKey="value"
        data={data}
        isAnimationActive
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
        ))}
        <LabelList position="center" />
      </Funnel>
    </FunnelChart>
  </ResponsiveContainer>
);

const ScatterPlotChart: React.FC<{ data: MetricData[]; config: ChartConfig; colors: string[] }> = ({
  data,
  config,
  colors,
}) => (
  <ResponsiveContainer width="100%" height={400}>
    <ScatterChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey={config.xAxisKey} />
      <YAxis dataKey={config.yAxisKey} />
      <Tooltip formatter={formatTooltipValue} />
      <Legend />
      <Scatter
        name="Data Points"
        dataKey={config.yAxisKey}
        fill={colors[0]}
      />
    </ScatterChart>
  </ResponsiveContainer>
);

const StackedBarChart: React.FC<{ data: MetricData[]; config: ChartConfig; colors: string[] }> = ({
  data,
  config,
  colors,
}) => {
  const stackedData = useMemo(() => {
    if (!config.groupBy) return data;
    
    const grouped = data.reduce((acc, item) => {
      const key = item[config.xAxisKey as keyof MetricData] as string;
      if (!acc[key]) acc[key] = {};
      const category = item[config.groupBy as keyof MetricData] as string || 'default';
      acc[key][category] = (acc[key][category] || 0) + item.value;
      return acc;
    }, {} as Record<string, Record<string, number>>);

    return Object.entries(grouped).map(([key, values]) => ({
      [config.xAxisKey]: key,
      ...values,
    }));
  }, [data, config]);

  const categories = useMemo(() => {
    if (!config.groupBy) return ['value'];
    return [...new Set(data.map(item => item[config.groupBy as keyof MetricData] as string))];
  }, [data, config]);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={stackedData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={config.xAxisKey} />
        <YAxis />
        <Tooltip formatter={formatTooltipValue} />
        <Legend />
        {categories.map((category, index) => (
          <Bar
            key={category}
            dataKey={category}
            stackId="stack"
            fill={colors[index % colors.length]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

export const AdvancedChartSuite: React.FC<AdvancedChartSuiteProps> = ({
  data,
  heatmapData = [],
  funnelData = [],
  config,
  className = '',
  onConfigChange,
  exportFormats = ['png', 'svg', 'jpg'],
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<ChartConfig>(config);

  const colors = COLOR_SCHEMES[currentConfig.colorScheme as keyof typeof COLOR_SCHEMES] || COLOR_SCHEMES.default;

  const updateConfig = (updates: Partial<ChartConfig>) => {
    const newConfig = { ...currentConfig, ...updates };
    setCurrentConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  const renderChart = () => {
    const baseProps = {
      data,
      config: currentConfig,
      colors,
    };

    switch (currentConfig.type) {
      case 'multi-axis':
        return <MultiAxisChart {...baseProps} />;
      
      case 'heatmap':
        return <HeatmapChart data={heatmapData} config={currentConfig} />;
      
      case 'funnel':
        return <FunnelChartComponent data={funnelData} config={currentConfig} colors={colors} />;
      
      case 'scatter':
        return <ScatterPlotChart {...baseProps} />;
      
      case 'stacked-bar':
        return <StackedBarChart {...baseProps} />;
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              {currentConfig.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey={currentConfig.xAxisKey} />
              <YAxis />
              {currentConfig.showTooltip && <Tooltip formatter={formatTooltipValue} />}
              {currentConfig.showLegend && <Legend />}
              <Line
                type={currentConfig.smoothLine ? 'monotone' : 'linear'}
                dataKey={currentConfig.yAxisKey}
                stroke={colors[0]}
                strokeWidth={2}
                dot={{ fill: colors[0] }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data}>
              {currentConfig.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey={currentConfig.xAxisKey} />
              <YAxis />
              {currentConfig.showTooltip && <Tooltip formatter={formatTooltipValue} />}
              {currentConfig.showLegend && <Legend />}
              <Area
                type={currentConfig.smoothLine ? 'monotone' : 'linear'}
                dataKey={currentConfig.yAxisKey}
                stroke={colors[0]}
                fill={colors[0]}
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      
      case 'bar':
      default:
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              {currentConfig.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey={currentConfig.xAxisKey} />
              <YAxis />
              {currentConfig.showTooltip && <Tooltip formatter={formatTooltipValue} />}
              {currentConfig.showLegend && <Legend />}
              <Bar
                dataKey={currentConfig.yAxisKey}
                fill={colors[0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  const getChartIcon = () => {
    switch (currentConfig.type) {
      case 'line':
      case 'area':
        return <TrendingUp className="h-4 w-4" />;
      case 'bar':
      case 'stacked-bar':
        return <BarChart3 className="h-4 w-4" />;
      case 'scatter':
        return <Scatter3D className="h-4 w-4" />;
      case 'funnel':
      case 'heatmap':
        return <PieChart className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  return (
    <Card className={`${className} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          {getChartIcon()}
          <CardTitle className="text-base font-medium">
            {currentConfig.title || `${currentConfig.type.charAt(0).toUpperCase() + currentConfig.type.slice(1)} Chart`}
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {data.length} data points
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          
          <Select
            value={exportFormats[0]}
            onValueChange={(format) => {
              downloadChart(chartRef, `chart-${Date.now()}`, format);
            }}
          >
            <SelectTrigger className="w-32">
              <Download className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Export" />
            </SelectTrigger>
            <SelectContent>
              {exportFormats.map((format) => (
                <SelectItem key={format} value={format}>
                  {format.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {showSettings && (
        <div className="px-6 pb-4 space-y-4 border-b">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Chart Type</Label>
              <Select
                value={currentConfig.type}
                onValueChange={(value: ChartConfig['type']) => updateConfig({ type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="stacked-bar">Stacked Bar</SelectItem>
                  <SelectItem value="scatter">Scatter Plot</SelectItem>
                  <SelectItem value="heatmap">Heatmap</SelectItem>
                  <SelectItem value="funnel">Funnel Chart</SelectItem>
                  <SelectItem value="multi-axis">Multi-Axis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Color Scheme</Label>
              <Select
                value={currentConfig.colorScheme || 'default'}
                onValueChange={(value) => updateConfig({ colorScheme: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(COLOR_SCHEMES).map((scheme) => (
                    <SelectItem key={scheme} value={scheme}>
                      {scheme.charAt(0).toUpperCase() + scheme.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>X-Axis Field</Label>
              <Select
                value={currentConfig.xAxisKey}
                onValueChange={(value) => updateConfig({ xAxisKey: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(data[0] || {}).map((key) => (
                    <SelectItem key={key} value={key}>
                      {key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Y-Axis Field</Label>
              <Select
                value={currentConfig.yAxisKey}
                onValueChange={(value) => updateConfig({ yAxisKey: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(data[0] || {}).map((key) => (
                    <SelectItem key={key} value={key}>
                      {key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="show-grid"
                checked={currentConfig.showGrid ?? true}
                onCheckedChange={(checked) => updateConfig({ showGrid: checked })}
              />
              <Label htmlFor="show-grid">Show Grid</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="show-legend"
                checked={currentConfig.showLegend ?? true}
                onCheckedChange={(checked) => updateConfig({ showLegend: checked })}
              />
              <Label htmlFor="show-legend">Show Legend</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="show-tooltip"
                checked={currentConfig.showTooltip ?? true}
                onCheckedChange={(checked) => updateConfig({ showTooltip: checked })}
              />
              <Label htmlFor="show-tooltip">Show Tooltip</Label>
            </div>

            {(currentConfig.type === 'line' || currentConfig.type === 'area') && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="smooth-line"
                  checked={currentConfig.smoothLine ?? false}
                  onCheckedChange={(checked) => updateConfig({ smoothLine: checked })}
                />
                <Label htmlFor="smooth-line">Smooth Line</Label>
              </div>
            )}
          </div>
        </div>
      )}

      <CardContent className="pt-6" ref={chartRef}>
        {renderChart()}
      </CardContent>
    </Card>
  );
};

export default AdvancedChartSuite;