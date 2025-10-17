const axios = require('axios');

const sendSms = async (req, res) => {
  try {
    // Extract data from request body
    console.log("data message",req.body)
    
    const { phoneNumber, message } = req.body;
    
  
  
    const apiKey = `UcsnzGQ3lM7hVg8v`;
    const senderId = `JLFSPL`;
    // const senderId = `TXTSPD`;
    // const template = `1707161518728583364`;
    const template = `1707175507636589743`;
 
  
    console.log('SMS Request:', {
      phoneNumber,
      message,
      // center_id,
      template,
      apiKey,
      senderId
    });
    
    // Construct the SMS API URL
    const url = `https://sms.textspeed.in/vb/apikey.php?apikey=${apiKey}&senderid=${senderId}&templateid=${template}&number=${phoneNumber}&message=${encodeURIComponent(message)}`;
    
    // Send the SMS
    const response = await axios.get(url);
    
    console.log('SMS API Response:', response.data);
    
    // Return the response
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('SMS sending error:', error);
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send SMS',
      message: error.message
    });
  }
};


module.exports = { sendSms };