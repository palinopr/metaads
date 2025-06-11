// Advanced data compression and serialization utilities
import { z } from 'zod'

// Compression algorithms
export enum CompressionAlgorithm {
  NONE = 'none',
  LZ77 = 'lz77',
  HUFFMAN = 'huffman',
  RLE = 'rle', // Run-length encoding
  JSON_COMPACT = 'json_compact'
}

// Serialization formats
export enum SerializationFormat {
  JSON = 'json',
  MSGPACK = 'msgpack',
  PROTOBUF = 'protobuf',
  BINARY = 'binary'
}

export interface CompressionOptions {
  algorithm: CompressionAlgorithm
  level?: number // 1-9, where 9 is maximum compression
  threshold?: number // Minimum size in bytes to compress
}

export interface SerializationOptions {
  format: SerializationFormat
  compression?: CompressionOptions
  includeMetadata?: boolean
}

export interface CompressedData {
  data: string | ArrayBuffer
  algorithm: CompressionAlgorithm
  originalSize: number
  compressedSize: number
  compressionRatio: number
  checksum?: string
  metadata?: Record<string, any>
}

export interface SerializedData {
  data: string | ArrayBuffer
  format: SerializationFormat
  compression?: CompressionOptions
  size: number
  timestamp: number
  version: string
  checksum: string
}

// LZ77 implementation for text compression
class LZ77Compressor {
  private readonly windowSize: number = 4096
  private readonly lookAheadSize: number = 18

  compress(input: string): string {
    const result: Array<[number, number, string]> = []
    let position = 0

    while (position < input.length) {
      const match = this.findLongestMatch(input, position)
      
      if (match.length > 2) {
        result.push([match.distance, match.length, ''])
        position += match.length
      } else {
        result.push([0, 0, input[position]])
        position++
      }
    }

    return JSON.stringify(result)
  }

  decompress(compressed: string): string {
    const tokens: Array<[number, number, string]> = JSON.parse(compressed)
    let result = ''

    for (const [distance, length, char] of tokens) {
      if (distance === 0 && length === 0) {
        result += char
      } else {
        const startPos = result.length - distance
        for (let i = 0; i < length; i++) {
          result += result[startPos + i]
        }
      }
    }

    return result
  }

  private findLongestMatch(input: string, position: number): {
    distance: number
    length: number
  } {
    const windowStart = Math.max(0, position - this.windowSize)
    const lookAheadEnd = Math.min(input.length, position + this.lookAheadSize)
    
    let bestDistance = 0
    let bestLength = 0

    for (let i = windowStart; i < position; i++) {
      let length = 0
      
      while (
        position + length < lookAheadEnd &&
        input[i + length] === input[position + length]
      ) {
        length++
      }

      if (length > bestLength) {
        bestDistance = position - i
        bestLength = length
      }
    }

    return { distance: bestDistance, length: bestLength }
  }
}

// Run-length encoding implementation
class RLECompressor {
  compress(input: string): string {
    const result: Array<[string, number]> = []
    let currentChar = input[0]
    let count = 1

    for (let i = 1; i < input.length; i++) {
      if (input[i] === currentChar) {
        count++
      } else {
        result.push([currentChar, count])
        currentChar = input[i]
        count = 1
      }
    }

    if (currentChar !== undefined) {
      result.push([currentChar, count])
    }

    return JSON.stringify(result)
  }

  decompress(compressed: string): string {
    const tokens: Array<[string, number]> = JSON.parse(compressed)
    return tokens.map(([char, count]) => char.repeat(count)).join('')
  }
}

// Huffman coding implementation
class HuffmanCompressor {
  private frequencies: Map<string, number> = new Map()
  private codes: Map<string, string> = new Map()

  compress(input: string): string {
    this.buildFrequencyTable(input)
    const tree = this.buildHuffmanTree()
    this.generateCodes(tree)
    
    const encoded = input.split('').map(char => this.codes.get(char) || '').join('')
    
    return JSON.stringify({
      encoded,
      codes: Object.fromEntries(this.codes)
    })
  }

  decompress(compressed: string): string {
    const { encoded, codes } = JSON.parse(compressed)
    const reverseMap = new Map(Object.entries(codes).map(([k, v]) => [v, k]))
    
    let result = ''
    let current = ''
    
    for (const bit of encoded) {
      current += bit
      if (reverseMap.has(current)) {
        result += reverseMap.get(current)
        current = ''
      }
    }
    
    return result
  }

  private buildFrequencyTable(input: string): void {
    this.frequencies.clear()
    for (const char of input) {
      this.frequencies.set(char, (this.frequencies.get(char) || 0) + 1)
    }
  }

