#### 2.1.1

- Fix a bug where unserialized workers would be assumed active

#### 2.1.0

- Add proper `Infinity` support to both `Pool` and `Worker`

#### 2.0.0

- Change exports signature
- Add `RangeWorker#setActive`
- Remove `RangeWorker#activate`
- Add `RangeWorker#getCompleted`
- Rename `PoolWorker` to `RangeWorker`
- Add `RangePool#getCompletionPercentage`
- Ban `Infinity` in `RangeWorker` bounds
- Validate `steps` value in `RangeWorker#advance`
- Rename from `getIndexLimit` to `getLimitIndex` on Worker
- Remove `RangePool#getWorkingWorker` and `RangePool#hasWorkingWorker` in favor of `RangePool#hasAliveWorker`
- Change signature of `RangePool#serialize` and `RangePool.unserialize`

#### 1.1.1

- Add `getWorkingWorker` to RangePool

#### 1.1.0

- Add serialize/unserialize to pool

#### 1.0.2

- Workers who die with unfished work are now re-used so the pool no longer gets worker holes

#### 1.0.1

- Fix handling of odd lengths

#### 1.0.0

- A magic happened
