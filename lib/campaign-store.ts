// Optimized state management for campaigns
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { metaAPI } from './meta-api-optimized'

interface Campaign {
  id: string
  name: string
  status: string
  objective: string
  budget: number
  metrics?: {
    impressions: number
    clicks: number
    spend: number
    ctr: number
    cpc: number
  }
}

interface CampaignStore {
  // State
  campaigns: Campaign[]
  isLoading: boolean
  error: string | null
  lastFetch: number | null
  selectedCampaignIds: Set<string>
  
  // Actions
  fetchCampaigns: (forceRefresh?: boolean) => Promise<void>
  selectCampaign: (id: string) => void
  deselectCampaign: (id: string) => void
  clearSelection: () => void
  clearError: () => void
  
  // Computed
  getSelectedCampaigns: () => Campaign[]
  getCampaignById: (id: string) => Campaign | undefined
}

// Create store with persistence
export const useCampaignStore = create<CampaignStore>()(
  persist(
    (set, get) => ({
      // Initial state
      campaigns: [],
      isLoading: false,
      error: null,
      lastFetch: null,
      selectedCampaignIds: new Set(),

      // Fetch campaigns with caching logic
      fetchCampaigns: async (forceRefresh = false) => {
        const state = get()
        const now = Date.now()
        
        // Skip if recently fetched (within 5 minutes) unless forced
        if (!forceRefresh && state.lastFetch && now - state.lastFetch < 300000) {
          console.log('Using cached campaigns')
          return
        }

        set({ isLoading: true, error: null })

        try {
          const campaigns = await metaAPI.getCampaigns({ forceRefresh })
          set({ 
            campaigns,
            lastFetch: now,
            isLoading: false 
          })
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch campaigns',
            isLoading: false 
          })
        }
      },

      // Selection management
      selectCampaign: (id) => {
        set((state) => ({
          selectedCampaignIds: new Set([...state.selectedCampaignIds, id])
        }))
      },

      deselectCampaign: (id) => {
        set((state) => {
          const newSet = new Set(state.selectedCampaignIds)
          newSet.delete(id)
          return { selectedCampaignIds: newSet }
        })
      },

      clearSelection: () => {
        set({ selectedCampaignIds: new Set() })
      },

      clearError: () => {
        set({ error: null })
      },

      // Computed getters
      getSelectedCampaigns: () => {
        const state = get()
        return state.campaigns.filter(c => state.selectedCampaignIds.has(c.id))
      },

      getCampaignById: (id) => {
        return get().campaigns.find(c => c.id === id)
      }
    }),
    {
      name: 'campaign-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        campaigns: state.campaigns,
        lastFetch: state.lastFetch
      })
    }
  )
)