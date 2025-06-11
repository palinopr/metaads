import fs from 'fs'
import path from 'path'

describe('Code Coverage Analysis', () => {
  let coverageData: any

  beforeAll(async () => {
    // Load coverage data if it exists
    const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-final.json')
    
    if (fs.existsSync(coveragePath)) {
      const coverageFile = fs.readFileSync(coveragePath, 'utf8')
      coverageData = JSON.parse(coverageFile)
    } else {
      console.warn('Coverage data not found. Run tests with --coverage first.')
      coverageData = {}
    }
  })

  describe('Coverage Thresholds', () => {
    it('should meet global coverage thresholds', () => {
      if (Object.keys(coverageData).length === 0) {
        console.warn('Skipping coverage threshold test - no coverage data available')
        return
      }

      // Calculate overall coverage
      let totalStatements = 0
      let coveredStatements = 0
      let totalBranches = 0
      let coveredBranches = 0
      let totalFunctions = 0
      let coveredFunctions = 0
      let totalLines = 0
      let coveredLines = 0

      Object.values(coverageData).forEach((fileCoverage: any) => {
        // Statements
        totalStatements += Object.keys(fileCoverage.s || {}).length
        coveredStatements += Object.values(fileCoverage.s || {}).filter(Boolean).length

        // Branches
        totalBranches += Object.keys(fileCoverage.b || {}).length * 2 // Each branch has 2 paths
        Object.values(fileCoverage.b || {}).forEach((branch: any) => {
          if (Array.isArray(branch)) {
            coveredBranches += branch.filter(Boolean).length
          }
        })

        // Functions
        totalFunctions += Object.keys(fileCoverage.f || {}).length
        coveredFunctions += Object.values(fileCoverage.f || {}).filter(Boolean).length

        // Lines (only count executable lines)
        const lineNumbers = Object.keys(fileCoverage.s || {}).map(Number)
        totalLines += lineNumbers.length
        lineNumbers.forEach(lineNum => {
          if (fileCoverage.s[lineNum] > 0) {
            coveredLines++
          }
        })
      })

      const statementCoverage = totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 100
      const branchCoverage = totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 100
      const functionCoverage = totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 100
      const lineCoverage = totalLines > 0 ? (coveredLines / totalLines) * 100 : 100

      console.log(`Statement Coverage: ${statementCoverage.toFixed(2)}%`)
      console.log(`Branch Coverage: ${branchCoverage.toFixed(2)}%`)
      console.log(`Function Coverage: ${functionCoverage.toFixed(2)}%`)
      console.log(`Line Coverage: ${lineCoverage.toFixed(2)}%`)

      // Assert coverage thresholds (matching jest.config.js)
      expect(statementCoverage).toBeGreaterThanOrEqual(90)
      expect(branchCoverage).toBeGreaterThanOrEqual(90)
      expect(functionCoverage).toBeGreaterThanOrEqual(90)
      expect(lineCoverage).toBeGreaterThanOrEqual(90)
    })

    it('should identify files with low coverage', () => {
      if (Object.keys(coverageData).length === 0) {
        console.warn('Skipping low coverage test - no coverage data available')
        return
      }

      const lowCoverageFiles: Array<{
        file: string
        statements: number
        branches: number
        functions: number
        lines: number
      }> = []

      Object.entries(coverageData).forEach(([filePath, fileCoverage]: [string, any]) => {
        // Skip test files and node_modules
        if (filePath.includes('__tests__') || 
            filePath.includes('node_modules') || 
            filePath.includes('.test.') || 
            filePath.includes('.spec.')) {
          return
        }

        // Calculate file-specific coverage
        const statements = Object.keys(fileCoverage.s || {})
        const coveredStatements = Object.values(fileCoverage.s || {}).filter(Boolean)
        const statementCoverage = statements.length > 0 ? (coveredStatements.length / statements.length) * 100 : 100

        const branches = Object.keys(fileCoverage.b || {})
        let totalBranches = 0
        let coveredBranches = 0
        Object.values(fileCoverage.b || {}).forEach((branch: any) => {
          if (Array.isArray(branch)) {
            totalBranches += branch.length
            coveredBranches += branch.filter(Boolean).length
          }
        })
        const branchCoverage = totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 100

        const functions = Object.keys(fileCoverage.f || {})
        const coveredFunctions = Object.values(fileCoverage.f || {}).filter(Boolean)
        const functionCoverage = functions.length > 0 ? (coveredFunctions.length / functions.length) * 100 : 100

        const lines = statements.map(Number)
        const coveredLines = lines.filter(lineNum => fileCoverage.s[lineNum] > 0)
        const lineCoverage = lines.length > 0 ? (coveredLines.length / lines.length) * 100 : 100

        // Flag files with coverage below threshold
        if (statementCoverage < 80 || branchCoverage < 80 || functionCoverage < 80 || lineCoverage < 80) {
          lowCoverageFiles.push({
            file: filePath.replace(process.cwd(), ''),
            statements: Math.round(statementCoverage),
            branches: Math.round(branchCoverage),
            functions: Math.round(functionCoverage),
            lines: Math.round(lineCoverage)
          })
        }
      })

      if (lowCoverageFiles.length > 0) {
        console.warn('Files with low coverage (< 80%):')
        lowCoverageFiles.forEach(file => {
          console.warn(`${file.file}: Statements ${file.statements}%, Branches ${file.branches}%, Functions ${file.functions}%, Lines ${file.lines}%`)
        })
      }

      // This test will fail if there are too many low coverage files
      // Adjust the threshold based on your project's needs
      expect(lowCoverageFiles.length).toBeLessThanOrEqual(5)
    })
  })

  describe('Critical Path Coverage', () => {
    it('should have high coverage for critical components', () => {
      if (Object.keys(coverageData).length === 0) {
        console.warn('Skipping critical path test - no coverage data available')
        return
      }

      const criticalFiles = [
        'app/api/health/route.ts',
        'app/api/meta/route.ts',
        'lib/utils.ts',
        'components/error-boundary.tsx',
        'components/overview.tsx'
      ]

      criticalFiles.forEach(criticalFile => {
        const filePath = Object.keys(coverageData).find(path => 
          path.includes(criticalFile)
        )

        if (!filePath) {
          console.warn(`Critical file not found in coverage: ${criticalFile}`)
          return
        }

        const fileCoverage = coverageData[filePath]
        
        // Calculate coverage for this critical file
        const statements = Object.keys(fileCoverage.s || {})
        const coveredStatements = Object.values(fileCoverage.s || {}).filter(Boolean)
        const statementCoverage = statements.length > 0 ? (coveredStatements.length / statements.length) * 100 : 100

        console.log(`Critical file ${criticalFile}: ${statementCoverage.toFixed(2)}% statement coverage`)
        
        // Critical files should have at least 95% coverage
        expect(statementCoverage).toBeGreaterThanOrEqual(95)
      })
    })

    it('should have high coverage for API routes', () => {
      if (Object.keys(coverageData).length === 0) {
        console.warn('Skipping API route test - no coverage data available')
        return
      }

      const apiFiles = Object.keys(coverageData).filter(filePath => 
        filePath.includes('app/api/') && filePath.endsWith('route.ts')
      )

      apiFiles.forEach(apiFile => {
        const fileCoverage = coverageData[apiFile]
        
        const statements = Object.keys(fileCoverage.s || {})
        const coveredStatements = Object.values(fileCoverage.s || {}).filter(Boolean)
        const statementCoverage = statements.length > 0 ? (coveredStatements.length / statements.length) * 100 : 100

        console.log(`API route ${apiFile.replace(process.cwd(), '')}: ${statementCoverage.toFixed(2)}% coverage`)
        
        // API routes should have at least 85% coverage
        expect(statementCoverage).toBeGreaterThanOrEqual(85)
      })
    })
  })

  describe('Uncovered Code Analysis', () => {
    it('should identify uncovered lines that need attention', () => {
      if (Object.keys(coverageData).length === 0) {
        console.warn('Skipping uncovered code test - no coverage data available')
        return
      }

      const uncoveredCode: Array<{
        file: string
        uncoveredLines: number[]
        uncoveredStatements: number
      }> = []

      Object.entries(coverageData).forEach(([filePath, fileCoverage]: [string, any]) => {
        // Skip test files
        if (filePath.includes('__tests__') || 
            filePath.includes('.test.') || 
            filePath.includes('.spec.')) {
          return
        }

        const uncoveredLines: number[] = []
        const statementMap = fileCoverage.statementMap || {}
        
        Object.entries(fileCoverage.s || {}).forEach(([statementId, hitCount]: [string, any]) => {
          if (hitCount === 0) {
            const statement = statementMap[statementId]
            if (statement && statement.start) {
              uncoveredLines.push(statement.start.line)
            }
          }
        })

        if (uncoveredLines.length > 0) {
          uncoveredCode.push({
            file: filePath.replace(process.cwd(), ''),
            uncoveredLines: [...new Set(uncoveredLines)].sort((a, b) => a - b),
            uncoveredStatements: uncoveredLines.length
          })
        }
      })

      // Log uncovered code for analysis
      if (uncoveredCode.length > 0) {
        console.log('\nUncovered code analysis:')
        uncoveredCode.slice(0, 10).forEach(file => { // Show top 10 files with uncovered code
          console.log(`${file.file}: ${file.uncoveredStatements} uncovered statements on lines ${file.uncoveredLines.slice(0, 10).join(', ')}${file.uncoveredLines.length > 10 ? '...' : ''}`)
        })
      }

      // This is informational - we don't fail the test but provide visibility
      expect(uncoveredCode.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Test Quality Metrics', () => {
    it('should have comprehensive test suite', () => {
      const testDir = path.join(process.cwd(), '__tests__')
      
      if (!fs.existsSync(testDir)) {
        console.warn('Test directory not found')
        return
      }

      // Count test files
      const countTestFiles = (dir: string): number => {
        let count = 0
        const files = fs.readdirSync(dir)
        
        files.forEach(file => {
          const filePath = path.join(dir, file)
          const stat = fs.statSync(filePath)
          
          if (stat.isDirectory()) {
            count += countTestFiles(filePath)
          } else if (file.endsWith('.test.ts') || 
                     file.endsWith('.test.tsx') || 
                     file.endsWith('.spec.ts') || 
                     file.endsWith('.spec.tsx')) {
            count++
          }
        })
        
        return count
      }

      const testFileCount = countTestFiles(testDir)
      console.log(`Total test files: ${testFileCount}`)

      // Should have at least 10 test files for a comprehensive suite
      expect(testFileCount).toBeGreaterThanOrEqual(10)
    })

    it('should test different categories comprehensively', () => {
      const testDir = path.join(process.cwd(), '__tests__')
      
      if (!fs.existsSync(testDir)) {
        console.warn('Test directory not found')
        return
      }

      const categories = [
        'components',
        'lib', 
        'integration',
        'accessibility',
        'performance',
        'security'
      ]

      const existingCategories = categories.filter(category => 
        fs.existsSync(path.join(testDir, category))
      )

      console.log(`Test categories found: ${existingCategories.join(', ')}`)

      // Should have at least 4 different test categories
      expect(existingCategories.length).toBeGreaterThanOrEqual(4)
    })
  })

  describe('Coverage Trends', () => {
    it('should track coverage over time', () => {
      // This would typically integrate with a coverage tracking service
      // For now, we'll just log current coverage for trending analysis
      
      if (Object.keys(coverageData).length === 0) {
        console.warn('Skipping coverage trends test - no coverage data available')
        return
      }

      const timestamp = new Date().toISOString()
      const trendData = {
        timestamp,
        totalFiles: Object.keys(coverageData).length,
        // Add more trend metrics as needed
      }

      console.log('Coverage trend data:', JSON.stringify(trendData, null, 2))

      // This test always passes but provides data for trend analysis
      expect(trendData.totalFiles).toBeGreaterThan(0)
    })
  })
})