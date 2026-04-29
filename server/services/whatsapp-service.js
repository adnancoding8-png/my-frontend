const axios = require('axios');
const Settings = require('../models/Settings');

/**
 * WhatsApp Notification Service
 * Handles sending WhatsApp messages for order confirmations
 */
class WhatsAppService {
  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL || 'https://api.whatsapp.com/send';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  }

  /**
   * Format phone number to E.164 format
   * @param {string} phoneNumber - Phone number to format
   * @returns {string} Formatted phone number
   */
  formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return '';
    
    // Remove all non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Remove any + that's not at the start
    cleaned = cleaned.replace(/\+/g, '');
    
    // Handle Pakistani numbers: +92 0... → remove the 0 after country code
    if (cleaned.startsWith('920')) {
      cleaned = '92' + cleaned.substring(3);
    }
    
    // If starts with 0 (local Pakistani format like 03187074919)
    if (cleaned.startsWith('0') && cleaned.length >= 10) {
      cleaned = '92' + cleaned.substring(1);
    }
    
    // Add + prefix
    cleaned = '+' + cleaned;
    
    // Validate E.164 format
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(cleaned) ? cleaned : '';
  }

  /**
   * Send order confirmation via WhatsApp
   * @param {Object} orderData - Order information
   * @returns {Promise<Object>} Response from WhatsApp API
   */
  async sendOrderConfirmation(orderData) {
    try {
      // Get WhatsApp settings from database
      const whatsappConfig = await Settings.getWhatsAppConfig();
      
      if (!whatsappConfig.enabled) {
        console.log('WhatsApp notifications are disabled');
        return { success: false, message: 'WhatsApp notifications disabled' };
      }

      // Get customer phone number
      const customerPhone = orderData.guestCustomer?.phoneNumber || orderData.userPhone;
      
      if (!customerPhone) {
        console.error('No phone number provided for WhatsApp notification');
        return { success: false, message: 'No phone number available' };
      }

      // Format phone number
      const formattedPhone = this.formatPhoneNumber(customerPhone);
      
      if (!formattedPhone) {
        console.error('Invalid phone number format:', customerPhone);
        return { success: false, message: 'Invalid phone number format' };
      }

      // Build order message
      const message = this.buildOrderMessage(orderData);

      // Send via WhatsApp API
      const response = await this.sendMessage(formattedPhone, message, whatsappConfig);

      return response;
    } catch (error) {
      console.error('Error sending WhatsApp notification:', error);
      return { 
        success: false, 
        message: error.message,
        error: error
      };
    }
  }

  /**
   * Build order confirmation message
   * @param {Object} orderData - Order information
   * @returns {string} Formatted message
   */
  buildOrderMessage(orderData) {
    const customerName = orderData.guestCustomer?.fullName || orderData.userName || 'Customer';
    const orderId = orderData._id?.toString().slice(-8) || 'N/A';
    const totalAmount = orderData.totalAmount || 0;
    const itemCount = orderData.orderItems?.length || 0;

    const message = `
🎉 *Order Confirmation*

Hello ${customerName}!

Thank you for your order! 

📦 *Order Details:*
• Order ID: #${orderId}
• Total Items: ${itemCount}
• Total Amount: PKR ${totalAmount.toFixed(2)}
• Order Date: ${new Date().toLocaleDateString()}

✅ Your order has been confirmed and will be processed shortly.

📞 We'll contact you soon with delivery updates.

Thank you for shopping with us! 🙏
    `.trim();

    return message;
  }

  /**
   * Send message via WhatsApp API
   * @param {string} phoneNumber - Recipient phone number (E.164 format)
   * @param {string} message - Message text
   * @param {Object} config - WhatsApp configuration with credentials
   * @returns {Promise<Object>} API response
   */
  async sendMessage(phoneNumber, message, config = {}) {
    try {
      // Use provided config or fall back to environment variables
      const phoneNumberId = config.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
      const accessToken = config.accessToken || process.env.WHATSAPP_ACCESS_TOKEN;
      
      if (!accessToken || !phoneNumberId) {
        console.warn('WhatsApp credentials not configured');
        // For development, just log the message
        console.log(`[WhatsApp Message to ${phoneNumber}]:\n${message}`);
        return { 
          success: true, 
          message: 'Message logged (no API configured)',
          isDevelopment: true
        };
      }

      // Check if using test credentials (development mode)
      if (accessToken.includes('test_') || phoneNumberId.includes('test_')) {
        console.log(`[WhatsApp Development Mode - Message to ${phoneNumber}]:\n${message}`);
        return {
          success: true,
          message: 'Message logged (development mode)',
          isDevelopment: true,
          phoneNumber: phoneNumber,
          timestamp: new Date()
        };
      }

      // Send via WhatsApp Business API
      const apiUrl = `https://graph.instagram.com/v18.0/${phoneNumberId}/messages`;
      
      const response = await axios.post(
        apiUrl,
        {
          messaging_product: 'whatsapp',
          to: phoneNumber,
          type: 'text',
          text: {
            body: message
          }
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`WhatsApp message sent successfully to ${phoneNumber}`);
      
      return {
        success: true,
        message: 'WhatsApp message sent successfully',
        phoneNumber: phoneNumber,
        timestamp: new Date(),
        messageId: response.data?.messages?.[0]?.id
      };
    } catch (error) {
      console.error('Error sending WhatsApp message:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.error?.message || error.message,
        error: error
      };
    }
  }

  /**
   * Send custom message
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} message - Message text
   * @returns {Promise<Object>} API response
   */
  async sendCustomMessage(phoneNumber, message) {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      if (!formattedPhone) {
        return { success: false, message: 'Invalid phone number format' };
      }

      return await this.sendMessage(formattedPhone, message);
    } catch (error) {
      console.error('Error sending custom WhatsApp message:', error);
      return {
        success: false,
        message: error.message,
        error: error
      };
    }
  }
}

module.exports = new WhatsAppService();
