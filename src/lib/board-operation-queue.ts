export interface BoardOperationMeta {
  clientOperationId: string
  clientSequence: number
}

export interface BoardOperationStats {
  enqueued: number
  coalesced: number
  executed: number
  failed: number
  pending: number
  maxPendingAgeMs: number
}

interface QueueEntry<TPayload extends Record<string, unknown>> {
  scopeKey: string
  coalesceKey?: string
  enqueuedAt: number
  payload: TPayload & BoardOperationMeta
  execute: (payload: TPayload & BoardOperationMeta) => Promise<void>
  waiters: Array<{
    resolve: (result: BoardOperationResult) => void
    reject: (error: unknown) => void
  }>
}

export interface BoardOperationResult {
  clientOperationId: string
  clientSequence: number
  staleError: boolean
}

interface EnqueueArgs<TPayload extends Record<string, unknown>> {
  scopeKey: string
  coalesceKey?: string
  payload: TPayload
  execute: (payload: TPayload & BoardOperationMeta) => Promise<void>
}

const createOperationId = () =>
  `op-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`

export class BoardOperationQueue {
  private queue: Array<QueueEntry<Record<string, unknown>>> = []
  private queuedByCoalesceKey = new Map<string, QueueEntry<Record<string, unknown>>>()
  private isRunning = false
  private nextSequence = 1
  private latestIssuedByScope = new Map<string, number>()
  private latestAckedByScope = new Map<string, number>()
  private stats: BoardOperationStats = {
    enqueued: 0,
    coalesced: 0,
    executed: 0,
    failed: 0,
    pending: 0,
    maxPendingAgeMs: 0,
  }

  getStats(): BoardOperationStats {
    return { ...this.stats }
  }

  async enqueue<TPayload extends Record<string, unknown>>(
    args: EnqueueArgs<TPayload>,
  ): Promise<BoardOperationResult> {
    const sequence = this.nextSequence++
    const payload = {
      ...args.payload,
      clientOperationId: createOperationId(),
      clientSequence: sequence,
    }

    this.latestIssuedByScope.set(args.scopeKey, sequence)
    this.stats.enqueued += 1

    return new Promise<BoardOperationResult>((resolve, reject) => {
      const entry = this.getOrCreateQueueEntry(args, payload as TPayload & BoardOperationMeta)
      entry.waiters.push({ resolve, reject })
      this.stats.pending = this.queue.length
      this.startProcessor()
    })
  }

  private getOrCreateQueueEntry<TPayload extends Record<string, unknown>>(
    args: EnqueueArgs<TPayload>,
    payload: TPayload & BoardOperationMeta,
  ): QueueEntry<Record<string, unknown>> {
    if (args.coalesceKey) {
      const existing = this.queuedByCoalesceKey.get(args.coalesceKey)
      if (existing) {
        existing.payload = payload
        this.stats.coalesced += 1
        return existing
      }
    }

    const entry: QueueEntry<Record<string, unknown>> = {
      scopeKey: args.scopeKey,
      coalesceKey: args.coalesceKey,
      enqueuedAt: Date.now(),
      payload,
      execute: args.execute as (payload: Record<string, unknown> & BoardOperationMeta) => Promise<void>,
      waiters: [],
    }
    this.queue.push(entry)
    if (args.coalesceKey) {
      this.queuedByCoalesceKey.set(args.coalesceKey, entry)
    }
    return entry
  }

  private startProcessor() {
    if (this.isRunning) {
      return
    }
    this.isRunning = true
    void this.processQueue()
  }

  private async processQueue() {
    while (this.queue.length > 0) {
      const entry = this.queue.shift()
      if (!entry) {
        continue
      }

      if (entry.coalesceKey) {
        this.queuedByCoalesceKey.delete(entry.coalesceKey)
      }

      this.stats.pending = this.queue.length
      this.stats.maxPendingAgeMs = Math.max(
        this.stats.maxPendingAgeMs,
        Date.now() - entry.enqueuedAt,
      )

      try {
        await entry.execute(entry.payload)
        this.stats.executed += 1
        this.latestAckedByScope.set(entry.scopeKey, entry.payload.clientSequence)
        for (const waiter of entry.waiters) {
          waiter.resolve({
            clientOperationId: entry.payload.clientOperationId,
            clientSequence: entry.payload.clientSequence,
            staleError: false,
          })
        }
      } catch (error) {
        this.stats.failed += 1
        const latestIssued = this.latestIssuedByScope.get(entry.scopeKey) ?? 0
        const staleError = entry.payload.clientSequence < latestIssued
        if (!staleError) {
          this.latestAckedByScope.set(entry.scopeKey, entry.payload.clientSequence)
        }

        for (const waiter of entry.waiters) {
          if (staleError) {
            waiter.resolve({
              clientOperationId: entry.payload.clientOperationId,
              clientSequence: entry.payload.clientSequence,
              staleError: true,
            })
            continue
          }
          waiter.reject(error)
        }
      }
    }

    this.stats.pending = 0
    this.isRunning = false
  }
}
