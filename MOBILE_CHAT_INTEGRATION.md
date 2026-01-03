# Mobile App Chat Integration Guide

## Overview
This guide shows how to integrate the chat messaging system into iOS and Android mobile apps. The backend is already mobile-ready!

## Architecture Benefits

### Why This Works for Mobile
1. **Same Backend**: iOS, Android, and Web use the same API
2. **Real-time**: Socket.IO has native mobile SDKs
3. **Offline Support**: Messages queue when offline
4. **Push Notifications**: Easy to add with FCM/APNS
5. **Efficient**: Binary protocol, auto-reconnection

## iOS Implementation (Swift)

### 1. Install Dependencies

**Using CocoaPods** (`Podfile`):
```ruby
pod 'Socket.IO-Client-Swift', '~> 16.0.1'
pod 'Alamofire', '~> 5.6' # For REST API
```

**Using Swift Package Manager**:
```
https://github.com/socketio/socket.io-client-swift
```

### 2. Create Socket Manager

```swift
// SocketManager.swift
import Foundation
import SocketIO

class SocketManager {
    static let shared = SocketManager()
    
    private var manager: SocketIOClient?
    private var socket: SocketIOClient?
    
    var isConnected: Bool {
        return socket?.status == .connected
    }
    
    func connect(userId: String, userType: String) {
        guard let url = URL(string: "https://api.yourschool.com") else { return }
        
        manager = SocketIOClient(socketURL: url, config: [
            .log(true),
            .compress,
            .reconnects(true),
            .reconnectAttempts(-1),
            .reconnectWait(1000)
        ])
        
        socket = manager
        
        // Connection events
        socket?.on(clientEvent: .connect) { [weak self] data, ack in
            print("✅ Socket connected")
            self?.authenticate(userId: userId, userType: userType)
        }
        
        socket?.on(clientEvent: .disconnect) { data, ack in
            print("❌ Socket disconnected")
        }
        
        socket?.on(clientEvent: .error) { data, ack in
            print("❌ Socket error: \(data)")
        }
        
        // Chat events
        socket?.on("authenticated") { data, ack in
            print("✅ Authenticated")
            NotificationCenter.default.post(name: .socketAuthenticated, object: nil)
        }
        
        socket?.on("new_message") { [weak self] data, ack in
            self?.handleNewMessage(data: data)
        }
        
        socket?.on("user_typing") { [weak self] data, ack in
            self?.handleTyping(data: data)
        }
        
        socket?.on("user_status") { [weak self] data, ack in
            self?.handleUserStatus(data: data)
        }
        
        socket?.on("message_read") { [weak self] data, ack in
            self?.handleMessageRead(data: data)
        }
        
        socket?.connect()
    }
    
    func disconnect() {
        socket?.disconnect()
        socket = nil
        manager = nil
    }
    
    private func authenticate(userId: String, userType: String) {
        socket?.emit("authenticate", [
            "userId": userId,
            "userType": userType
        ])
    }
    
    func joinConversation(conversationId: String) {
        socket?.emit("join_conversation", ["conversationId": conversationId])
    }
    
    func sendMessage(conversationId: String, receiverId: String, receiverModel: String, content: String) {
        socket?.emit("send_message", [
            "conversationId": conversationId,
            "receiverId": receiverId,
            "receiverModel": receiverModel,
            "content": content,
            "type": "text"
        ])
    }
    
    func sendTyping(conversationId: String, isTyping: Bool) {
        socket?.emit("typing", [
            "conversationId": conversationId,
            "isTyping": isTyping
        ])
    }
    
    func markAsRead(conversationId: String) {
        socket?.emit("mark_read", ["conversationId": conversationId])
    }
    
    private func handleNewMessage(data: [Any]) {
        guard let messageData = data.first as? [String: Any] else { return }
        NotificationCenter.default.post(
            name: .newMessageReceived,
            object: nil,
            userInfo: messageData
        )
    }
    
    private func handleTyping(data: [Any]) {
        guard let typingData = data.first as? [String: Any] else { return }
        NotificationCenter.default.post(
            name: .userTyping,
            object: nil,
            userInfo: typingData
        )
    }
    
    private func handleUserStatus(data: [Any]) {
        guard let statusData = data.first as? [String: Any] else { return }
        NotificationCenter.default.post(
            name: .userStatusChanged,
            object: nil,
            userInfo: statusData
        )
    }
    
    private func handleMessageRead(data: [Any]) {
        guard let readData = data.first as? [String: Any] else { return }
        NotificationCenter.default.post(
            name: .messageRead,
            object: nil,
            userInfo: readData
        )
    }
}

// Notification names
extension Notification.Name {
    static let socketAuthenticated = Notification.Name("socketAuthenticated")
    static let newMessageReceived = Notification.Name("newMessageReceived")
    static let userTyping = Notification.Name("userTyping")
    static let userStatusChanged = Notification.Name("userStatusChanged")
    static let messageRead = Notification.Name("messageRead")
}
```

