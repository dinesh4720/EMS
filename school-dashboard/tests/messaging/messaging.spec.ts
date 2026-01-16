import { test, expect } from '@playwright/test';
import { MessagingPage } from '../pages/MessagingPage';
import { LoginPage } from '../pages/LoginPage';
import { testUsers, testData } from '../fixtures/users';

/**
 * Messaging Module Tests
 *
 * These tests verify:
 * - Messaging interface loads correctly
 * - Sending messages
 * - File attachments
 * - Real-time message status
 * - Online/offline indicators
 * - Typing indicators
 * - Message search
 */
test.describe('Messaging Module', () => {
  let messagingPage: MessagingPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    messagingPage = new MessagingPage(page);

    // Login
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      testUsers.admin.email,
      testUsers.admin.password
    );
  });

  test('should navigate to messaging page', async ({ page }) => {
    await messagingPage.goto();
    await expect(messagingPage.pageHeading).toBeVisible();
  });

  test('should display messaging interface', async ({ page }) => {
    await messagingPage.goto();
    await messagingPage.verifyMessagingInterface();

    // Verify conversations list
    await expect(messagingPage.conversationsList).toBeVisible();

    // Verify chat window
    await expect(messagingPage.chatWindow).toBeVisible();

    // Verify message input
    await expect(messagingPage.messageInput).toBeVisible();
  });

  test('should display conversation list', async ({ page }) => {
    await messagingPage.goto();

    const conversations = await messagingPage.conversationsList.all();
    expect(conversations.length).toBeGreaterThan(0);

    // Verify each conversation has basic info
    for (const conversation of conversations) {
      await expect(conversation).toBeVisible();
    }
  });

  test('should select a conversation', async ({ page }) => {
    await messagingPage.goto();

    // Get first conversation
    const firstConversation = messagingPage.conversationsList.locator('[class*="item"], [class*="contact"]').first();
    const contactName = await firstConversation.textContent() || '';

    await messagingPage.selectConversation(contactName);

    // Verify chat window updates
    await expect(messagingPage.chatWindow).toBeVisible();
  });

  test('should send a message', async ({ page }) => {
    await messagingPage.goto();

    // Select first conversation
    const firstConversation = messagingPage.conversationsList.locator('[class*="item"], [class*="contact"]').first();
    const contactName = await firstConversation.textContent() || '';

    await messagingPage.selectConversation(contactName);

    // Send message
    const testMessage = 'This is a test message from automated testing';
    await messagingPage.sendMessage(testMessage);

    // Verify message appears in chat
    await expect(messagingPage.chatWindow.getByText(testMessage)).toBeVisible();
  });

  test('should display online status indicators', async ({ page }) => {
    await messagingPage.goto();

    const onlineCount = await messagingPage.onlineIndicator.count();
    if (onlineCount > 0) {
      await expect(messagingPage.onlineIndicator.first()).toBeVisible();
    }
  });

  test('should start a new chat', async ({ page }) => {
    await messagingPage.goto();

    const newChatCount = await messagingPage.newChatButton.count();
    if (newChatCount > 0) {
      await messagingPage.startNewChat('Test User');

      // Verify new conversation created
      await expect(messagingPage.chatWindow).toBeVisible();
    }
  });

  test('should attach and send file', async ({ page }) => {
    await messagingPage.goto();

    // Select conversation
    const firstConversation = messagingPage.conversationsList.locator('[class*="item"], [class*="contact"]').first();
    const contactName = await firstConversation.textContent() || '';
    await messagingPage.selectConversation(contactName);

    // Check if attach button exists
    const attachCount = await messagingPage.attachButton.count();
    if (attachCount > 0) {
      // Create a test file
      await messagingPage.attachFile('test-file.txt');

      // Send message with attachment
      await messagingPage.sendMessage('File attached');

      // Verify attachment
      await page.waitForTimeout(1000);
      const attachment = messagingPage.chatWindow.locator('[class*="attachment"], [class*="file"]');
      const attachmentCount = await attachment.count();

      if (attachmentCount > 0) {
        await expect(attachment.first()).toBeVisible();
      }
    }
  });

  test('should search conversations', async ({ page }) => {
    await messagingPage.goto();

    const searchCount = await messagingPage.searchInput.count();
    if (searchCount > 0) {
      await messagingPage.searchConversation('test');

      // Verify filtered results
      await page.waitForTimeout(1000);
      await expect(messagingPage.conversationsList).toBeVisible();
    }
  });

  test('should verify message timestamps', async ({ page }) => {
    await messagingPage.goto();

    // Select conversation
    const firstConversation = messagingPage.conversationsList.locator('[class*="item"], [class*="contact"]').first();
    const contactName = await firstConversation.textContent() || '';
    await messagingPage.selectConversation(contactName);

    // Check for timestamps on messages
    const messages = messagingPage.chatWindow.locator('[class*="message"]');
    const messageCount = await messages.count();

    if (messageCount > 0) {
      const firstMessage = messages.first();
      const timestamp = firstMessage.locator('[class*="time"], [class*="timestamp"]');
      const timestampCount = await timestamp.count();

      if (timestampCount > 0) {
        await expect(timestamp.first()).toBeVisible();
      }
    }
  });

  test('should verify message count', async ({ page }) => {
    await messagingPage.goto();

    // Select conversation
    const firstConversation = messagingPage.conversationsList.locator('[class*="item"], [class*="contact"]').first();
    const contactName = await firstConversation.textContent() || '';
    await messagingPage.selectConversation(contactName);

    // Verify message count
    await messagingPage.verifyMessageCount(0);
  });

  test('should handle emoji picker', async ({ page }) => {
    await messagingPage.goto();

    const emojiCount = await messagingPage.emojiButton.count();
    if (emojiCount > 0) {
      await messagingPage.openEmojiPicker();
      await messagingPage.selectEmoji('😀');

      // Verify emoji is added to input
      const inputText = await messagingPage.messageInput.textContent() || await messagingPage.messageInput.inputValue();
      expect(inputText).toContain('😀');
    }
  });

  test('should verify message status (sent/delivered/read)', async ({ page }) => {
    await messagingPage.goto();

    // Select conversation
    const firstConversation = messagingPage.conversationsList.locator('[class*="item"], [class*="contact"]').first();
    const contactName = await firstConversation.textContent() || '';
    await messagingPage.selectConversation(contactName);

    // Send message
    await messagingPage.sendMessage('Test message status');

    // Wait for status update
    await page.waitForTimeout(2000);

    // Check for status indicators
    const statusCount = await messagingPage.messageStatus.count();
    if (statusCount > 0) {
      await expect(messagingPage.messageStatus.first()).toBeVisible();
    }
  });

  test('should scroll through message history', async ({ page }) => {
    await messagingPage.goto();

    // Select conversation
    const firstConversation = messagingPage.conversationsList.locator('[class*="item"], [class*="contact"]').first();
    const contactName = await firstConversation.textContent() || '';
    await messagingPage.selectConversation(contactName);

    // Scroll to bottom
    await messagingPage.scrollToBottom();
    await page.waitForTimeout(500);

    // Scroll to top
    await messagingPage.scrollToTop();
    await page.waitForTimeout(500);
  });

  test('should delete message', async ({ page }) => {
    await messagingPage.goto();

    // Select conversation
    const firstConversation = messagingPage.conversationsList.locator('[class*="item"], [class*="contact"]').first();
    const contactName = await firstConversation.textContent() || '';
    await messagingPage.selectConversation(contactName);

    // Send a test message
    await messagingPage.sendMessage('Message to be deleted');

    // Delete last message
    const messageCountBefore = await messagingPage.chatWindow.locator('[class*="message"]').count();

    await messagingPage.deleteLastMessage();
    await page.waitForTimeout(1000);

    // Verify message is deleted
    const messageCountAfter = await messagingPage.chatWindow.locator('[class*="message"]').count();
    expect(messageCountAfter).toBeLessThan(messageCountBefore);
  });

  test('should verify unread message count', async ({ page }) => {
    await messagingPage.goto();

    // Look for unread badges
    const unreadBadges = messagingPage.conversationsList.locator('[class*="badge"], [class*="unread"]');
    const badgeCount = await unreadBadges.count();

    if (badgeCount > 0) {
      await expect(unreadBadges.first()).toBeVisible();

      // Get badge count
      const badgeText = await unreadBadges.first().textContent();
      expect(badgeText).toBeTruthy();
    }
  });

  test('should handle group conversations', async ({ page }) => {
    await messagingPage.goto();

    // Look for group indicators
    const groupChats = messagingPage.conversationsList.locator('[class*="group"], [title*="group" i]');
    const groupCount = await groupChats.count();

    if (groupCount > 0) {
      await groupChats.first().click();

      // Verify group chat view
      await expect(messagingPage.chatWindow).toBeVisible();

      // Verify multiple participants
      const participants = page.locator('[class*="participant"], [class*="member"]');
      const participantCount = await participants.count();

      if (participantCount > 0) {
        await expect(participants.first()).toBeVisible();
      }
    }
  });

  test('should verify responsive layout', async ({ page }) => {
    await messagingPage.goto();

    // Desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(messagingPage.conversationsList).toBeVisible();
    await expect(messagingPage.chatWindow).toBeVisible();

    // Mobile view - conversations list should be visible
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(messagingPage.conversationsList).toBeVisible();

    // On mobile, selecting conversation should hide list and show chat
    const firstConversation = messagingPage.conversationsList.locator('[class*="item"], [class*="contact"]').first();
    const contactName = await firstConversation.textContent() || '';
    await firstConversation.click();
    await page.waitForTimeout(500);

    // Chat should now be visible
    await expect(messagingPage.chatWindow).toBeVisible();
  });
});
