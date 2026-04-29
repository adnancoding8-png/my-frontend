const mongoose = require('mongoose');
const Settings = require('../models/Settings');
require('dotenv').config();

async function initWhatsAppSettings() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Set WhatsApp settings
    await Settings.setSetting('whatsapp_enabled', true);
    await Settings.setSetting('whatsapp_number', '+923187074919'); // Test Pakistani number
    await Settings.setSetting('whatsapp_message', 'Hello! Thank you for your order. We will contact you soon with delivery updates.');
    await Settings.setSetting('whatsapp_phone_number_id', 'test_phone_id_123'); // Test Phone Number ID
    await Settings.setSetting('whatsapp_access_token', 'test_access_token_123'); // Test Access Token

    console.log('✅ WhatsApp settings initialized successfully');
    console.log('Settings:');
    console.log('- Enabled: true');
    console.log('- Phone Number: +923187074919');
    console.log('- Phone Number ID: test_phone_id_123');
    console.log('- Access Token: test_access_token_123');

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error initializing WhatsApp settings:', error);
    process.exit(1);
  }
}

initWhatsAppSettings();
