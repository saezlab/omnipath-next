import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { StateCreator } from 'zustand'
import { nanoid } from 'nanoid'
import { ChatMessage, ChatSession, SearchHistoryItem } from '@/types/chat'
import { SearchIdentifiersResponse } from '@/db/queries'

interface SearchState {
  // Chat state
  chats: ChatSession[]
  currentChatId: string | null
  messages: ChatMessage[]

  // Search history
  searchHistory: SearchHistoryItem[]
  maxHistoryItems: number

  // Shared search state
  currentSearchTerm: string

  // Identifier search results
  currentIdentifierResults: SearchIdentifiersResponse | null
  currentIdentifierQuery: string
  currentSpeciesFilter: string

  // Chat Actions
  addMessage: (message: ChatMessage) => void
  setMessages: (messages: ChatMessage[]) => void
  startNewChat: (initialMessages?: ChatMessage[]) => string
  switchChat: (chatId: string) => void
  saveCurrentChat: () => void
  removeMessage: (messageId: string) => void
  deleteChat: (chatId: string) => void

  // Search History Actions
  addToSearchHistory: (query: string, type: SearchHistoryItem['type'], url: string) => void
  clearSearchHistory: () => void

  // Shared Search Actions
  setCurrentSearchTerm: (term: string) => void

  // Identifier Search Actions
  setIdentifierResults: (query: string, results: SearchIdentifiersResponse) => void
  clearIdentifierResults: () => void
  setSpeciesFilter: (species: string) => void
}

type SearchStateCreator = StateCreator<SearchState, [], []>

export const useSearchStore = create<SearchState>()(
  persist(
    ((set, get) => ({
      // Chat initial state
      chats: [],
      currentChatId: null,
      messages: [],

      // Search history initial state
      searchHistory: [],
      maxHistoryItems: 20,

      // Shared search initial state
      currentSearchTerm: '',

      // Identifier search initial state
      currentIdentifierResults: null,
      currentIdentifierQuery: '',
      currentSpeciesFilter: '9606', // Default to human

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
      startNewChat: (initialMessages?: ChatMessage[]) => {
        const newChatId = nanoid()
        const newMessages = initialMessages || []
        const now = Date.now()
        const newChat: ChatSession = { 
          id: newChatId, 
          messages: newMessages,
          createdAt: now,
          updatedAt: now
        }
        const currentChats = get().chats
        set({
          chats: [...currentChats, newChat],
          currentChatId: newChatId,
          messages: newMessages,
        })
        return newChatId
      },
      switchChat: (chatId: string) => {
        const targetChat = get().chats.find(chat => chat.id === chatId)
        if (targetChat) {
          set({
            currentChatId: chatId,
            messages: targetChat.messages,
          })
        }
      },
      saveCurrentChat: () => {
        const { currentChatId, messages, chats } = get()
        if (!currentChatId) return

        const currentChat = chats.find(chat => chat.id === currentChatId)
        if (!currentChat) return

        // Only update timestamp if messages have actually changed
        const messagesChanged = JSON.stringify(currentChat.messages) !== JSON.stringify(messages)
        
        const updatedChats = chats.map(chat =>
          chat.id === currentChatId ? { 
            ...chat, 
            messages: messages, 
            updatedAt: messagesChanged ? Date.now() : chat.updatedAt
          } : chat
        )
        set({ chats: updatedChats })
      },

      // Search History Actions
      addToSearchHistory: (query: string, type: SearchHistoryItem['type'], url: string) => {
        if (!query.trim()) return
        
        const { searchHistory, maxHistoryItems } = get()
        const newItem: SearchHistoryItem = {
          id: nanoid(),
          query: query.trim(),
          type,
          timestamp: Date.now(),
          url
        }
        
        // Remove duplicates based on URL and add new item at the beginning
        const filteredHistory = searchHistory.filter(item => item.url !== url)
        const updatedHistory = [newItem, ...filteredHistory].slice(0, maxHistoryItems)
        
        set({ searchHistory: updatedHistory })
      },
      removeMessage: (messageId: string) => {
        const currentMessages = get().messages
        const updatedMessages = currentMessages.filter(msg => msg.id !== messageId)
        set({ messages: updatedMessages })
        get().saveCurrentChat()
      },
      deleteChat: (chatId: string) => {
        const { chats, currentChatId } = get()
        const updatedChats = chats.filter(chat => chat.id !== chatId)
        
        // If deleting current chat, switch to another or create new one
        if (currentChatId === chatId) {
          if (updatedChats.length > 0) {
            // Switch to the first available chat
            const firstChat = updatedChats[0]
            set({ 
              chats: updatedChats,
              currentChatId: firstChat.id,
              messages: firstChat.messages 
            })
          } else {
            // No chats left, create a new one
            const newChatId = nanoid()
            const now = Date.now()
            const newChat: ChatSession = { 
              id: newChatId, 
              messages: [],
              createdAt: now,
              updatedAt: now
            }
            set({
              chats: [newChat],
              currentChatId: newChatId,
              messages: []
            })
          }
        } else {
          set({ chats: updatedChats })
        }
      },
      
      clearSearchHistory: () => set({ searchHistory: [] }),

      // Shared Search Actions
      setCurrentSearchTerm: (term: string) => set({ currentSearchTerm: term }),

      // Identifier Search Actions
      setIdentifierResults: (query: string, results: SearchIdentifiersResponse) => {
        set({ 
          currentIdentifierResults: results,
          currentIdentifierQuery: query.trim()
        });
      },
      clearIdentifierResults: () => {
        set({ 
          currentIdentifierResults: null,
          currentIdentifierQuery: ''
        });
      },
      setSpeciesFilter: (species: string) => {
        set({ currentSpeciesFilter: species });
      },
    })) as SearchStateCreator,
    {
      name: 'search-store',
      partialize: (state) => ({
        chats: state.chats,
        currentChatId: state.currentChatId,
        searchHistory: state.searchHistory,
        currentSearchTerm: state.currentSearchTerm,
        currentIdentifierResults: state.currentIdentifierResults,
        currentIdentifierQuery: state.currentIdentifierQuery,
        currentSpeciesFilter: state.currentSpeciesFilter,
      }),
    }
  )
) 