// Import necessary libraries from whatsapp-web.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Create a new client instance with LocalAuth for session management (remembers login state)
const client = new Client({
    authStrategy: new LocalAuth()  // Uses local authentication to store session data
});

// Event: When QR code is generated for login, display it in the terminal
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });  // This will generate a QR code in the terminal for login
});

// Event: When the bot successfully logs in and is ready to use
client.on('ready', () => {
    console.log('Bot is ready!');
    
    // Log the bot's phone number (client's "wid.user" is the WhatsApp number)
    console.log(`Logged in as: ${client.info.wid.user}`);
});

// Event: When the bot is added to a group
client.on('group_join', async (notification) => {
    console.log(`Bot has been added to group: ${notification.chatId}`);
    
    // Get the chat details of the group
    const chat = await client.getChatById(notification.chatId);
    
    // Send a welcome message to the group once the bot is added
    chat.sendMessage('👋 Hello! I am your bot. Type !help to see what I can do.');
});

// Event: When the bot receives a message
client.on('message', async message => {
    const chat = await message.getChat();
    
    // Get the list of admins in the group
    const admins = (await chat.getParticipants()).filter(p => p.isAdmin).map(p => p.id._serialized);

    // Check if the sender is an admin
    const sender = message.from;

    // If the sender is an admin, check for special commands
    if (admins.includes(sender)) {
        // Command to close the chat (only admins can send messages)
        if (message.body.toLowerCase() === '!closechat') {
            await chat.setMessagesAdminsOnly(true);  // Close chat to non-admins
            message.reply('🔒 Chat is now closed. Only admins can send messages.');
        }
        // Command to open the chat (everyone can send messages)
        else if (message.body.toLowerCase() === '!openchat') {
            await chat.setMessagesAdminsOnly(false);  // Open chat to all members
            message.reply('✅ Chat is now open. Everyone can send messages.');
        }
    }

    // Anti-link feature: Only allow admins to send links
    if (!admins.includes(sender) && message.body.includes('http')) {
        // Delete the message if it contains a link and sender is not an admin
        await message.delete(true);
        message.reply('🚫 Links are only allowed from admins.');
    }
});

// Initialize the client (this starts the bot)
client.initialize();
