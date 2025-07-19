import { useSearchParams, useRouter } from 'next/navigation'
import { useCallback, useMemo } from 'react'

export function useUrlState<T>(
  key: string,
  defaultValue: T,
  parse: (value: string) => T = (v) => JSON.parse(v) as T,
  serialize: (value: T) => string = JSON.stringify
) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const value = useMemo(() => {
    const param = searchParams.get(key)
    if (!param) return defaultValue
    try {
      return parse(param)
    } catch {
      return defaultValue
    }
  }, [searchParams, key, defaultValue, parse])

  const setValue = useCallback((newValue: T | ((prev: T) => T)) => {
    const params = new URLSearchParams(searchParams.toString())
    const finalValue = typeof newValue === 'function' 
      ? (newValue as (prev: T) => T)(value)
      : newValue

    if (finalValue === defaultValue || finalValue === null || finalValue === undefined) {
      params.delete(key)
    } else {
      params.set(key, serialize(finalValue))
    }

    router.push(`?${params.toString()}`, { scroll: false })
  }, [searchParams, router, key, value, defaultValue, serialize])

  return [value, setValue] as const
}