'use babel'

import RangeWorker from '../src/worker'

describe('Pool Worker', function() {
  function getWorker(param1: any, param2: any): RangeWorker {
    return new RangeWorker(param1, param2)
  }

  it('cries if start index is not valid', function() {
    expect(function() {
      getWorker(null)
    }).toThrow()
    expect(function() {
      getWorker(Infinity)
    }).toThrow()
    expect(function() {
      getWorker(-1)
    }).toThrow()
    getWorker(0, 1)
    getWorker(0, Infinity)
  })

  it('cries if limitIndex is invalid', function() {
    expect(function() {
      getWorker(0, null)
    }).toThrow()
    expect(function() {
      getWorker(0, 0)
    }).toThrow()
    expect(function() {
      getWorker(5, 5)
    }).toThrow()
    getWorker(0, 100)
  })

  it('has a working advance method', function() {
    const worker = getWorker(0, 50)
    expect(worker.currentIndex).toBe(0)
    worker.advance(30)
    expect(worker.currentIndex).toBe(30)
    expect(function() {
      worker.advance('asdasd')
    }).toThrow()
    expect(function() {
      worker.advance(-5)
    }).toThrow()
    worker.advance(2)
    expect(worker.currentIndex).toBe(32)
    expect(function() {
      worker.advance(20)
    }).toThrow()
  })

  it('has a working setStatus method', function() {
    const worker = getWorker(0, 50)
    worker.setStatus(null)
    expect(worker.getStatus()).toBe(false)
    worker.setStatus(1)
    expect(worker.getStatus()).toBe(true)
    worker.setStatus('asdasd')
    expect(worker.getStatus()).toBe(true)
  })

  it('has a working getCompletionPercentage method', function() {
    const worker = getWorker(50, 100)
    expect(worker.getCompletionPercentage()).toBe(0)
    worker.advance(5)
    expect(worker.getCompletionPercentage()).toBe(10)
    worker.advance(10)
    expect(worker.getCompletionPercentage()).toBe(30)
    worker.advance(35)
    expect(worker.getCompletionPercentage()).toBe(100)
  })

  it('has a valid getRemaining method', function() {
    const worker = getWorker(50, 100)
    expect(worker.getRemaining()).toBe(50)
    worker.advance(10)
    expect(worker.getRemaining()).toBe(40)
    worker.advance(30)
    expect(worker.getRemaining()).toBe(10)
    worker.advance(10)
    expect(worker.getRemaining()).toBe(0)
  })

  it('has a valid hasCompleted method', function() {
    const worker = getWorker(50, 100)
    expect(worker.hasCompleted()).toBe(false)
    worker.advance(50)
    expect(worker.hasCompleted()).toBe(true)
  })

  it('has an active state', function() {
    const worker = getWorker(50, 100)
    expect(worker.getStatus()).toBe(false)
    worker.setStatus(true)
    expect(worker.getStatus()).toBe(true)
    worker.dispose()
    expect(worker.getStatus()).toBe(false)
    worker.setStatus(true)
    expect(worker.getStatus()).toBe(true)
    worker.dispose()
    expect(worker.getStatus()).toBe(false)
    worker.setStatus(true)
    expect(worker.getStatus()).toBe(true)
    worker.dispose()
    expect(worker.getStatus()).toBe(false)
  })

  it('is serializable', function() {
    const worker = getWorker(50, 100)
    worker.advance(10)
    worker.setMetadata({ hello: 'world' })
    const cloneWorker = RangeWorker.unserialize(worker.serialize())
    expect(worker).toEqual(cloneWorker)
  })

  it('reports correct percentage when ends at Infinity', function() {
    const worker = getWorker(50, Infinity)
    expect(worker.getCompletionPercentage()).toBe(0)
  })

  it('has a working metadata api', function() {
    const worker = getWorker(0, 100)

    expect(worker.getMetadata()).toEqual({})

    expect(function() {
      worker.setMetadata('hello')
    }).toThrow('metadata must be a valid object')
    expect(function() {
      worker.setMetadata(null)
    }).toThrow('metadata must be a valid object')

    // It doesn't return refs
    worker.getMetadata().a = 1
    expect(worker.getMetadata()).toEqual({})

    worker.setMetadata({ hello: 'world', 1: 2 })
    expect(worker.getMetadata()).toEqual({ hello: 'world', 1: 2 })
  })
})