  private buildHuffmanTree(): HuffmanNode {
    const nodes = Array.from(this.frequencies.entries())
      .map(([char, freq]) => new HuffmanNode(char, freq))
      .sort((a, b) => a.frequency - b.frequency)

    while (nodes.length > 1) {
      const left = nodes.shift()!
      const right = nodes.shift()!
      const parent = new HuffmanNode('', left.frequency + right.frequency, left, right)
      
      // Insert in sorted position
      let insertIndex = 0
      while (insertIndex < nodes.length && nodes[insertIndex].frequency < parent.frequency) {
        insertIndex++
      }
      nodes.splice(insertIndex, 0, parent)
    }

    return nodes[0]
  }

  private generateCodes(node: HuffmanNode, code = ''): void {
    if (node.isLeaf()) {
      this.codes.set(node.char, code || '0')
    } else {
      if (node.left) this.generateCodes(node.left, code + '0')
      if (node.right) this.generateCodes(node.right, code + '1')
    }
  }
}

class HuffmanNode {
  constructor(
    public char: string,
    public frequency: number,
    public left?: HuffmanNode,
    public right?: HuffmanNode
  ) {}

  isLeaf(): boolean {
    return !this.left && !this.right
  }
}

// JSON compaction utility
class JSONCompactor {
  compress(input: string): string {
    try {
      const data = JSON.parse(input)
      return this.compactObject(data)
    } catch {
      return input
    }
  }

  decompress(compressed: string): string {
    try {
      const data = this.expandObject(compressed)
      return JSON.stringify(data)
    } catch {
      return compressed
    }
  }

  private compactObject(obj: any): string {
    // Remove null values, compress common patterns
    const compacted = this.removeNulls(obj)
    return JSON.stringify(compacted)
  }

  private expandObject(compressed: string): any {
    return JSON.parse(compressed)
  }

  private removeNulls(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.removeNulls(item)).filter(item => item !== null)
    }
    
    if (obj && typeof obj === 'object') {
      const result: any = {}
      for (const [key, value] of Object.entries(obj)) {
        if (value !== null && value !== undefined) {
          result[key] = this.removeNulls(value)
        }
      }
      return result
    }
    
    return obj
  }
}

// Main compression manager
export class CompressionManager {
  private lz77 = new LZ77Compressor()
  private rle = new RLECompressor()
  private huffman = new HuffmanCompressor()
  private jsonCompactor = new JSONCompactor()

  async compress(
    data: any,
    options: CompressionOptions = { algorithm: CompressionAlgorithm.LZ77 }
  ): Promise<CompressedData> {
    const serialized = typeof data === 'string' ? data : JSON.stringify(data)
    const originalSize = new Blob([serialized]).size

    // Skip compression if data is too small
    if (options.threshold && originalSize < options.threshold) {
      return {
        data: serialized,
        algorithm: CompressionAlgorithm.NONE,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 1
      }
    }

    let compressed: string
    const startTime = performance.now()

    switch (options.algorithm) {
      case CompressionAlgorithm.LZ77:
        compressed = this.lz77.compress(serialized)
        break
      case CompressionAlgorithm.HUFFMAN:
        compressed = this.huffman.compress(serialized)
        break
      case CompressionAlgorithm.RLE:
        compressed = this.rle.compress(serialized)
        break
      case CompressionAlgorithm.JSON_COMPACT:
        compressed = this.jsonCompactor.compress(serialized)
        break
      case CompressionAlgorithm.NONE:
      default:
        compressed = serialized
        break
    }

    const compressedSize = new Blob([compressed]).size
    const compressionTime = performance.now() - startTime

    return {
      data: compressed,
      algorithm: options.algorithm,
      originalSize,
      compressedSize,
      compressionRatio: originalSize / compressedSize,
      checksum: await this.calculateChecksum(compressed),
      metadata: {
        compressionTime,
        timestamp: Date.now()
      }
    }
  }

  async decompress(compressedData: CompressedData): Promise<any> {
    const data = compressedData.data as string
    let decompressed: string

    switch (compressedData.algorithm) {
      case CompressionAlgorithm.LZ77:
        decompressed = this.lz77.decompress(data)
        break
      case CompressionAlgorithm.HUFFMAN:
        decompressed = this.huffman.decompress(data)
        break
      case CompressionAlgorithm.RLE:
        decompressed = this.rle.decompress(data)
        break
      case CompressionAlgorithm.JSON_COMPACT:
        decompressed = this.jsonCompactor.decompress(data)
        break
      case CompressionAlgorithm.NONE:
      default:
        decompressed = data
        break
    }

    // Verify checksum if provided
    if (compressedData.checksum) {
      const currentChecksum = await this.calculateChecksum(data)
      if (currentChecksum !== compressedData.checksum) {
        throw new Error('Checksum verification failed - data may be corrupted')
      }
    }

    try {
      return JSON.parse(decompressed)
    } catch {
      return decompressed
    }
  }

