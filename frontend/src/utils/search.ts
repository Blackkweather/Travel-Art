/**
 * Advanced search utilities
 */

export interface SearchFilters {
  query?: string;
  discipline?: string;
  location?: string;
  dateFrom?: string;
  dateTo?: string;
  priceRange?: {
    min?: number;
    max?: number;
  };
  rating?: number;
  sortBy?: 'relevance' | 'price' | 'rating' | 'date';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  id: string;
  type: 'artist' | 'hotel';
  title: string;
  description: string;
  location?: string;
  image?: string;
  rating?: number;
  price?: number;
  relevance: number;
}

class AdvancedSearch {
  /**
   * Perform fuzzy search on text
   */
  fuzzyMatch(text: string, query: string): number {
    if (!query) return 1;
    
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    
    // Exact match
    if (lowerText === lowerQuery) return 1;
    
    // Starts with query
    if (lowerText.startsWith(lowerQuery)) return 0.9;
    
    // Contains query
    if (lowerText.includes(lowerQuery)) return 0.7;
    
    // Fuzzy match (character sequence)
    let textIndex = 0;
    let queryIndex = 0;
    let matches = 0;
    
    while (textIndex < lowerText.length && queryIndex < lowerQuery.length) {
      if (lowerText[textIndex] === lowerQuery[queryIndex]) {
        matches++;
        queryIndex++;
      }
      textIndex++;
    }
    
    if (queryIndex === lowerQuery.length) {
      return 0.5 * (matches / lowerQuery.length);
    }
    
    return 0;
  }

  /**
   * Calculate relevance score
   */
  calculateRelevance(item: any, filters: SearchFilters): number {
    let score = 0;
    
    if (filters.query) {
      const titleScore = this.fuzzyMatch(item.title || item.name || '', filters.query);
      const descScore = this.fuzzyMatch(item.description || item.bio || '', filters.query);
      score += (titleScore * 0.7 + descScore * 0.3);
    } else {
      score = 1; // No query means all items are equally relevant
    }
    
    // Boost score for matching filters
    if (filters.discipline && item.discipline?.includes(filters.discipline)) {
      score += 0.2;
    }
    
    if (filters.location && item.location?.includes(filters.location)) {
      score += 0.2;
    }
    
    if (filters.rating && item.rating && item.rating >= filters.rating) {
      score += 0.1;
    }
    
    return Math.min(score, 1);
  }

  /**
   * Sort results
   */
  sortResults(results: SearchResult[], sortBy: string, sortOrder: 'asc' | 'desc'): SearchResult[] {
    const sorted = [...results];
    
    sorted.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'relevance':
          comparison = b.relevance - a.relevance;
          break;
        case 'price':
          comparison = (a.price || 0) - (b.price || 0);
          break;
        case 'rating':
          comparison = (b.rating || 0) - (a.rating || 0);
          break;
        case 'date':
          // Assuming date is available in results
          comparison = 0; // Implement date comparison if needed
          break;
        default:
          comparison = b.relevance - a.relevance;
      }
      
      return sortOrder === 'asc' ? -comparison : comparison;
    });
    
    return sorted;
  }

  /**
   * Filter results by price range
   */
  filterByPrice(results: SearchResult[], min?: number, max?: number): SearchResult[] {
    if (!min && !max) return results;
    
    return results.filter(result => {
      if (!result.price) return false;
      if (min && result.price < min) return false;
      if (max && result.price > max) return false;
      return true;
    });
  }

  /**
   * Filter results by date range
   */
  filterByDate(results: SearchResult[], dateFrom?: string, dateTo?: string): SearchResult[] {
    if (!dateFrom && !dateTo) return results;
    
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;
    
    return results.filter(result => {
      // Implement date filtering logic based on your data structure
      // This is a placeholder
      return true;
    });
  }

  /**
   * Perform search with filters
   */
  search(items: any[], filters: SearchFilters): SearchResult[] {
    // Calculate relevance for each item
    let results: SearchResult[] = items.map(item => ({
      id: item.id,
      type: item.type || 'artist',
      title: item.name || item.stageName || item.title || '',
      description: item.description || item.bio || '',
      location: item.location || item.country || '',
      image: item.profilePicture || item.image,
      rating: item.rating,
      price: item.price || item.priceRange,
      relevance: this.calculateRelevance(item, filters),
    }));

    // Filter by price
    if (filters.priceRange) {
      results = this.filterByPrice(
        results,
        filters.priceRange.min,
        filters.priceRange.max
      );
    }

    // Filter by date
    if (filters.dateFrom || filters.dateTo) {
      results = this.filterByDate(results, filters.dateFrom, filters.dateTo);
    }

    // Sort results
    results = this.sortResults(
      results,
      filters.sortBy || 'relevance',
      filters.sortOrder || 'desc'
    );

    // Filter out zero relevance results if query exists
    if (filters.query) {
      results = results.filter(r => r.relevance > 0);
    }

    return results;
  }
}

// Singleton instance
export const advancedSearch = new AdvancedSearch();

export default advancedSearch;





