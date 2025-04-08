import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { StateCreator } from 'zustand'

interface Annotation {
  uniprot: string | null
  genesymbol: string | null
  entityType: string | null
  source: string | null
  label: string | null
  value: string | null
  recordId: number | null
}

interface SearchFilters {
  sources: string[]
  annotationTypes: string[]
  valueSearch: string
}

export interface InteractionsFilters {
  interactionType: string[]
  curationEffort: string[]
  ncbiTaxId: string[]
  entityTypeSource: string[]
  entityTypeTarget: string[]
  isDirected: boolean | null
  isStimulation: boolean | null
  isInhibition: boolean | null
  consensusDirection: boolean | null
  consensusStimulation: boolean | null
  consensusInhibition: boolean | null
  minReferences: number
}

interface SearchState {
  // Annotations state
  annotationsQuery: string
  annotationsResults: Annotation[]
  annotationsFilters: SearchFilters
  annotationsViewMode: 'table' | 'chart'
  annotationsCurrentPage: number
  selectedAnnotation: Annotation | null

  // Interactions state
  interactionsQuery: string
  interactionsResults: any[]
  interactionsCurrentPage: number
  selectedInteraction: any | null
  interactionsFilters: InteractionsFilters

  // Actions
  setAnnotationsQuery: (query: string) => void
  setAnnotationsResults: (results: Annotation[]) => void
  setAnnotationsFilters: (filters: SearchFilters | ((prev: SearchFilters) => SearchFilters)) => void
  setAnnotationsViewMode: (mode: 'table' | 'chart') => void
  setAnnotationsCurrentPage: (page: number) => void
  setSelectedAnnotation: (annotation: Annotation | null) => void

  setInteractionsQuery: (query: string) => void
  setInteractionsResults: (results: any[]) => void
  setInteractionsCurrentPage: (page: number) => void
  setSelectedInteraction: (interaction: any | null) => void
  setInteractionsFilters: (filters: InteractionsFilters | ((prev: InteractionsFilters) => InteractionsFilters)) => void
}

type SearchStateCreator = StateCreator<SearchState, [], []>

export const useSearchStore = create<SearchState>()(
  persist(
    ((set: any) => ({
      // Initial state
      annotationsQuery: '',
      annotationsResults: [],
      annotationsFilters: {
        sources: ['UniProt_keyword'],
        annotationTypes: [],
        valueSearch: '',
      },
      annotationsViewMode: 'table',
      annotationsCurrentPage: 1,
      selectedAnnotation: null,

      interactionsQuery: '',
      interactionsResults: [],
      interactionsCurrentPage: 1,
      selectedInteraction: null,
      interactionsFilters: {
        interactionType: [],
        curationEffort: [],
        ncbiTaxId: [],
        entityTypeSource: [],
        entityTypeTarget: [],
        isDirected: null,
        isStimulation: null,
        isInhibition: null,
        consensusDirection: null,
        consensusStimulation: null,
        consensusInhibition: null,
        minReferences: 0,
      },

      // Actions
      setAnnotationsQuery: (query: string) => set({ annotationsQuery: query }),
      setAnnotationsResults: (results: Annotation[]) => set({ annotationsResults: results }),
      setAnnotationsFilters: (filters: SearchFilters | ((prev: SearchFilters) => SearchFilters)) => 
        set((state: SearchState) => ({ 
          annotationsFilters: typeof filters === 'function' ? filters(state.annotationsFilters) : filters 
        })),
      setAnnotationsViewMode: (mode: 'table' | 'chart') => set({ annotationsViewMode: mode }),
      setAnnotationsCurrentPage: (page: number) => set({ annotationsCurrentPage: page }),
      setSelectedAnnotation: (annotation: Annotation | null) => set({ selectedAnnotation: annotation }),

      setInteractionsQuery: (query: string) => set({ interactionsQuery: query }),
      setInteractionsResults: (results: any[]) => set({ interactionsResults: results }),
      setInteractionsCurrentPage: (page: number) => set({ interactionsCurrentPage: page }),
      setSelectedInteraction: (interaction: any | null) => set({ selectedInteraction: interaction }),
      setInteractionsFilters: (filters: InteractionsFilters | ((prev: InteractionsFilters) => InteractionsFilters)) => 
        set((state: SearchState) => ({ 
          interactionsFilters: typeof filters === 'function' ? filters(state.interactionsFilters) : filters 
        })),
    })) as SearchStateCreator,
    {
      name: 'search-store',
      partialize: (state) => ({
        annotationsQuery: state.annotationsQuery,
        annotationsFilters: state.annotationsFilters,
        annotationsViewMode: state.annotationsViewMode,
        annotationsCurrentPage: state.annotationsCurrentPage,
        selectedAnnotation: state.selectedAnnotation,

        interactionsQuery: state.interactionsQuery,
        interactionsCurrentPage: state.interactionsCurrentPage,
        selectedInteraction: state.selectedInteraction,
        interactionsFilters: state.interactionsFilters,
      }),
    }
  )
) 