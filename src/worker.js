'use strict'

/* @flow */

import invariant from 'assert'
import {CompositeDisposable, Emitter} from 'sb-event-kit'
import type {Disposable} from 'sb-event-kit'

export class PoolWorker {
  startIndex: number;
  currentIndex: number;
  limitIndex: number;
  subscriptions: CompositeDisposable;
  emitter: Emitter;

  constructor(startIndex: number, limitIndex: number) {
    invariant(typeof startIndex === 'number', 'startIndex is not a number')
    invariant(typeof limitIndex === 'number', 'limitIndex is not a number')

    this.subscriptions = new CompositeDisposable()
    this.emitter = new Emitter()
    this.startIndex = startIndex
    this.currentIndex = this.startIndex
    this.limitIndex = limitIndex

    this.subscriptions.add(this.emitter)
  }
  advance(steps: number) {
    const remaining = this.getRemaining()
    if (steps > remaining) {
      throw new Error('Cannot advance worker more than maximum')
    }
    this.currentIndex += steps
  }
  getCompletionPercentage(): number {
    return ((this.currentIndex - this.startIndex) / (this.limitIndex - this.startIndex)) * 100
  }
  getRemaining(): number {
    return this.limitIndex - this.currentIndex
  }
  isComplete(): boolean {
    return this.getRemaining() === 0
  }
  onDidDestroy(callback: Function): Disposable {
    return this.emitter.on('did-destroy', callback)
  }
  dispose() {
    this.emitter.emit('did-destroy')
    this.limitIndex = this.currentIndex
    this.subscriptions.dispose()
  }
}
