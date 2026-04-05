const STORAGE_KEY = 'canvas_openai_key'

export const getStoredApiKey = () => localStorage.getItem(STORAGE_KEY) || ''
export const saveApiKey = (key) => localStorage.setItem(STORAGE_KEY, key)
export const clearApiKey = () => localStorage.removeItem(STORAGE_KEY)
