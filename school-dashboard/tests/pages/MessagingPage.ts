import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * MessagingPage object model for chat/messaging
 */
export class MessagingPage extends BasePage {
  readonly pageHeading: Locator;
  readonly conversationsList: Locator;
  readonly chatWindow: Locator;
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly attachButton: Locator;
  readonly emojiButton: Locator;
  readonly newChatButton: Locator;
  readonly searchInput: Locator;
  readonly typingIndicator: Locator;
  readonly onlineIndicator: Locator;
  readonly messageStatus: Locator;

  constructor(page: Page) {
    super(page);

    this.pageHeading = page.locator('h1, h2').filter({ hasText: /messages|chat/i });
    this.conversationsList = page.locator('[class*="conversation"], [class*="chat-list"]');
    this.chatWindow = page.locator('[class*="chat-window"], [class*="messages"]');
    this.messageInput = page.locator('[contenteditable="true"], textarea[class*="message"], input[class*="message"]').first();
    this.sendButton = page.getByRole('button').filter({ hasText: /send|→|➤/i });
    this.attachButton = page.getByRole('button').filter({ hasText: /attach|📎|clip/i });
    this.emojiButton = page.getByRole('button').filter({ hasText: /emoji|😀/i });
    this.newChatButton = page.getByRole('button').filter({ hasText: /new chat|new message|compose/i });
    this.searchInput = page.locator('input[placeholder*="search" i]');
    this.typingIndicator = page.locator('[class*="typing"], [class*="indicator"]').filter({ hasText: /typing|dots/i });
    this.onlineIndicator = page.locator('[class*="online"], [class*="status"][class*="active"]');
    this.messageStatus = page.locator('[class*="status"], [class*="receipt"]');
  }

  async goto() {
    await this.page.goto('/messaging');
    await this.waitForPageLoad();
    await expect(this.pageHeading).toBeVisible({ timeout: 10000 });
  }

  async verifyMessagingInterface() {
    await expect(this.conversationsList).toBeVisible();
    await expect(this.chatWindow).toBeVisible();
    await expect(this.messageInput).toBeVisible();
    await expect(this.sendButton).toBeVisible();
  }

  async selectConversation(contactName: string) {
    const conversation = this.conversationsList.locator('[class*="item"], [class*="contact"]').filter({ hasText: contactName });
    await conversation.click();
    await this.page.waitForTimeout(500);
  }

  async sendMessage(message: string) {
    await this.messageInput.fill(message);
    await this.sendButton.click();
    await this.page.waitForTimeout(500);
    // Verify message appears in chat
    await expect(this.chatWindow.getByText(message)).toBeVisible();
  }

  async verifyMessageReceived(message: string) {
    await expect(this.chatWindow.getByText(message)).toBeVisible({ timeout: 5000 });
  }

  async verifyMessageStatus(status: 'sent' | 'delivered' | 'read') {
    const statusElement = this.messageStatus.filter({ hasText: new RegExp(status, 'i') });
    await expect(statusElement.first()).toBeVisible({ timeout: 3000 });
  }

  async verifyTypingIndicator() {
    await expect(this.typingIndicator).toBeVisible({ timeout: 5000 });
  }

  async verifyOnlineStatus(contactName: string) {
    const contact = this.conversationsList.locator('[class*="item"], [class*="contact"]').filter({ hasText: contactName });
    await expect(contact.locator('[class*="online"], [class*="status"]')).toBeVisible();
  }

  async startNewChat(recipientName: string) {
    await this.newChatButton.click();
    await this.helpers.verifyModalVisible('New Chat|Compose Message|Select Contact');
    await this.page.locator('input[placeholder*="search" i], input[placeholder*="recipient" i]').fill(recipientName);
    await this.page.waitForTimeout(500);
    await this.page.locator('[role="option"], [class*="contact-item"]').filter({ hasText: recipientName }).first().click();
    await this.helpers.clickButton(/start chat|create|continue/i);
  }

  async attachFile(filePath: string) {
    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    await this.page.waitForTimeout(1000);
    await this.helpers.waitForToast('file uploaded|attachment added');
  }

  async verifyFileAttached(fileName: string) {
    await expect(this.chatWindow.locator('[class*="attachment"]').filter({ hasText: fileName })).toBeVisible();
  }

  async searchConversation(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500);
  }

  async openEmojiPicker() {
    await this.emojiButton.click();
    await expect(this.page.locator('[class*="emoji-picker"], [class*="emoji"]').first()).toBeVisible();
  }

  async selectEmoji(emoji: string) {
    await this.page.locator('[class*="emoji"]').filter({ hasText: emoji }).first().click();
  }

  async deleteLastMessage() {
    const lastMessage = this.chatWindow.locator('[class*="message"]').last();
    await lastMessage.locator('[class*="menu"], button').filter({ hasText: /⋮|more|delete/i }).click();
    await this.page.locator('button').filter({ hasText: /delete/i }).click();
    await this.helpers.clickButton(/confirm|yes/i);
  }

  async verifyMessageCount(minMessages: number) {
    const messages = this.chatWindow.locator('[class*="message"]');
    const count = await messages.count();
    expect(count).toBeGreaterThanOrEqual(minMessages);
  }

  async scrollToTop() {
    await this.chatWindow.evaluate((el: HTMLElement) => el.scrollTop = 0);
  }

  async scrollToBottom() {
    await this.chatWindow.evaluate((el: HTMLElement) => el.scrollTop = el.scrollHeight);
  }

  async verifyMessageTimestamp(message: string) {
    const messageElement = this.chatWindow.locator('[class*="message"]').filter({ hasText: message });
    await expect(messageElement.locator('[class*="time"], [class*="timestamp"]')).toBeVisible();
  }
}
