'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { 
  Library,
  Search,
  Filter,
  Upload,
  Download,
  FolderPlus,
  Tag,
  Star,
  Archive,
  Trash2,
  Copy,
  Edit,
  Eye,
  Image,
  Video,
  FileText,
  Layers,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  MoreVertical,
  Grid3x3,
  List,
  Calendar,
  Palette,
  Hash,
  Users,
  Target,
  BarChart2,
  RefreshCw,
  Sparkles,
  Share2,
  Lock,
  Unlock
} from 'lucide-react'
import { cn } from "@/lib/utils"

interface Creative {
  id: string
  name: string
  type: 'image' | 'video' | 'carousel' | 'collection'
  status: 'active' | 'paused' | 'archived' | 'draft'
  thumbnail?: string
  createdAt: Date
  modifiedAt: Date
  size?: string
  dimensions?: string
  duration?: string
  tags: string[]
  performance?: {
    impressions: number
    clicks: number
    ctr: number
    conversions: number
    score: number
  }
  compliance?: {
    approved: boolean
    issues: string[]
  }
  versions?: number
  usedInCampaigns?: number
}

interface CreativeLibraryProps {
  creatives?: Creative[]
  onCreativeSelect?: (creative: Creative) => void
  onUpload?: (files: FileList) => void
}

