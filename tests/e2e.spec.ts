import { test, expect } from '@playwright/test'

test('index page loads correctly', async ({ page }) => {
  // Set up console error listener
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })

  await page.goto('http://localhost:3000')

  // Wait for the page to load
  await page.waitForLoadState('networkidle')

  // Check title
  await expect(page).toHaveTitle('游戏现场记分器')

  // Verify key elements are present
  const header = page.locator('h1')
  await expect(header).toContainText('游戏记分器')

  // Check for any console errors (filter out non-critical)
  const criticalErrors = errors.filter(e =>
    !e.includes('favicon') &&
    !e.includes('Warning:')
  )

  if (criticalErrors.length > 0) {
    console.log('Console errors:', criticalErrors)
  }
})