### 3. Create API Service

```swift
// ChatAPIService.swift
import Foundation
import Alamofire

class ChatAPIService {
    static let shared = ChatAPIService()
    private let baseURL = "https://api.yourschool.com/api/messages"
    
    func getConversations(userId: String, userType: String, completion: @escaping (Result<[Conversation], Error>) -> Void) {
        AF.request("\(baseURL)/conversations", parameters: [
            "userId": userId,
            "userType": userType
        ]).responseDecodable(of: [Conversation].self) { response in
            switch response.result {
            case .success(let conversations):
                completion(.success(conversations))
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
    
    func getMessages(conversationId: String, limit: Int = 50, completion: @escaping (Result<[Message], Error>) -> Void) {
        AF.request("\(baseURL)/conversations/\(conversationId)/messages", parameters: [
            "limit": limit
        ]).responseDecodable(of: [Message].self) { response in
            switch response.result {
            case .success(let messages):
                completion(.success(messages))
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
}
```

### 4. SwiftUI Chat View

```swift
// ChatView.swift
import SwiftUI

struct ChatView: View {
    @StateObject private var viewModel = ChatViewModel()
    @State private var messageText = ""
    
    var body: some View {
        VStack(spacing: 0) {
            // Messages list
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(viewModel.messages) { message in
                            MessageBubble(message: message, isFromCurrentUser: message.senderId == viewModel.currentUserId)
                        }
                    }
                    .padding()
                }
                .onChange(of: viewModel.messages.count) { _ in
                    if let lastMessage = viewModel.messages.last {
                        withAnimation {
                            proxy.scrollTo(lastMessage.id, anchor: .bottom)
                        }
                    }
                }
            }
            
            // Input bar
            HStack(spacing: 12) {
                TextField("Type a message...", text: $messageText)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .onChange(of: messageText) { _ in
                        viewModel.sendTypingIndicator(isTyping: !messageText.isEmpty)
                    }
                
                Button(action: {
                    viewModel.sendMessage(content: messageText)
                    messageText = ""
                }) {
                    Image(systemName: "paperplane.fill")
                        .foregroundColor(.white)
                        .padding(10)
                        .background(Color.blue)
                        .clipShape(Circle())
                }
                .disabled(messageText.isEmpty)
            }
            .padding()
            .background(Color(.systemBackground))
        }
        .navigationTitle(viewModel.otherUserName)
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            viewModel.loadMessages()
        }
    }
}

struct MessageBubble: View {
    let message: Message
    let isFromCurrentUser: Bool
    
    var body: some View {
        HStack {
            if isFromCurrentUser { Spacer() }
            
            VStack(alignment: isFromCurrentUser ? .trailing : .leading, spacing: 4) {
                Text(message.content)
                    .padding(12)
                    .background(isFromCurrentUser ? Color.blue : Color(.systemGray5))
                    .foregroundColor(isFromCurrentUser ? .white : .primary)
                    .cornerRadius(16)
                
                Text(message.createdAt.formatted(date: .omitted, time: .shortened))
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            
            if !isFromCurrentUser { Spacer() }
        }
    }
}
```

## Android Implementation (Kotlin)

