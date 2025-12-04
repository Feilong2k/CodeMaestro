import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('Matrix Theme Integration', () => {
  // Test 1: Tailwind config should have matrix theme colors
  it('should have matrix theme colors in tailwind config', () => {
    const configPath = resolve(__dirname, '../../../tailwind.config.js')
    const configContent = readFileSync(configPath, 'utf-8')
    // Check for matrix color palette
    expect(configContent).toContain('matrix:')
    expect(configContent).toContain('black:')
    expect(configContent).toContain('green:')
    expect(configContent).toContain('grey:')
    // Check for matrix-glow shadow
    expect(configContent).toContain('matrix-glow')
  })

  // Test 2: TheHeader should use matrix theme classes
  it('should have TheHeader with matrix theme classes', () => {
    const headerPath = resolve(__dirname, '../../components/TheHeader.vue')
    const headerContent = readFileSync(headerPath, 'utf-8')
    // Check for matrix theme classes
    expect(headerContent).toContain('font-matrix-sans')
    expect(headerContent).toContain('shadow-matrix-glow')
    expect(headerContent).toContain('bg-bg-elevated')
    expect(headerContent).toContain('border-line-base')
  })

  // Test 3: MatrixBackground component should exist
  it('should have MatrixBackground.vue component', () => {
    const bgPath = resolve(__dirname, '../../components/MatrixBackground.vue')
    const bgContent = readFileSync(bgPath, 'utf-8')
    // Check that it's a Vue component
    expect(bgContent).toContain('<template>')
    expect(bgContent).toContain('matrix-bg-layer')
  })

  // Test 4: Global styles should include matrix theme variables
  it('should have global styles with matrix theme variables', () => {
    const stylePath = resolve(__dirname, '../../style.css')
    const styleContent = readFileSync(stylePath, 'utf-8')
    // Check for CSS variables
    expect(styleContent).toContain('--bg-base: #0C0F12')
    expect(styleContent).toContain('--accent-primary: #00E5FF')
    expect(styleContent).toContain('--font-sans')
    expect(styleContent).toContain('--font-mono')
  })
})
