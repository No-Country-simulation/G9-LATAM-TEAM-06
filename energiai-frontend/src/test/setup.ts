import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(() => '[]'),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  },
  writable: true
})

vi.mock('lucide-react', () => {
  const createIcon = (name) => (props) => React.createElement('svg', { 'data-testid': name.toLowerCase().replace('2', ''), ...props })
  const icons = {
    Send: createIcon('send'),
    CheckCircle2: createIcon('check-circle'),
    AlertCircle: createIcon('alert-circle'),
    Zap: createIcon('zap'),
    DollarSign: createIcon('dollar-sign'),
    Lightbulb: createIcon('lightbulb'),
    AlertTriangle: createIcon('alert-triangle'),
    Settings: createIcon('settings'),
    ChevronDown: createIcon('chevron-down'),
    History: createIcon('history'),
    Trash2: createIcon('trash'),
    Calendar: createIcon('calendar'),
    Activity: createIcon('activity'),
    RefreshCw: createIcon('refresh'),
    LayoutDashboard: createIcon('dashboard'),
    BarChart2: createIcon('bar-chart'),
    Microscope: createIcon('microscope'),
    Home: createIcon('home'),
    ChevronLeft: createIcon('chevron-left'),
    ChevronRight: createIcon('chevron-right'),
    UserCheck: createIcon('user-check')
  }
  return icons
})