export function CreativeLibraryManager({ 
  creatives: initialCreatives = [], 
  onCreativeSelect,
  onUpload 
}: CreativeLibraryProps) {
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<string>('modified')
  const [selectedCreatives, setSelectedCreatives] = useState<Set<string>>(new Set())
  const [showUploadDialog, setShowUploadDialog] = useState(false)

  // Sample creatives data
  const [creatives, setCreatives] = useState<Creative[]>(initialCreatives.length > 0 ? initialCreatives : [
    {
      id: '1',
      name: 'Summer Sale Banner v3',
      type: 'image',
      status: 'active',
      createdAt: new Date('2024-01-15'),
      modifiedAt: new Date('2024-01-20'),
      size: '2.4 MB',
      dimensions: '1200x628',
      tags: ['summer', 'sale', 'banner'],
      performance: {
        impressions: 45000,
        clicks: 1350,
        ctr: 3.0,
        conversions: 135,
        score: 85
      },
      compliance: { approved: true, issues: [] },
      versions: 3,
      usedInCampaigns: 5
    },
    {
      id: '2',
      name: 'Product Demo Video',
      type: 'video',
      status: 'active',
      createdAt: new Date('2024-01-10'),
      modifiedAt: new Date('2024-01-18'),
      size: '24.5 MB',
      duration: '0:30',
      tags: ['product', 'demo', 'video'],
      performance: {
        impressions: 32000,
        clicks: 2880,
        ctr: 9.0,
        conversions: 288,
        score: 92
      },
      compliance: { approved: true, issues: [] },
      versions: 2,
      usedInCampaigns: 3
    },
    {
      id: '3',
      name: 'Holiday Carousel',
      type: 'carousel',
      status: 'paused',
      createdAt: new Date('2023-12-01'),
      modifiedAt: new Date('2023-12-20'),
      tags: ['holiday', 'carousel', 'seasonal'],
      performance: {
        impressions: 78000,
        clicks: 1560,
        ctr: 2.0,
        conversions: 156,
        score: 72
      },
      compliance: { approved: false, issues: ['Text overlay exceeds 20%'] },
      versions: 4,
      usedInCampaigns: 2
    }
  ])

  const allTags = Array.from(new Set(creatives.flatMap(c => c.tags)))

  const filteredCreatives = creatives.filter(creative => {
    const matchesSearch = creative.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         creative.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesType = selectedType === 'all' || creative.type === selectedType
    const matchesStatus = selectedStatus === 'all' || creative.status === selectedStatus
    const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => creative.tags.includes(tag))
    
    return matchesSearch && matchesType && matchesStatus && matchesTags
  })

  const sortedCreatives = [...filteredCreatives].sort((a, b) => {
    switch (sortBy) {
      case 'name': return a.name.localeCompare(b.name)
      case 'modified': return b.modifiedAt.getTime() - a.modifiedAt.getTime()
      case 'created': return b.createdAt.getTime() - a.createdAt.getTime()
      case 'performance': return (b.performance?.score || 0) - (a.performance?.score || 0)
      default: return 0
    }
  })

  const toggleCreativeSelection = (id: string) => {
    const newSelection = new Set(selectedCreatives)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedCreatives(newSelection)
  }

  const selectAll = () => {
    if (selectedCreatives.size === sortedCreatives.length) {
      setSelectedCreatives(new Set())
    } else {
      setSelectedCreatives(new Set(sortedCreatives.map(c => c.id)))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      case 'draft': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return Image
      case 'video': return Video
      case 'carousel': return Layers
      case 'collection': return Grid3x3
      default: return FileText
    }
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const handleBulkAction = (action: string) => {
    console.log(`Performing ${action} on ${selectedCreatives.size} items`)
    // Implement bulk actions
  }

  const CreativeCard = ({ creative }: { creative: Creative }) => {
    const TypeIcon = getTypeIcon(creative.type)
    
    return (
      <Card className={cn(
        "relative group cursor-pointer transition-all hover:shadow-lg",
        selectedCreatives.has(creative.id) && "ring-2 ring-blue-500"
      )}>
        <div className="absolute top-2 left-2 z-10">
          <Checkbox
            checked={selectedCreatives.has(creative.id)}
            onCheckedChange={() => toggleCreativeSelection(creative.id)}
            className="bg-white"
          />
        </div>
        
        <div className="absolute top-2 right-2 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <CardContent className="p-4">
          <div className="aspect-video bg-muted rounded-md mb-3 flex items-center justify-center">
            <TypeIcon className="h-12 w-12 text-muted-foreground" />
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-sm truncate">{creative.name}</h3>
            
            <div className="flex items-center justify-between">
              <Badge className={getStatusColor(creative.status)} variant="secondary">
                {creative.status}
              </Badge>
              {creative.compliance && (
                <div className="flex items-center">
                  {creative.compliance.approved ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TypeIcon className="h-3 w-3" />
              <span>{creative.type}</span>
              {creative.size && <span>• {creative.size}</span>}
              {creative.dimensions && <span>• {creative.dimensions}</span>}
              {creative.duration && <span>• {creative.duration}</span>}
            </div>

            {creative.performance && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Performance</span>
                <span className={`font-medium ${getPerformanceColor(creative.performance.score)}`}>
                  {creative.performance.score}/100
                </span>
              </div>
            )}

            <div className="flex gap-1 flex-wrap">
              {creative.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {creative.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{creative.tags.length - 3}
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
              <span>{creative.versions} versions</span>
              <span>{creative.usedInCampaigns} campaigns</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Library className="h-5 w-5" />
                Creative Library
              </CardTitle>
              <CardDescription>
                Manage and organize all your creative assets in one place
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => setShowUploadDialog(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
              <Button>
                <FolderPlus className="h-4 w-4 mr-2" />
                New Collection
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="carousel">Carousels</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modified">Last Modified</SelectItem>
                  <SelectItem value="created">Date Created</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-1">
                <Button
                  variant={view === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setView('grid')}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={view === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setView('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <div className="flex gap-2 flex-wrap">
                {allTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      if (selectedTags.includes(tag)) {
                        setSelectedTags(selectedTags.filter(t => t !== tag))
                      } else {
                        setSelectedTags([...selectedTags, tag])
                      }
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedCreatives.size > 0 && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedCreatives.size === sortedCreatives.length}
                  onCheckedChange={selectAll}
                />
                <span className="text-sm text-muted-foreground">
                  {selectedCreatives.size} selected
                </span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('archive')}>
                  <Archive className="h-4 w-4 mr-1" />
                  Archive
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('tag')}>
                  <Tag className="h-4 w-4 mr-1" />
                  Tag
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('duplicate')}>
                  <Copy className="h-4 w-4 mr-1" />
                  Duplicate
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleBulkAction('delete')}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Creative Grid/List */}
      <div className={cn(
        "grid gap-4",
        view === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
      )}>
        {sortedCreatives.map(creative => (
          <CreativeCard key={creative.id} creative={creative} />
        ))}
      </div>

      {sortedCreatives.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No creatives found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
          </CardContent>
        </Card>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Creatives</DialogTitle>
            <DialogDescription>
              Upload images, videos, or create collections
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag and drop files here, or click to browse
              </p>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    onUpload?.(e.target.files)
                    setShowUploadDialog(false)
                  }
                }}
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="outline" asChild>
                  <span>Select Files</span>
                </Button>
              </label>
            </div>
            <div className="text-xs text-muted-foreground">
              <p>Supported formats: JPG, PNG, GIF, MP4, MOV</p>
              <p>Max file size: 100MB</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}