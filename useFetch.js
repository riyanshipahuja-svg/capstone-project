import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../api/client';

// Runs an API call whenever `deps` change. Returns { data, meta, loading, error, reload }.
export default function useFetch(fn, deps = []) {
  const [state, setState] = useState({ data: null, meta: null, loading: true, error: null });
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fnRef.current();
      setState({ data: res.data.data, meta: res.data.meta || null, loading: false, error: null });
    } catch (err) {
      setState({ data: null, meta: null, loading: false, error: getErrorMessage(err) });
    }
  }, []);

  useEffect(() => { run(); }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return { ...state, reload: run };
}

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '-';
export const formatDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-';
export const todayISO = () => new Date().toISOString().slice(0, 10);