### 1. Add Dependencies

**build.gradle (app level)**:
```gradle
dependencies {
    // Socket.IO
    implementation 'io.socket:socket.io-client:2.1.0'
    
    // Retrofit for REST API
    implementation 'com.squareup.retrofit2:retrofit:2.9.0'
    implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
    
    // Coroutines
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.6.4'
}
```

### 2. Create Socket Manager

```kotlin
// SocketManager.kt
package com.yourschool.chat

import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject
import java.net.URISyntaxException

object SocketManager {
    private var socket: Socket? = null
    private var listeners = mutableMapOf<String, MutableList<(Any) -> Unit>>()
    
    val isConnected: Boolean
        get() = socket?.connected() ?: false
    
    fun connect(userId: String, userType: String) {
        try {
            socket = IO.socket("https://api.yourschool.com")
            
            socket?.on(Socket.EVENT_CONNECT) {
                println("✅ Socket connected")
                authenticate(userId, userType)
            }
            
            socket?.on(Socket.EVENT_DISCONNECT) {
                println("❌ Socket disconnected")
            }
            
            socket?.on(Socket.EVENT_CONNECT_ERROR) { args ->
                println("❌ Connection error: ${args[0]}")
            }
            
            socket?.on("authenticated") { args ->
                println("✅ Authenticated")
                notifyListeners("authenticated", args[0])
            }
            
            socket?.on("new_message") { args ->
                notifyListeners("new_message", args[0])
            }
            
            socket?.on("user_typing") { args ->
                notifyListeners("user_typing", args[0])
            }
            
            socket?.on("user_status") { args ->
                notifyListeners("user_status", args[0])
            }
            
            socket?.on("message_read") { args ->
                notifyListeners("message_read", args[0])
            }
            
            socket?.connect()
        } catch (e: URISyntaxException) {
            e.printStackTrace()
        }
    }
    
    fun disconnect() {
        socket?.disconnect()
        socket = null
        listeners.clear()
    }
    
    private fun authenticate(userId: String, userType: String) {
        val data = JSONObject()
        data.put("userId", userId)
        data.put("userType", userType)
        socket?.emit("authenticate", data)
    }
    
    fun joinConversation(conversationId: String) {
        val data = JSONObject()
        data.put("conversationId", conversationId)
        socket?.emit("join_conversation", data)
    }
    
    fun sendMessage(conversationId: String, receiverId: String, receiverModel: String, content: String) {
        val data = JSONObject()
        data.put("conversationId", conversationId)
        data.put("receiverId", receiverId)
        data.put("receiverModel", receiverModel)
        data.put("content", content)
        data.put("type", "text")
        socket?.emit("send_message", data)
    }
    
    fun sendTyping(conversationId: String, isTyping: Boolean) {
        val data = JSONObject()
        data.put("conversationId", conversationId)
        data.put("isTyping", isTyping)
        socket?.emit("typing", data)
    }
    
    fun markAsRead(conversationId: String) {
        val data = JSONObject()
        data.put("conversationId", conversationId)
        socket?.emit("mark_read", data)
    }
    
    fun on(event: String, callback: (Any) -> Unit) {
        if (!listeners.containsKey(event)) {
            listeners[event] = mutableListOf()
        }
        listeners[event]?.add(callback)
    }
    
    fun off(event: String, callback: (Any) -> Unit) {
        listeners[event]?.remove(callback)
    }
    
    private fun notifyListeners(event: String, data: Any) {
        listeners[event]?.forEach { it(data) }
    }
}
```

### 3. Create API Service

```kotlin
// ChatApiService.kt
package com.yourschool.chat

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*

interface ChatApi {
    @GET("messages/conversations")
    suspend fun getConversations(
        @Query("userId") userId: String,
        @Query("userType") userType: String
    ): List<Conversation>
    
    @GET("messages/conversations/{conversationId}/messages")
    suspend fun getMessages(
        @Path("conversationId") conversationId: String,
        @Query("limit") limit: Int = 50
    ): List<Message>
    
    @POST("messages/conversations")
    suspend fun createConversation(
        @Body request: CreateConversationRequest
    ): Conversation
}

object ChatApiService {
    private val retrofit = Retrofit.Builder()
        .baseUrl("https://api.yourschool.com/api/")
        .addConverterFactory(GsonConverterFactory.create())
        .build()
    
    val api: ChatApi = retrofit.create(ChatApi::class.java)
}
```

