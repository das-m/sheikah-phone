import { beforeEach, describe, expect, it } from 'vitest'

import type { SensorEvent } from '@/game/sensors'

import { useSensorMode } from './useSensorMode'

const sensor = (id: string): SensorEvent => ({
  id,
  name: `Sensor ${id}`,
  description: '',
  commonLocations: '',
  status: 'available'
})

describe('useSensorMode', () => {
  beforeEach(() => {
    // module-level state: start every test from "nothing selected"
    const { selected, active, toggle } = useSensorMode()
    if (selected.value && active.value) toggle()
    selected.value = null
  })

  it('has nothing selected or active at first, and toggle does nothing', () => {
    const { selected, active, toggle } = useSensorMode()
    toggle()
    expect(selected.value).toBeNull()
    expect(active.value).toBeNull()
  })

  it('activates a sensor and keeps it selected while it is switched off and on', () => {
    const { selected, active, activate, toggle } = useSensorMode()
    const a = sensor('01')
    activate(a)
    expect(active.value).toEqual(a)
    toggle()
    expect(active.value).toBeNull()
    expect(selected.value).toEqual(a)
    toggle()
    expect(active.value).toEqual(a)
  })

  it('replaces the sensor and switches it on when another one is activated', () => {
    const { selected, active, activate, toggle } = useSensorMode()
    activate(sensor('01'))
    toggle()
    const b = sensor('02')
    activate(b)
    expect(selected.value).toEqual(b)
    expect(active.value).toEqual(b)
  })
})