  // Calculate best compression algorithm for given data
  async findBestCompression(data: any): Promise<{
    algorithm: CompressionAlgorithm
    compressionRatio: number
    estimatedTime: number
  }> {
    const algorithms = [
      CompressionAlgorithm.LZ77,
      CompressionAlgorithm.HUFFMAN,
      CompressionAlgorithm.RLE,
      CompressionAlgorithm.JSON_COMPACT
    ]

    const results = await Promise.all(
      algorithms.map(async algorithm => {
        const startTime = performance.now()
        const compressed = await this.compress(data, { algorithm })
        const estimatedTime = performance.now() - startTime

        return {
          algorithm,
          compressionRatio: compressed.compressionRatio,
          estimatedTime
        }
      })
    )

    // Find best balance of compression ratio and speed
    return results.reduce((best, current) => {
      const currentScore = current.compressionRatio * 0.7 + (100 / current.estimatedTime) * 0.3
      const bestScore = best.compressionRatio * 0.7 + (100 / best.estimatedTime) * 0.3
      
      return currentScore > bestScore ? current : best
    })
  }

  private async calculateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }
}

// Serialization manager
export class SerializationManager {
  private compressionManager = new CompressionManager()

  async serialize(
    data: any,
    options: SerializationOptions = { format: SerializationFormat.JSON }
  ): Promise<SerializedData> {
    let serialized: string | ArrayBuffer

    switch (options.format) {
      case SerializationFormat.JSON:
        serialized = JSON.stringify(data)
        break
      case SerializationFormat.BINARY:
        serialized = this.serializeToBinary(data)
        break
      default:
        serialized = JSON.stringify(data)
        break
    }

    let finalData = serialized
    let compression: CompressionOptions | undefined

    if (options.compression) {
      const compressedResult = await this.compressionManager.compress(
        typeof serialized === 'string' ? serialized : new TextDecoder().decode(serialized),
        options.compression
      )
      finalData = compressedResult.data as string
      compression = options.compression
    }

    const size = typeof finalData === 'string' 
      ? new Blob([finalData]).size 
      : finalData.byteLength

    const checksum = await this.calculateChecksum(finalData)

    return {
      data: finalData,
      format: options.format,
      compression,
      size,
      timestamp: Date.now(),
      version: '1.0.0',
      checksum
    }
  }

  async deserialize<T = any>(serializedData: SerializedData): Promise<T> {
    let data = serializedData.data

    // Decompress if needed
    if (serializedData.compression) {
      const compressedData: CompressedData = {
        data: data as string,
        algorithm: serializedData.compression.algorithm,
        originalSize: 0,
        compressedSize: 0,
        compressionRatio: 0
      }
      data = await this.compressionManager.decompress(compressedData)
    }

    // Verify checksum
    const currentChecksum = await this.calculateChecksum(data)
    if (currentChecksum !== serializedData.checksum) {
      throw new Error('Serialized data checksum verification failed')
    }

    // Deserialize based on format
    switch (serializedData.format) {
      case SerializationFormat.JSON:
        return JSON.parse(data as string)
      case SerializationFormat.BINARY:
        return this.deserializeFromBinary(data as ArrayBuffer)
      default:
        return JSON.parse(data as string)
    }
  }

  private serializeToBinary(data: any): ArrayBuffer {
    const json = JSON.stringify(data)
    const encoder = new TextEncoder()
    return encoder.encode(json).buffer
  }

  private deserializeFromBinary(buffer: ArrayBuffer): any {
    const decoder = new TextDecoder()
    const json = decoder.decode(buffer)
    return JSON.parse(json)
  }

  private async calculateChecksum(data: string | ArrayBuffer): Promise<string> {
    const buffer = typeof data === 'string' 
      ? new TextEncoder().encode(data).buffer 
      : data

    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }
}

// Utility functions for common use cases
export const compressionUtils = {
  // Compress JSON data with automatic algorithm selection
  async compressJSON(data: any): Promise<CompressedData> {
    const manager = new CompressionManager()
    const best = await manager.findBestCompression(data)
    return manager.compress(data, { algorithm: best.algorithm })
  },

  // Decompress data
  async decompress(compressedData: CompressedData): Promise<any> {
    const manager = new CompressionManager()
    return manager.decompress(compressedData)
  },

  // Serialize with compression
  async serialize(
    data: any,
    compression: CompressionAlgorithm = CompressionAlgorithm.LZ77
  ): Promise<SerializedData> {
    const manager = new SerializationManager()
    return manager.serialize(data, {
      format: SerializationFormat.JSON,
      compression: { algorithm: compression }
    })
  },

  // Deserialize
  async deserialize<T = any>(serializedData: SerializedData): Promise<T> {
    const manager = new SerializationManager()
    return manager.deserialize<T>(serializedData)
  }
}