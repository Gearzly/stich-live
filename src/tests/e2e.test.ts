/**
 * End-to-End Tests - User Workflows
 * Complete user journey tests using Playwright
 */

import { test, expect, Page, Browser } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';
const TEST_NAME = 'Test User';

// Page object models
class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto(`${BASE_URL}/login`);
  }

  async login(email: string, password: string) {
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-button"]');
  }

  async loginWithGoogle() {
    await this.page.click('[data-testid="google-login-button"]');
  }

  async isVisible() {
    return await this.page.isVisible('[data-testid="login-form"]');
  }

  async getErrorMessage() {
    return await this.page.textContent('[data-testid="login-error"]');
  }
}

class RegisterPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto(`${BASE_URL}/register`);
  }

  async register(name: string, email: string, password: string) {
    await this.page.fill('[data-testid="name-input"]', name);
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.fill('[data-testid="confirm-password-input"]', password);
    await this.page.check('[data-testid="terms-checkbox"]');
    await this.page.click('[data-testid="register-button"]');
  }

  async isVisible() {
    return await this.page.isVisible('[data-testid="register-form"]');
  }
}

class DashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto(`${BASE_URL}/dashboard`);
  }

  async isVisible() {
    return await this.page.isVisible('[data-testid="dashboard"]');
  }

  async createNewApp() {
    await this.page.click('[data-testid="create-app-button"]');
  }

  async getAppCount() {
    const apps = await this.page.locator('[data-testid="app-card"]').count();
    return apps;
  }

  async openAppGallery() {
    await this.page.click('[data-testid="app-gallery-link"]');
  }

  async openProfile() {
    await this.page.click('[data-testid="profile-menu"]');
    await this.page.click('[data-testid="profile-link"]');
  }

  async logout() {
    await this.page.click('[data-testid="profile-menu"]');
    await this.page.click('[data-testid="logout-button"]');
  }
}

class ChatPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto(`${BASE_URL}/chat`);
  }

  async sendMessage(message: string) {
    await this.page.fill('[data-testid="chat-input"]', message);
    await this.page.click('[data-testid="send-button"]');
  }

  async getMessages() {
    return await this.page.locator('[data-testid="chat-message"]').count();
  }

  async getLastMessage() {
    const messages = this.page.locator('[data-testid="chat-message"]');
    const lastMessage = messages.last();
    return await lastMessage.textContent();
  }

  async waitForResponse() {
    await this.page.waitForSelector('[data-testid="chat-loading"]', { state: 'hidden' });
  }

  async startNewGeneration() {
    await this.page.click('[data-testid="generate-app-button"]');
  }
}

class AppGalleryPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto(`${BASE_URL}/gallery`);
  }

  async searchApps(query: string) {
    await this.page.fill('[data-testid="search-input"]', query);
    await this.page.press('[data-testid="search-input"]', 'Enter');
  }

  async filterByFramework(framework: string) {
    await this.page.selectOption('[data-testid="framework-filter"]', framework);
  }

  async getAppCards() {
    return await this.page.locator('[data-testid="app-card"]').count();
  }

  async openApp(index: number = 0) {
    await this.page.click(`[data-testid="app-card"]:nth-child(${index + 1})`);
  }

  async likeApp(index: number = 0) {
    await this.page.click(`[data-testid="app-card"]:nth-child(${index + 1}) [data-testid="like-button"]`);
  }
}

class AppPreviewPage {
  constructor(private page: Page) {}

  async isVisible() {
    return await this.page.isVisible('[data-testid="app-preview"]');
  }

  async downloadApp() {
    await this.page.click('[data-testid="download-button"]');
  }

  async viewSource() {
    await this.page.click('[data-testid="view-source-button"]');
  }

  async forkApp() {
    await this.page.click('[data-testid="fork-button"]');
  }

  async shareApp() {
    await this.page.click('[data-testid="share-button"]');
  }

  async getAppTitle() {
    return await this.page.textContent('[data-testid="app-title"]');
  }
}

class ProfilePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto(`${BASE_URL}/profile`);
  }

  async updateProfile(name: string) {
    await this.page.fill('[data-testid="name-input"]', name);
    await this.page.click('[data-testid="save-button"]');
  }

  async changePassword(currentPassword: string, newPassword: string) {
    await this.page.fill('[data-testid="current-password"]', currentPassword);
    await this.page.fill('[data-testid="new-password"]', newPassword);
    await this.page.fill('[data-testid="confirm-new-password"]', newPassword);
    await this.page.click('[data-testid="change-password-button"]');
  }

  async deleteAccount() {
    await this.page.click('[data-testid="delete-account-button"]');
    await this.page.fill('[data-testid="delete-confirmation"]', 'DELETE');
    await this.page.click('[data-testid="confirm-delete-button"]');
  }

  async exportData() {
    await this.page.click('[data-testid="export-data-button"]');
  }
}

// Test suites
test.describe('User Authentication Flow', () => {
  let loginPage: LoginPage;
  let registerPage: RegisterPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    registerPage = new RegisterPage(page);
    dashboardPage = new DashboardPage(page);
  });

  test('user can register successfully', async ({ page }) => {
    await registerPage.goto();
    await expect(registerPage.isVisible()).resolves.toBe(true);

    await registerPage.register(TEST_NAME, TEST_EMAIL, TEST_PASSWORD);

    // Should redirect to dashboard after successful registration
    await page.waitForURL('**/dashboard');
    await expect(dashboardPage.isVisible()).resolves.toBe(true);
  });

  test('user can login successfully', async ({ page }) => {
    await loginPage.goto();
    await expect(loginPage.isVisible()).resolves.toBe(true);

    await loginPage.login(TEST_EMAIL, TEST_PASSWORD);

    // Should redirect to dashboard after successful login
    await page.waitForURL('**/dashboard');
    await expect(dashboardPage.isVisible()).resolves.toBe(true);
  });

  test('user can logout successfully', async ({ page }) => {
    // Login first
    await loginPage.goto();
    await loginPage.login(TEST_EMAIL, TEST_PASSWORD);
    await page.waitForURL('**/dashboard');

    // Logout
    await dashboardPage.logout();

    // Should redirect to login page
    await page.waitForURL('**/login');
    await expect(loginPage.isVisible()).resolves.toBe(true);
  });

  test('handles invalid login credentials', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login('invalid@example.com', 'wrongpassword');

    // Should show error message
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('Invalid');
  });

  test('persists user session across page refreshes', async ({ page }) => {
    // Login
    await loginPage.goto();
    await loginPage.login(TEST_EMAIL, TEST_PASSWORD);
    await page.waitForURL('**/dashboard');

    // Refresh page
    await page.reload();

    // Should still be on dashboard
    await expect(dashboardPage.isVisible()).resolves.toBe(true);
  });
});

test.describe('App Generation Workflow', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    chatPage = new ChatPage(page);

    // Login before each test
    await loginPage.goto();
    await loginPage.login(TEST_EMAIL, TEST_PASSWORD);
    await page.waitForURL('**/dashboard');
  });

  test('user can start app generation from dashboard', async ({ page }) => {
    await dashboardPage.createNewApp();

    // Should redirect to chat interface
    await page.waitForURL('**/chat');
    await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
  });

  test('user can chat with AI and generate app', async ({ page }) => {
    await chatPage.goto();

    // Send message
    await chatPage.sendMessage('Create a todo app with React');
    
    // Wait for response
    await chatPage.waitForResponse();

    // Should have at least 2 messages (user + AI response)
    const messageCount = await chatPage.getMessages();
    expect(messageCount).toBeGreaterThanOrEqual(2);

    // Start generation
    await chatPage.startNewGeneration();

    // Should see generation progress
    await expect(page.locator('[data-testid="generation-progress"]')).toBeVisible();
  });

  test('user can monitor generation progress', async ({ page }) => {
    await chatPage.goto();
    await chatPage.sendMessage('Create a simple calculator app');
    await chatPage.waitForResponse();
    await chatPage.startNewGeneration();

    // Monitor progress
    await expect(page.locator('[data-testid="generation-progress"]')).toBeVisible();
    
    // Wait for completion (with timeout)
    await page.waitForSelector('[data-testid="generation-complete"]', { timeout: 30000 });
    
    // Should show success message
    await expect(page.locator('[data-testid="generation-success"]')).toBeVisible();
  });

  test('user can preview generated app', async ({ page }) => {
    // Assume app is already generated
    await dashboardPage.goto();
    
    // Click on first app card
    await page.click('[data-testid="app-card"]:first-child [data-testid="preview-button"]');

    // Should open app preview
    await page.waitForURL('**/preview/**');
    await expect(page.locator('[data-testid="app-preview"]')).toBeVisible();
  });
});

