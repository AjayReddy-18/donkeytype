import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ReactDOM from 'react-dom/client'

// Mock ReactDOM
vi.mock('react-dom/client', () => ({
  default: {
    createRoot: vi.fn(() => ({
      render: vi.fn(),
    })),
  },
}))

// Mock App component
vi.mock('../App', () => ({
  default: () => <div>App Component</div>,
}))

// Mock index.css - return an object with default
vi.mock('../index.css', () => ({
  default: {},
}))

describe('main.tsx', () => {
  let mockCreateRoot: ReturnType<typeof vi.fn>
  let mockRender: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockRender = vi.fn()
    mockCreateRoot = vi.fn(() => ({
      render: mockRender,
    }))
    ;(ReactDOM.createRoot as any) = mockCreateRoot

    // Mock getElementById
    const mockElement = document.createElement('div')
    mockElement.id = 'root'
    document.body.appendChild(mockElement)
    vi.spyOn(document, 'getElementById').mockReturnValue(mockElement)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('should create root and render App', async () => {
    // Dynamically import main to trigger the module execution
    await import('../main')

    expect(mockCreateRoot).toHaveBeenCalled()
    expect(mockRender).toHaveBeenCalled()
  })
})
