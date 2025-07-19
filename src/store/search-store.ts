import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { StateCreator } from 'zustand'
import { nanoid } from 'nanoid'
import { ToolInvocation } from 'ai'

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
  // Chat state
  chats: ChatSession[]
  currentChatId: string | null
  messages: ChatMessage[]

  // Search history
  searchHistory: SearchHistoryItem[]
  maxHistoryItems: number

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
      // Chat initial state
      chats: [{ id: initialChatId, messages: [] }],
      currentChatId: initialChatId,
      messages: [],

      // Search history initial state
      searchHistory: [],
      maxHistoryItems: 20,

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
        chats: state.chats,
        currentChatId: state.currentChatId,
        searchHistory: state.searchHistory,
      }),
    }
  )
) 