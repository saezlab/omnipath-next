import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { StateCreator } from 'zustand'
import { nanoid } from 'nanoid'
import { ChatMessage, ChatSession, SearchHistoryItem } from '@/types/chat'

interface SearchState {
  // Chat state (persistence only)
  chats: ChatSession[]
  currentChatId: string | null

  // Search history
  searchHistory: SearchHistoryItem[]
  maxHistoryItems: number

  // Chat Actions
  startNewChat: (initialMessages?: ChatMessage[]) => string
  switchChat: (chatId: string) => void
  updateChat: (chatId: string, messages: ChatMessage[]) => void
  deleteChat: (chatId: string) => void
  getCurrentChat: () => ChatSession | null

  // Search History Actions
  addToSearchHistory: (query: string, type: SearchHistoryItem['type'], url: string) => void
  clearSearchHistory: () => void
}

type SearchStateCreator = StateCreator<SearchState, [], []>

export const useSearchStore = create<SearchState>()(
  persist(
    ((set, get) => ({
      // Chat initial state
      chats: [],
      currentChatId: null,

      // Search history initial state
      searchHistory: [],
      maxHistoryItems: 20,

      // Chat Actions
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
        })
        return newChatId
      },
      switchChat: (chatId: string) => {
        const targetChat = get().chats.find(chat => chat.id === chatId)
        if (targetChat) {
          set({ currentChatId: chatId })
        }
      },
      updateChat: (chatId: string, messages: ChatMessage[]) => {
        const { chats } = get()
        const updatedChats = chats.map(chat =>
          chat.id === chatId ? { 
            ...chat, 
            messages: messages, 
            updatedAt: Date.now()
          } : chat
        )
        set({ chats: updatedChats })
      },
      getCurrentChat: () => {
        const { chats, currentChatId } = get()
        return chats.find(chat => chat.id === currentChatId) || null
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
              currentChatId: firstChat.id
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
              currentChatId: newChatId
            })
          }
        } else {
          set({ chats: updatedChats })
        }
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
      
      clearSearchHistory: () => set({ searchHistory: [] }),
    })) as SearchStateCreator,
    {
      name: 'omnipath-store',
      partialize: (state) => ({
        chats: state.chats,
        currentChatId: state.currentChatId,
        searchHistory: state.searchHistory,
      }),
    }
  )
) 