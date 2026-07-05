import { useEffect, useRef, useCallback } from 'react'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/api/v1/ws'

export function useLiveFeed(onTransaction) {
  const wsRef          = useRef(null)
  const reconnectTimer = useRef(null)
  const mountedRef     = useRef(true)

  const connect = useCallback(() => {
    if (!mountedRef.current) return

    try {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected')
        // Send ping every 20s to keep connection alive
        const ping = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping')
          }
        }, 20000)
        ws._pingInterval = ping
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'new_transaction') {
            onTransaction(data)
          }
        } catch (e) {
          // pong or other message — ignore
        }
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected — reconnecting in 3s...')
        clearInterval(ws._pingInterval)
        if (mountedRef.current) {
          reconnectTimer.current = setTimeout(connect, 3000)
        }
      }

      ws.onerror = () => {
        ws.close()
      }

    } catch (e) {
      console.error('WebSocket error:', e)
    }
  }, [onTransaction])

  useEffect(() => {
    mountedRef.current = true
    connect()
    return () => {
      mountedRef.current = false
      clearTimeout(reconnectTimer.current)
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])
}