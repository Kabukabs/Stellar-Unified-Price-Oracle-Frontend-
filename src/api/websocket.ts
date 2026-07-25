import { config } from '../config'
import type { WsMessage, WsSubscribeMessage, WsUnsubscribeMessage } from '../types'
import { wsAnalytics } from '../utils/wsAnalytics'

type MessageHandler = (msg: WsMessage) => void
type StatusHandler = (status: ConnectionStatus) => void

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting'

const supportsDecompression = typeof DecompressionStream !== 'undefined'

async function decompress(data: Blob): Promise<string> {
  try {
    const ds = new DecompressionStream('gzip')
    const decompressed = data.stream().pipeThrough(ds)
    const reader = decompressed.getReader()
    const chunks: Uint8Array[] = []
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }
    const total = chunks.reduce((n, c) => n + c.length, 0)
    const merged = new Uint8Array(total)
    let offset = 0
    for (const c of chunks) { merged.set(c, offset); offset += c.length }
    return new TextDecoder().decode(merged)
  } catch {
    return data.text()
  }
}

/**
 * Manages a single WebSocket connection to the price feed server.
 *
 * Handles connect/disconnect lifecycle, automatic reconnection, per-pair subscriptions,
 * optional gzip decompression of binary frames, and fan-out to registered message and
 * status-change handlers.
 *
 * Fix for issue #260 (stale closure in WebSocket event handlers):
 * The `onmessage` and `onstatuschange` handlers used to close over specific callback
 * references captured at connection time. When parent components re-rendered with new
 * callback references, the WebSocket handler would continue using the old captured
 * values, causing stale state updates.
 *
 * The fix stores all message and status handlers in stable `Set` refs that are read
 * at event-dispatch time (not captured at subscription time). A single persistent
 * `onmessage` closure dispatches to the current contents of `messageHandlersRef`
 * and `statusHandlersRef`, so every handler call always invokes the **latest** registered
 * callbacks — regardless of how many times the parent component has re-rendered.
 */
export class WebSocketClient {
  private ws: WebSocket | null = null

  /**
   * Stable ref holding the current set of message handlers.
   * The `onmessage` closure reads from this ref at dispatch time, ensuring it
   * always calls the latest registered handlers (no stale closure capture).
   */
  private messageHandlersRef: Set<MessageHandler> = new Set()

  /**
   * Stable ref holding the current set of status handlers.
   * Same approach as messageHandlersRef — read at dispatch time, never captured.
   */
  private statusHandlersRef: Set<StatusHandler> = new Set()

  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectAttempt = 0
  private destroyed = false
  private subscribedPairs = new Set<string>()
  private useCompression = false

  private _status: ConnectionStatus = 'disconnected'
  get status(): ConnectionStatus {
    return this._status
  }

  private setStatus(status: ConnectionStatus) {
    this._status = status
    // Read handlers from the stable ref at dispatch time — never stale.
    this.statusHandlersRef.forEach((h) => h(status))
  }

  /** Opens the WebSocket connection. Appends `?compress=1` when the browser supports `DecompressionStream`. */
  connect() {
    if (this.destroyed) return
    this.setStatus('connecting')

    const url = supportsDecompression
      ? `${config.wsUrl}${config.wsUrl.includes('?') ? '&' : '?'}compress=1`
      : config.wsUrl

    this.ws = new WebSocket(url)
    this.ws.binaryType = 'blob'

    this.ws.onopen = () => {
      this.reconnectAttempt = 0
      this.setStatus('connected')
      if (this.subscribedPairs.size > 0) {
        this.send({
          action: 'subscribe',
          assetPairs: Array.from(this.subscribedPairs),
        })
      }
    }

    // Fix: capture a reference to the stable handler Sets (not individual callbacks).
    // Each time a message arrives, we iterate the *current* contents of
    // `messageHandlersRef`, so newly registered or updated handlers are always used.
    const messageHandlersRef = this.messageHandlersRef
    this.ws.onmessage = async (e) => {
      try {
        let text: string
        if (e.data instanceof Blob) {
          text = supportsDecompression ? await decompress(e.data) : await e.data.text()
          this.useCompression = true
        } else {
          text = e.data as string
        }
        const msg = JSON.parse(text)
        // Dispatch to the latest registered handlers, not to a stale snapshot.
        messageHandlersRef.forEach((h) => h(msg as WsMessage))
      } catch {
        // ignore malformed messages
      }
    }

    this.ws.onclose = () => {
      this.useCompression = false
      wsAnalytics.recordDisconnect()
      this.setStatus('disconnected')
      this.scheduleReconnect()
    }

    this.ws.onerror = () => {
      wsAnalytics.recordError()
      this.ws?.close()
    }
  }

  private scheduleReconnect() {
    if (this.destroyed || this.reconnectTimer) return
    this.setStatus('reconnecting')
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempt), 8000)
    this.reconnectAttempt++
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, delay)
  }

  /** Permanently closes the connection and cancels any pending reconnect timer. Calling {@link connect} again after this is a no-op. */
  disconnect() {
    this.destroyed = true
    this.reconnectAttempt = 0
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.ws?.close()
    this.ws = null
    this.setStatus('disconnected')
  }

  /** Sends a raw subscribe or unsubscribe message. Silently dropped if the socket is not open. */
  send(msg: WsSubscribeMessage | WsUnsubscribeMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    }
  }

  /** Adds pairs to the tracked subscription set and sends a subscribe message. Re-subscribed automatically on reconnect. */
  subscribe(pairs: string | string[]) {
    const arr = typeof pairs === 'string' ? [pairs] : pairs
    arr.forEach((p) => this.subscribedPairs.add(p))
    this.send({ action: 'subscribe', assetPairs: arr })
  }

  /** Removes pairs from the tracked subscription set and sends an unsubscribe message. */
  unsubscribe(pairs: string | string[]) {
    const arr = typeof pairs === 'string' ? [pairs] : pairs
    arr.forEach((p) => this.subscribedPairs.delete(p))
    this.send({ action: 'unsubscribe', assetPairs: arr })
  }

  /**
   * Registers a handler to be called for every incoming {@link WsMessage}.
   * Returns an unsubscribe function.
   *
   * Because handlers are stored in a stable Set and read at dispatch time,
   * updating the handler (e.g. passing a new closure on re-render) and
   * calling the unsubscribe + re-subscribe pattern will always use the
   * current handler without stale-closure issues.
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlersRef.add(handler)
    return () => this.messageHandlersRef.delete(handler)
  }

  /**
   * Registers a handler to be called whenever the connection status changes.
   * Returns an unsubscribe function.
   */
  onStatusChange(handler: StatusHandler): () => void {
    this.statusHandlersRef.add(handler)
    return () => this.statusHandlersRef.delete(handler)
  }

  get isCompressed(): boolean {
    return this.useCompression
  }
}
