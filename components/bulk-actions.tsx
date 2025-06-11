'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Play, 
  Pause, 
  TrendingUp, 
  TrendingDown,
  Copy,
  Trash2,
  Edit,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Download,
  Calendar,
  BarChart3
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface BulkActionsProps {
  selectedItems: string[]
  itemType: 'campaign' | 'adset' | 'ad'
  onAction: (action: string, items: string[]) => void
}

export function BulkActions({ selectedItems, itemType, onAction }: BulkActionsProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingAction, setPendingAction] = useState<string | null>(null)

  const handleAction = (action: string) => {
    if (['delete', 'pause', 'archive'].includes(action)) {
      setPendingAction(action)
      setShowConfirm(true)
    } else {
      onAction(action, selectedItems)
    }
  }

  const confirmAction = () => {
    if (pendingAction) {
      onAction(pendingAction, selectedItems)
      setShowConfirm(false)
      setPendingAction(null)
    }
  }

  const getActionButtons = () => {
    const baseActions = [
      { id: 'enable', label: 'Enable', icon: Play, variant: 'default' as const },
      { id: 'pause', label: 'Pause', icon: Pause, variant: 'secondary' as const },
      { id: 'duplicate', label: 'Duplicate', icon: Copy, variant: 'outline' as const },
    ]

    const typeSpecificActions = {
      campaign: [
        { id: 'increase-budget', label: 'Increase Budget', icon: TrendingUp, variant: 'outline' as const },
        { id: 'decrease-budget', label: 'Decrease Budget', icon: TrendingDown, variant: 'outline' as const },
      ],
      adset: [
        { id: 'edit-targeting', label: 'Edit Targeting', icon: Edit, variant: 'outline' as const },
        { id: 'adjust-bid', label: 'Adjust Bid', icon: DollarSign, variant: 'outline' as const },
      ],
      ad: [
        { id: 'refresh-creative', label: 'Refresh Creative', icon: Edit, variant: 'outline' as const },
        { id: 'create-variation', label: 'Create Variation', icon: Copy, variant: 'outline' as const },
      ]
    }

    return [...baseActions, ...(typeSpecificActions[itemType] || [])]
  }

  if (selectedItems.length === 0) return null

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Bulk Actions</span>
          <Badge>{selectedItems.length} selected</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-3">
          {getActionButtons().map((action) => {
            const Icon = action.icon
            return (
              <Button
                key={action.id}
                size="sm"
                variant={action.variant}
                onClick={() => handleAction(action.id)}
                className="gap-2"
              >
                <Icon className="h-3 w-3" />
                {action.label}
              </Button>
            )
          })}
          
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleAction('delete')}
            className="gap-2 ml-auto"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </Button>
        </div>

        {showConfirm && (
          <Alert className="mt-3">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>
                  Are you sure you want to {pendingAction} {selectedItems.length} {itemType}(s)?
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setShowConfirm(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" variant="destructive" onClick={confirmAction}>
                    Confirm
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
          <Card className="cursor-pointer hover:shadow-sm" onClick={() => handleAction('optimize')}>
            <CardContent className="p-3 text-center">
              <TrendingUp className="h-4 w-4 mx-auto mb-1 text-green-500" />
              <p className="text-xs">Optimize</p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-sm" onClick={() => handleAction('analyze')}>
            <CardContent className="p-3 text-center">
              <BarChart3 className="h-4 w-4 mx-auto mb-1 text-blue-500" />
              <p className="text-xs">Analyze</p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-sm" onClick={() => handleAction('export')}>
            <CardContent className="p-3 text-center">
              <Download className="h-4 w-4 mx-auto mb-1 text-purple-500" />
              <p className="text-xs">Export</p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-sm" onClick={() => handleAction('schedule')}>
            <CardContent className="p-3 text-center">
              <Calendar className="h-4 w-4 mx-auto mb-1 text-orange-500" />
              <p className="text-xs">Schedule</p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}

// Additional component for bulk edit modal
export function BulkEditModal({ 
  isOpen, 
  onClose, 
  items, 
  itemType 
}: { 
  isOpen: boolean
  onClose: () => void
  items: string[]
  itemType: 'campaign' | 'adset' | 'ad'
}) {
  const [editType, setEditType] = useState('budget')
  const [value, setValue] = useState('')
  const [adjustmentType, setAdjustmentType] = useState<'fixed' | 'percentage'>('percentage')

  const applyChanges = () => {
    console.log('Applying changes:', { editType, value, adjustmentType, items })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Edit {items.length} {itemType}(s)</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Edit Type</Label>
            <Select value={editType} onValueChange={setEditType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="budget">Budget</SelectItem>
                <SelectItem value="bid">Bid Strategy</SelectItem>
                <SelectItem value="schedule">Schedule</SelectItem>
                <SelectItem value="targeting">Targeting</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {editType === 'budget' && (
            <>
              <div>
                <Label>Adjustment Type</Label>
                <Select value={adjustmentType} onValueChange={(v: any) => setAdjustmentType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>
                  {adjustmentType === 'percentage' ? 'Percentage Change' : 'New Budget'}
                </Label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={adjustmentType === 'percentage' ? '10' : '1000'}
                />
              </div>
            </>
          )}

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This will update {items.length} {itemType}(s). Changes cannot be undone.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={applyChanges}>Apply Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}