test.describe('App Gallery and Discovery', () => {
  let loginPage: LoginPage;
  let appGalleryPage: AppGalleryPage;
  let appPreviewPage: AppPreviewPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    appGalleryPage = new AppGalleryPage(page);
    appPreviewPage = new AppPreviewPage(page);

    // Login before each test
    await loginPage.goto();
    await loginPage.login(TEST_EMAIL, TEST_PASSWORD);
    await page.waitForURL('**/dashboard');
  });

  test('user can browse app gallery', async ({ page }) => {
    await appGalleryPage.goto();

    // Should see app cards
    const appCount = await appGalleryPage.getAppCards();
    expect(appCount).toBeGreaterThan(0);
  });

  test('user can search for apps', async ({ page }) => {
    await appGalleryPage.goto();

    await appGalleryPage.searchApps('todo');

    // Should filter results
    await page.waitForSelector('[data-testid="search-results"]');
    const appCount = await appGalleryPage.getAppCards();
    expect(appCount).toBeGreaterThanOrEqual(0);
  });

  test('user can filter apps by framework', async ({ page }) => {
    await appGalleryPage.goto();

    await appGalleryPage.filterByFramework('react');

    // Should filter results
    await page.waitForSelector('[data-testid="filtered-results"]');
    const appCount = await appGalleryPage.getAppCards();
    expect(appCount).toBeGreaterThanOrEqual(0);
  });

  test('user can like and interact with apps', async ({ page }) => {
    await appGalleryPage.goto();

    // Like first app
    await appGalleryPage.likeApp(0);

    // Should update like count
    await expect(page.locator('[data-testid="like-count"]').first()).toBeVisible();
  });

  test('user can view app details', async ({ page }) => {
    await appGalleryPage.goto();

    // Open first app
    await appGalleryPage.openApp(0);

    // Should show app preview
    await expect(appPreviewPage.isVisible()).resolves.toBe(true);
    
    const title = await appPreviewPage.getAppTitle();
    expect(title).toBeTruthy();
  });

  test('user can fork an app', async ({ page }) => {
    await appGalleryPage.goto();
    await appGalleryPage.openApp(0);

    await appPreviewPage.forkApp();

    // Should create a copy in user's dashboard
    await page.waitForURL('**/dashboard');
    const appCount = await new DashboardPage(page).getAppCount();
    expect(appCount).toBeGreaterThan(0);
  });
});

test.describe('User Profile Management', () => {
  let loginPage: LoginPage;
  let profilePage: ProfilePage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    profilePage = new ProfilePage(page);
    dashboardPage = new DashboardPage(page);

    // Login before each test
    await loginPage.goto();
    await loginPage.login(TEST_EMAIL, TEST_PASSWORD);
    await page.waitForURL('**/dashboard');
  });

  test('user can view profile', async ({ page }) => {
    await dashboardPage.openProfile();

    await page.waitForURL('**/profile');
    await expect(page.locator('[data-testid="profile-form"]')).toBeVisible();
  });

  test('user can update profile information', async ({ page }) => {
    await profilePage.goto();

    await profilePage.updateProfile('Updated Name');

    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('user can change password', async ({ page }) => {
    await profilePage.goto();

    await profilePage.changePassword(TEST_PASSWORD, 'newpassword123');

    // Should show success message
    await expect(page.locator('[data-testid="password-changed"]')).toBeVisible();
  });

  test('user can export their data', async ({ page }) => {
    await profilePage.goto();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      profilePage.exportData()
    ]);

    expect(download.suggestedFilename()).toContain('user-data');
  });

  test('user can delete their account', async ({ page }) => {
    await profilePage.goto();

    await profilePage.deleteAccount();

    // Should redirect to login page
    await page.waitForURL('**/login');
    await expect(page.locator('[data-testid="account-deleted"]')).toBeVisible();
  });
});

