const axios = require('axios');

const sendSms = async (req, res) => {
  try {
    // Extract data from request body
    console.log("data message", req.body)

    const { phoneNumber, message } = req.body;

    // Format phone number - remove '91' prefix if present
    // The SMS API expects a 10-digit number without country code
    let formattedPhoneNumber = phoneNumber;
    if (phoneNumber) {
      // Remove any spaces, dashes, or plus signs
      formattedPhoneNumber = phoneNumber.toString().replace(/[\s\-\+]/g, '');

      // If the number starts with '91' and is longer than 10 digits, remove the '91' prefix
      if (formattedPhoneNumber.startsWith('91') && formattedPhoneNumber.length > 10) {
        formattedPhoneNumber = formattedPhoneNumber.substring(2);
      }
      // If the number starts with '0', remove it
      if (formattedPhoneNumber.startsWith('0') && formattedPhoneNumber.length > 10) {
        formattedPhoneNumber = formattedPhoneNumber.substring(1);
      }
    }

    console.log('Original phone number:', phoneNumber);
    console.log('Formatted phone number:', formattedPhoneNumber);

    // const apiKey = `UcsnzGQ3lM7hVg8v`;
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
    const url = `https://sms.textspeed.in/vb/apikey.php?apikey=${apiKey}&senderid=${senderId}&templateid=${template}&number=${formattedPhoneNumber}&message=${encodeURIComponent(message)}`;

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
