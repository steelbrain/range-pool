/* @flow */

export type PoolWorker$Serialized = {
  active: boolean,
  startIndex: number,
  limitIndex: number,
  currentIndex: number
}

export type RangePool$Serialized = {
  length: number,
  complete: boolean,
  workers: Array<PoolWorker$Serialized>
}