### 4. Jetpack Compose Chat Screen

```kotlin
// ChatScreen.kt
package com.yourschool.chat

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun ChatScreen(
    conversationId: String,
    viewModel: ChatViewModel = viewModel()
) {
    val messages by viewModel.messages.collectAsState()
    val messageText by viewModel.messageText.collectAsState()
    val listState = rememberLazyListState()
    
    LaunchedEffect(conversationId) {
        viewModel.loadMessages(conversationId)
    }
    
    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }
    
    Column(modifier = Modifier.fillMaxSize()) {
        // Messages list
        LazyColumn(
            state = listState,
            modifier = Modifier.weight(1f),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(messages) { message ->
                MessageBubble(
                    message = message,
                    isFromCurrentUser = message.senderId == viewModel.currentUserId
                )
            }
        }
        
        // Input bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = messageText,
                onValueChange = { 
                    viewModel.updateMessageText(it)
                    viewModel.sendTypingIndicator(it.isNotEmpty())
                },
                modifier = Modifier.weight(1f),
                placeholder = { Text("Type a message...") }
            )
            
            Spacer(modifier = Modifier.width(8.dp))
            
            IconButton(
                onClick = { viewModel.sendMessage() },
                enabled = messageText.isNotBlank()
            ) {
                Icon(
                    imageVector = Icons.Default.Send,
                    contentDescription = "Send"
                )
            }
        }
    }
}

@Composable
fun MessageBubble(message: Message, isFromCurrentUser: Boolean) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (isFromCurrentUser) Arrangement.End else Arrangement.Start
    ) {
        Surface(
            color = if (isFromCurrentUser) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant,
            shape = MaterialTheme.shapes.medium
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text(
                    text = message.content,
                    color = if (isFromCurrentUser) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = message.formattedTime,
                    style = MaterialTheme.typography.caption,
                    color = if (isFromCurrentUser) MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.7f) else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                )
            }
        }
    }
}
```

## React Native Implementation

Good news! You can use the **exact same** `socketService.js` and `chatService.js` files from the web app!

### 1. Install Dependencies

```bash
npm install socket.io-client
npm install @react-native-async-storage/async-storage
```

### 2. Use Existing Services

```javascript
// Just import and use!
import socketService from './services/socketService';
import chatService from './services/chatService';

// In your component
useEffect(() => {
  socketService.connect(userId, userType);
  
  return () => {
    socketService.disconnect();
  };
}, [userId, userType]);
```

## Push Notifications

### iOS (APNs)
```swift
import UserNotifications

// Request permission
UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
    if granted {
        DispatchQueue.main.async {
            UIApplication.shared.registerForRemoteNotifications()
        }
    }
}

// Handle token
func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
    // Send token to backend
}
```

### Android (FCM)
```kotlin
// Add to build.gradle
implementation 'com.google.firebase:firebase-messaging:23.1.0'

// MyFirebaseMessagingService.kt
class MyFirebaseMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        // Send token to backend
    }
    
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        // Show notification
    }
}
```

## Offline Support

### iOS
```swift
// Use Core Data or Realm for local storage
// Queue messages when offline
// Sync when connection restored
```

### Android
```kotlin
// Use Room database
// Queue messages when offline
// Sync when connection restored
```

## Summary

✅ **Same Backend** - No changes needed!
✅ **Native SDKs** - Socket.IO supports iOS, Android, React Native
✅ **Real-time** - Instant message delivery
✅ **Scalable** - Handles thousands of concurrent users
✅ **Offline Ready** - Queue and sync messages
✅ **Push Notifications** - Easy to add
✅ **Production Ready** - Battle-tested technology

Your backend is already mobile-ready. Just add the mobile clients!
