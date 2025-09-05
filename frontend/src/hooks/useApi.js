// src/hooks/useApi.js
import { useState, useCallback } from 'react';

/**
 * Custom hook for API calls with loading and error states
 * @param {Function} apiFunction - API function to call
 * @returns {Object} API state and handlers
 */
export const useApi = (apiFunction) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
};

/**
 * Custom hook for paginated API calls
 * @param {Function} apiFunction - API function to call
 * @param {Object} initialParams - Initial parameters
 * @returns {Object} Paginated API state and handlers
 */
export const usePaginatedApi = (apiFunction, initialParams = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async (params = {}, reset = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentPage = reset ? 1 : page;
      const result = await apiFunction({
        ...initialParams,
        ...params,
        page: currentPage,
        limit: 10,
      });

      if (reset) {
        setData(result.data || result.items || []);
        setPage(1);
      } else {
        setData(prev => [...prev, ...(result.data || result.items || [])]);
        setPage(prev => prev + 1);
      }

      setTotal(result.total || 0);
      setHasMore(result.hasMore || (result.data || result.items || []).length === 10);
      
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, initialParams, page]);

  const loadMore = useCallback((params = {}) => {
    if (!loading && hasMore) {
      return fetchData(params, false);
    }
  }, [loading, hasMore, fetchData]);

  const refresh = useCallback((params = {}) => {
    return fetchData(params, true);
  }, [fetchData]);

  const reset = useCallback(() => {
    setData([]);
    setError(null);
    setLoading(false);
    setHasMore(true);
    setPage(1);
    setTotal(0);
  }, []);

  return {
    data,
    loading,
    error,
    hasMore,
    total,
    fetchData,
    loadMore,
    refresh,
    reset,
  };
};
