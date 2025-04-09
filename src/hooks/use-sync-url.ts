import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useSearchStore } from '@/store/search-store'
import { getProteinAnnotations } from '@/features/annotations-browser/api/queries'
import { searchProteinNeighbors } from '@/features/interactions-browser/api/queries'

export function useSyncUrl() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const {
    annotationsQuery,
    annotationsResults,
    interactionsQuery,
    interactionsResults,
    setAnnotationsQuery,
    setAnnotationsResults,
    setInteractionsQuery,
    setInteractionsResults,
  } = useSearchStore()

  // Sync URL with store state and trigger search if needed
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    
    // Update store from URL
    const urlAnnotationsQuery = params.get('annotations')
    const urlInteractionsQuery = params.get('interactions')
    
    if (urlAnnotationsQuery && urlAnnotationsQuery !== annotationsQuery) {
      setAnnotationsQuery(urlAnnotationsQuery)
      // Trigger search if there are no results
      if (annotationsResults.length === 0) {
        getProteinAnnotations(urlAnnotationsQuery)
          .then(response => setAnnotationsResults(response.annotations))
          .catch(error => console.error('Error fetching annotations:', error))
      }
    }
    
    if (urlInteractionsQuery && urlInteractionsQuery !== interactionsQuery) {
      setInteractionsQuery(urlInteractionsQuery)
      // Trigger search if there are no results
      if (interactionsResults.length === 0) {
        searchProteinNeighbors(urlInteractionsQuery)
          .then(response => setInteractionsResults(response.interactions))
          .catch(error => console.error('Error fetching interactions:', error))
      }
    }
  }, [searchParams])

  // Update URL when store changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (annotationsQuery) {
      params.set('annotations', annotationsQuery)
    } else {
      params.delete('annotations')
    }
    
    if (interactionsQuery) {
      params.set('interactions', interactionsQuery)
    } else {
      params.delete('interactions')
    }
    
    // Only update URL if there are actual changes
    if (params.toString() !== searchParams.toString()) {
      router.push(`?${params.toString()}`, { scroll: false })
    }
  }, [annotationsQuery, interactionsQuery])
} 