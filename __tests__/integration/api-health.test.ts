import { NextRequest } from 'next/server'
import { GET } from '@/app/api/health/route'

// Mock process methods
const mockMemoryUsage = jest.fn()
const mockUptime = jest.fn()
const mockGc = jest.fn()

beforeEach(() => {
  mockMemoryUsage.mockReturnValue({
    rss: 100 * 1024 * 1024, // 100MB
    heapTotal: 80 * 1024 * 1024, // 80MB
    heapUsed: 50 * 1024 * 1024, // 50MB
    external: 10 * 1024 * 1024, // 10MB
  })
  mockUptime.mockReturnValue(3600) // 1 hour
  
  Object.defineProperty(process, 'memoryUsage', {
    value: mockMemoryUsage,
    configurable: true,
  })
  
  Object.defineProperty(process, 'uptime', {
    value: mockUptime,
    configurable: true,
  })
  
  // Mock global.gc
  Object.defineProperty(global, 'gc', {
    value: mockGc,
    configurable: true,
  })
  
  jest.clearAllMocks()
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('/api/health', () => {
  it('should return healthy status with normal memory usage', async () => {
    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('healthy')
    expect(data.memory).toEqual({
      heapUsed: 50,
      heapTotal: 80,
      external: 10,
      rss: 100,
    })
    expect(data.uptime).toBe(3600)
    expect(data.timestamp).toBeDefined()
    expect(new Date(data.timestamp)).toBeInstanceOf(Date)
  })

  it('should return warning status with high memory usage', async () => {
    // Mock high memory usage
    mockMemoryUsage.mockReturnValue({
      rss: 600 * 1024 * 1024, // 600MB
      heapTotal: 550 * 1024 * 1024, // 550MB
      heapUsed: 520 * 1024 * 1024, // 520MB (above 500MB threshold)
      external: 30 * 1024 * 1024, // 30MB
    })

    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('warning')
    expect(data.memory.heapUsed).toBe(520)
  })

  it('should trigger garbage collection with high memory usage', async () => {
    // Mock high memory usage above 400MB threshold
    mockMemoryUsage.mockReturnValue({
      rss: 500 * 1024 * 1024,
      heapTotal: 450 * 1024 * 1024,
      heapUsed: 420 * 1024 * 1024, // Above 400MB gc threshold
      external: 20 * 1024 * 1024,
    })

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

    const request = new NextRequest('http://localhost:3000/api/health')
    await GET(request)

    expect(mockGc).toHaveBeenCalledTimes(1)
    expect(consoleSpy).toHaveBeenCalledWith('Running garbage collection...')
    
    consoleSpy.mockRestore()
  })

  it('should not trigger garbage collection when gc is not available', async () => {
    // Remove global.gc
    delete (global as any).gc

    mockMemoryUsage.mockReturnValue({
      rss: 500 * 1024 * 1024,
      heapTotal: 450 * 1024 * 1024,
      heapUsed: 420 * 1024 * 1024, // Above 400MB gc threshold
      external: 20 * 1024 * 1024,
    })

    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('healthy') // Should still be healthy since 420MB < 500MB warning threshold
  })

  it('should handle errors gracefully', async () => {
    // Mock process.memoryUsage to throw an error
    mockMemoryUsage.mockImplementation(() => {
      throw new Error('Memory usage error')
    })

    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.status).toBe('error')
    expect(data.error).toBe('Memory usage error')
  })

  it('should return proper memory units in MB', async () => {
    // Test with specific byte values
    mockMemoryUsage.mockReturnValue({
      rss: 104857600, // 100MB exactly
      heapTotal: 83886080, // 80MB exactly
      heapUsed: 52428800, // 50MB exactly
      external: 10485760, // 10MB exactly
    })

    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()

    expect(data.memory).toEqual({
      heapUsed: 50,
      heapTotal: 80,
      external: 10,
      rss: 100,
    })
  })

  it('should handle fractional MB values correctly', async () => {
    // Test with values that don't round to whole MBs
    mockMemoryUsage.mockReturnValue({
      rss: 104857600 + 524288, // 100.5MB
      heapTotal: 83886080 + 262144, // 80.25MB
      heapUsed: 52428800 + 786432, // 50.75MB
      external: 10485760 + 131072, // 10.125MB
    })

    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()

    // Math.round should handle the fractional parts
    expect(data.memory.rss).toBe(101) // 100.5 rounds to 101
    expect(data.memory.heapTotal).toBe(80) // 80.25 rounds to 80
    expect(data.memory.heapUsed).toBe(51) // 50.75 rounds to 51
    expect(data.memory.external).toBe(10) // 10.125 rounds to 10
  })
})