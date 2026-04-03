import { useState, useCallback } from 'react'

export type SortDirection = 'asc' | 'desc'

export interface UseSortOptions<T extends string> {
  defaultColumn?: T
  defaultDirection?: SortDirection
}

export interface UseSortReturn<T extends string> {
  sortColumn: T | null
  sortDirection: SortDirection
  handleSort: (column: T) => void
  getSortDirection: (column: T) => SortDirection
  isActive: (column: T) => boolean
}

export function useSort<T extends string>(
  options: UseSortOptions<T> = {}
): UseSortReturn<T> {
  const { defaultColumn, defaultDirection = 'desc' } = options
  const [sortColumn, setSortColumn] = useState<T | null>(defaultColumn ?? null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultDirection)

  const handleSort = useCallback((column: T) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection(column === 'name' || column === 'publisherName' ? 'asc' : defaultDirection)
    }
  }, [sortColumn, defaultDirection])

  const getSortDirection = useCallback((column: T): SortDirection => {
    if (sortColumn !== column) return 'asc'
    return sortDirection
  }, [sortColumn, sortDirection])

  const isActive = useCallback((column: T): boolean => {
    return sortColumn === column
  }, [sortColumn])

  return {
    sortColumn,
    sortDirection,
    handleSort,
    getSortDirection,
    isActive,
  }
}

export function useSortedData<T>(
  data: T[],
  sortColumn: string | null,
  sortDirection: SortDirection,
  compareFn?: (a: T, b: T, col: string, dir: SortDirection) => number
): T[] {
  if (!sortColumn) return data

  return [...data].sort((a, b) => {
    if (compareFn) {
      return compareFn(a, b, sortColumn, sortDirection)
    }
    const aVal = (a as Record<string, unknown>)[sortColumn]
    const bVal = (b as Record<string, unknown>)[sortColumn]
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
    }
    return 0
  })
}