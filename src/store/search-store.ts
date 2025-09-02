import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { StateCreator } from 'zustand'
import { nanoid } from 'nanoid'
import { ChatMessage, ChatSession, SearchHistoryItem } from '@/types/chat'

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
  addChatToHistory: (chatId: string, firstUserMessage: string) => void
  clearSearchHistory: () => void

  // Shared Search Actions
  setCurrentSearchTerm: (term: string) => void
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
        const newChat: ChatSession = { id: newChatId, messages: newMessages }
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

        const updatedChats = chats.map(chat =>
          chat.id === currentChatId ? { ...chat, messages: messages } : chat
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
            const newChat: ChatSession = { id: newChatId, messages: [] }
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
      
      addChatToHistory: (chatId: string, firstUserMessage: string) => {
        if (!firstUserMessage.trim()) return
        
        const { searchHistory, maxHistoryItems } = get()
        const chatUrl = `/chat?id=${chatId}`
        const truncatedMessage = firstUserMessage.trim().length > 15 
          ? firstUserMessage.trim().slice(0, 15) + '...'
          : firstUserMessage.trim();
          
        const newItem: SearchHistoryItem = {
          id: nanoid(),
          query: truncatedMessage,
          type: 'chat',
          timestamp: Date.now(),
          url: chatUrl
        }
        
        // Remove existing chat entry with same chatId and add new one at the beginning
        const filteredHistory = searchHistory.filter(item => item.url !== chatUrl)
        const updatedHistory = [newItem, ...filteredHistory].slice(0, maxHistoryItems)
        
        set({ searchHistory: updatedHistory })
      },
      
      clearSearchHistory: () => set({ searchHistory: [] }),

      // Shared Search Actions
      setCurrentSearchTerm: (term: string) => set({ currentSearchTerm: term }),
    })) as SearchStateCreator,
    {
      name: 'search-store',
      partialize: (state) => ({
        chats: state.chats,
        currentChatId: state.currentChatId,
        searchHistory: state.searchHistory,
        currentSearchTerm: state.currentSearchTerm,
      }),
    }
  )
) 