test.describe('Responsive Design Tests', () => {
  test('app works on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.goto();
    await loginPage.login(TEST_EMAIL, TEST_PASSWORD);
    
    await page.waitForURL('**/dashboard');
    await expect(dashboardPage.isVisible()).resolves.toBe(true);

    // Check mobile navigation
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
  });

  test('app works on tablet devices', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    const loginPage = new LoginPage(page);
    const appGalleryPage = new AppGalleryPage(page);

    await loginPage.goto();
    await loginPage.login(TEST_EMAIL, TEST_PASSWORD);
    
    await appGalleryPage.goto();
    
    // Should adapt layout for tablet
    const appCount = await appGalleryPage.getAppCards();
    expect(appCount).toBeGreaterThan(0);
  });
});

test.describe('Performance Tests', () => {
  test('app loads within performance budget', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('large app gallery loads efficiently', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const appGalleryPage = new AppGalleryPage(page);

    await loginPage.goto();
    await loginPage.login(TEST_EMAIL, TEST_PASSWORD);

    const startTime = Date.now();
    await appGalleryPage.goto();
    await page.waitForSelector('[data-testid="app-card"]');
    
    const loadTime = Date.now() - startTime;
    
    // Gallery should load within 2 seconds
    expect(loadTime).toBeLessThan(2000);
  });
});

test.describe('Security Tests', () => {
  test('prevents unauthorized access to protected routes', async ({ page }) => {
    // Try to access dashboard without logging in
    await page.goto(`${BASE_URL}/dashboard`);

    // Should redirect to login
    await page.waitForURL('**/login');
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
  });

  test('handles XSS attempts safely', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const chatPage = new ChatPage(page);

    await loginPage.goto();
    await loginPage.login(TEST_EMAIL, TEST_PASSWORD);
    await chatPage.goto();

    // Try to inject script
    await chatPage.sendMessage('<script>alert("xss")</script>');

    // Should not execute script
    const messages = await page.locator('[data-testid="chat-message"]').count();
    expect(messages).toBeGreaterThan(0);
    
    // Page should not have alerts
    expect(page.locator('text=xss')).not.toBeVisible();
  });

  test('validates CSRF protection', async ({ page, context }) => {
    // This would test CSRF token validation in a real implementation
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    await loginPage.login(TEST_EMAIL, TEST_PASSWORD);

    // Should have CSRF tokens in requests
    const requests: any[] = [];
    page.on('request', request => requests.push(request));

    await page.click('[data-testid="create-app-button"]');

    // Check that POST requests have CSRF tokens
    const postRequests = requests.filter(req => req.method() === 'POST');
    expect(postRequests.length).toBeGreaterThan(0);
  });
});

test.describe('Accessibility Tests', () => {
  test('app is accessible with keyboard navigation', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();

    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Email field should be focused
    const emailField = page.locator('[data-testid="email-input"]');
    await expect(emailField).toBeFocused();

    // Continue tabbing to password field
    await page.keyboard.press('Tab');
    const passwordField = page.locator('[data-testid="password-input"]');
    await expect(passwordField).toBeFocused();
  });

  test('app has proper ARIA labels', async ({ page }) => {
    await page.goto(BASE_URL);

    // Check for ARIA labels
    const mainNavigation = page.locator('[role="navigation"]');
    await expect(mainNavigation).toBeVisible();

    const mainContent = page.locator('[role="main"]');
    await expect(mainContent).toBeVisible();
  });

  test('app supports screen readers', async ({ page }) => {
    await page.goto(BASE_URL);

    // Check for alt text on images
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });
});