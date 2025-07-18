import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { StateCreator } from 'zustand'
import { SearchProteinNeighborsResponse } from '@/features/interactions-browser/api/queries'
import { nanoid } from 'nanoid'
import { ToolInvocation } from 'ai'

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
  entityTypeSource: string[]
  entityTypeTarget: string[]
  isDirected: boolean | null
  isStimulation: boolean | null
  isInhibition: boolean | null
  isUpstream: boolean | null
  isDownstream: boolean | null
  minReferences: number | null
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'function' | 'tool'
  content: string
  toolInvocations?: ToolInvocation[]
}

export interface ChatSession {
  id: string
  messages: ChatMessage[]
}

export interface SearchHistoryItem {
  id: string
  query: string
  type: 'annotation' | 'interaction'
  timestamp: number
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
  interactionsResults: SearchProteinNeighborsResponse['interactions']
  interactionsCurrentPage: number
  selectedInteraction: SearchProteinNeighborsResponse['interactions'][number] | null
  interactionsFilters: InteractionsFilters

  // Chat state
  chats: ChatSession[]
  currentChatId: string | null
  messages: ChatMessage[]

  // Search history
  searchHistory: SearchHistoryItem[]
  maxHistoryItems: number

  // Actions
  setAnnotationsQuery: (query: string) => void
  setAnnotationsResults: (results: Annotation[]) => void
  setAnnotationsFilters: (filters: SearchFilters | ((prev: SearchFilters) => SearchFilters)) => void
  setAnnotationsViewMode: (mode: 'table' | 'chart') => void
  setAnnotationsCurrentPage: (page: number) => void
  setSelectedAnnotation: (annotation: Annotation | null) => void

  setInteractionsQuery: (query: string) => void
  setInteractionsResults: (results: SearchProteinNeighborsResponse['interactions']) => void
  setInteractionsCurrentPage: (page: number) => void
  setSelectedInteraction: (interaction: SearchProteinNeighborsResponse['interactions'][number] | null) => void
  setInteractionsFilters: (filters: InteractionsFilters | ((prev: InteractionsFilters) => InteractionsFilters)) => void

  // Chat Actions
  addMessage: (message: ChatMessage) => void
  setMessages: (messages: ChatMessage[]) => void
  startNewChat: () => void
  switchChat: (chatId: string) => void
  saveCurrentChat: () => void

  // Search History Actions
  addToSearchHistory: (query: string, type: SearchHistoryItem['type']) => void
  clearSearchHistory: () => void
}

type SearchStateCreator = StateCreator<SearchState, [], []>

const initialChatId = nanoid()

export const useSearchStore = create<SearchState>()(
  persist(
    ((set, get) => ({
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
        entityTypeSource: [],
        entityTypeTarget: [],
        isDirected: null,
        isStimulation: null,
        isInhibition: null,
        isUpstream: null,
        isDownstream: null,
        minReferences: 0,
      },

      // Chat initial state
      chats: [{ id: initialChatId, messages: [] }],
      currentChatId: initialChatId,
      messages: [],

      // Search history initial state
      searchHistory: [],
      maxHistoryItems: 20,

      // Actions
      setAnnotationsQuery: (query: string) => {
        set({ annotationsQuery: query })
        if (query.trim()) {
          get().addToSearchHistory(query, 'annotation')
        }
      },
      setAnnotationsResults: (results: Annotation[]) => set({ annotationsResults: results }),
      setAnnotationsFilters: (filters: SearchFilters | ((prev: SearchFilters) => SearchFilters)) => 
        set((state: SearchState) => ({ 
          annotationsFilters: typeof filters === 'function' ? filters(state.annotationsFilters) : filters 
        })),
      setAnnotationsViewMode: (mode: 'table' | 'chart') => set({ annotationsViewMode: mode }),
      setAnnotationsCurrentPage: (page: number) => set({ annotationsCurrentPage: page }),
      setSelectedAnnotation: (annotation: Annotation | null) => set({ selectedAnnotation: annotation }),

      setInteractionsQuery: (query: string) => {
        set({ interactionsQuery: query })
        if (query.trim()) {
          get().addToSearchHistory(query, 'interaction')
        }
      },
      setInteractionsResults: (results: SearchProteinNeighborsResponse['interactions']) => set({ interactionsResults: results }),
      setInteractionsCurrentPage: (page: number) => set({ interactionsCurrentPage: page }),
      setSelectedInteraction: (interaction: SearchProteinNeighborsResponse['interactions'][number] | null) => set({ selectedInteraction: interaction }),
      setInteractionsFilters: (filters: InteractionsFilters | ((prev: InteractionsFilters) => InteractionsFilters)) => 
        set((state: SearchState) => ({ 
          interactionsFilters: typeof filters === 'function' ? filters(state.interactionsFilters) : filters 
        })),

      // Chat Actions
      addMessage: (message: ChatMessage) => {
        const currentMessages = get().messages
        set({ messages: [...currentMessages, message] })
        get().saveCurrentChat()
      },
      setMessages: (messages: ChatMessage[]) => {
        set({ messages })
        get().saveCurrentChat()
      },
      startNewChat: () => {
        const newChatId = nanoid()
        const newChat: ChatSession = { id: newChatId, messages: [] }
        const currentChats = get().chats
        set({
          chats: [...currentChats, newChat],
          currentChatId: newChatId,
          messages: [],
        })
      },
      switchChat: (chatId: string) => {
        const targetChat = get().chats.find(chat => chat.id === chatId)
        if (targetChat) {
          set({
            currentChatId: chatId,
            messages: targetChat.messages,
          })
        } else {
          console.warn(`Chat with id ${chatId} not found.`)
        }
      },
      saveCurrentChat: () => {
        const { currentChatId, messages, chats } = get()
        if (!currentChatId) return

        const updatedChats = chats.map(chat =>
          chat.id === currentChatId ? { ...chat, messages: messages } : chat
        )
        set({ chats: updatedChats })
      },

      // Search History Actions
      addToSearchHistory: (query: string, type: SearchHistoryItem['type']) => {
        if (!query.trim()) return
        
        const { searchHistory, maxHistoryItems } = get()
        const newItem: SearchHistoryItem = {
          id: nanoid(),
          query: query.trim(),
          type,
          timestamp: Date.now()
        }
        
        // Remove duplicates and add new item at the beginning
        const filteredHistory = searchHistory.filter(item => item.query.toLowerCase() !== query.toLowerCase())
        const updatedHistory = [newItem, ...filteredHistory].slice(0, maxHistoryItems)
        
        set({ searchHistory: updatedHistory })
      },
      
      clearSearchHistory: () => set({ searchHistory: [] }),
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

        chats: state.chats,
        currentChatId: state.currentChatId,
        
        searchHistory: state.searchHistory,
      }),
    }
  )
) 