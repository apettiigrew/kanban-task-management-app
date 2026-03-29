import { BoardOperationQueue } from '@/lib/board-operation-queue'

describe('BoardOperationQueue', () => {
  it('serializes operations in enqueue order', async () => {
    const queue = new BoardOperationQueue()
    const order: number[] = []

    await Promise.all([
      queue.enqueue({
        scopeKey: 'board-a',
        payload: { value: 1 },
        execute: async ({ value }) => {
          await new Promise((resolve) => setTimeout(resolve, 20))
          order.push(Number(value))
        },
      }),
      queue.enqueue({
        scopeKey: 'board-a',
        payload: { value: 2 },
        execute: async ({ value }) => {
          order.push(Number(value))
        },
      }),
    ])

    expect(order).toEqual([1, 2])
    expect(queue.getStats().executed).toBe(2)
  })

  it('coalesces matching operations before flush', async () => {
    const queue = new BoardOperationQueue()
    const values: number[] = []

    const blocking = queue.enqueue({
      scopeKey: 'board-a',
      payload: { value: 0 },
      execute: async ({ value }) => {
        values.push(Number(value))
        await new Promise((resolve) => setTimeout(resolve, 25))
      },
    })

    const first = queue.enqueue({
      scopeKey: 'board-a',
      coalesceKey: 'reorder-column-1',
      payload: { value: 1 },
      execute: async ({ value }) => {
        values.push(Number(value))
      },
    })

    const second = queue.enqueue({
      scopeKey: 'board-a',
      coalesceKey: 'reorder-column-1',
      payload: { value: 99 },
      execute: async ({ value }) => {
        values.push(Number(value))
      },
    })

    await blocking
    const [firstResult, secondResult] = await Promise.all([first, second])

    expect(values).toEqual([0, 99])
    expect(firstResult.clientSequence).toBe(secondResult.clientSequence)
    expect(queue.getStats().coalesced).toBe(1)
  })

  it('marks stale failures as non-fatal when superseded', async () => {
    const queue = new BoardOperationQueue()
    const execution: number[] = []

    const first = queue.enqueue({
      scopeKey: 'board-a',
      payload: { value: 1 },
      execute: async ({ value }) => {
        execution.push(Number(value))
        await new Promise((resolve) => setTimeout(resolve, 15))
        throw new Error('old op failed')
      },
    })

    const second = queue.enqueue({
      scopeKey: 'board-a',
      payload: { value: 2 },
      execute: async ({ value }) => {
        execution.push(Number(value))
      },
    })

    const firstResult = await first
    const secondResult = await second

    expect(execution).toEqual([1, 2])
    expect(firstResult.staleError).toBe(true)
    expect(secondResult.staleError).toBe(false)
  })
})
