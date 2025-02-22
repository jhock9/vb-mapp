const router = require('express').Router();
const url = require('url');
const logger = require('../config/winston');
const Token = require('../models/tokenModel');
const { oauth2Client } = require('../config/googleClient');
const updatePhotoData = require('../controllers/photoUpdateController'); // updatePhotoData(oauth2Client)

// Generate the URL that will be used for the consent dialog
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline', // Gets refresh token
  scope: 'https://www.googleapis.com/auth/photoslibrary.readonly',
  include_granted_scopes: true,
  response_type: 'code',
});
logger.info('OAuth2 client AUTH URL generated...');

// Redirect to Google's OAuth 2.0 server
router.get('/authorize', (req, res) => {
  logger.info('Received request for /authorize...');
  res.redirect(authUrl);
  logger.info("Redirected to Google's OAuth 2.0 server...");
  // This response will be sent back to the specified redirect URL 
  // with endpoint /oauth2callback
});

// Exchange authorization code for access and refresh tokens
router.get('/oauth2callback', async (req, res) => {
  logger.info('Received request for /oauth2callback...');
  try {
    logger.info('Received request for /oauth2callback...');
    const q = url.parse(req.url, true).query;
    logger.info('Query parameters parsed...');
    
    if (q.error) {
      logger.error(`Error in query parameters: ${q.error}`);
      res.status(400).send('Authentication failed');
      return;
    }
    // Get access and refresh tokens
    logger.info('Attempting to get tokens with code...');
    
    const { tokens } = await oauth2Client.getToken(q.code);
    logger.info('Tokens received...');
    
    // Save the refresh token and expiry time to your database
    if (tokens.refresh_token) {
      logger.info('Refresh token received...');
      if (!isNaN(tokens.expiry_date)) {
        const expiryDate = new Date().getTime() + (Number(tokens.expiry_date) * 1000);
        await Token.findOneAndUpdate({}, { accessToken: tokens.access_token, refreshToken: tokens.refresh_token, expiryDate: expiryDate, isGoogleAuthenticated: true }, { upsert: true, new: true });
        logger.info('Token document updated...');
      } else {
        logger.error(`Invalid expiry_date value: ${tokens.expiry_date}`);
        res.status(500).send('Invalid expiry_date value');
        return;
      }
    }
    
    oauth2Client.setCredentials(tokens);
    logger.info('Tokens set in OAuth2 client.');
    console.log(`Access token fetched at: ${new Date().toISOString()}`);
    console.log(`Access token expiry date: ${tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : 'Unknown'}`);    
    // Update photo data after tokens have been set
    try {
      await updatePhotoData(oauth2Client);
      logger.info('Photo data updated.');
    } catch (error) {
      logger.error(`Failed to update photo data: ${error}`);
    }
    
    res.redirect('/dashboard');
  } catch (error) {
    logger.error(`ERROR in /oauth2callback: ${error}`);
    res.status(500).send(`Something went wrong! Error: ${error.message}`);
  }
});

// Check if admin has authenticated with database
router.get('/google-check', async (req, res) => {
  logger.info('Received request for /google-check...');
  try {
    const tokenDoc = await Token.findOne({});
    if (tokenDoc) {
      // Check if the access token is about to expire
      const isAboutToExpire = Date.now() > tokenDoc.expiryDate - 60000; // 1 minute buffer
      if (!isAboutToExpire) {      
        logger.info('Access token is valid.');
        res.json({ isGoogleAuthenticated: tokenDoc.isGoogleAuthenticated });
      } else {
        logger.info('Access token is about to expire.');
        // The access token is about to expire, so get a new one using the refresh token
        const { tokens } = await oauth2Client.refreshToken(tokenDoc.refreshToken);
        // Save the new access token and expiry time to the database
        const expiryDate = new Date().getTime() + (Number(tokens.expiry_date) * 1000);
        await Token.findOneAndUpdate({}, { accessToken: tokens.access_token, expiryDate });
        // Fetch the updated document from the database
        const updatedTokenDoc = await Token.findOne({});
        res.json({ isGoogleAuthenticated: updatedTokenDoc.isGoogleAuthenticated });
      }
    } else {
      logger.info('No token document found.');
      res.json({ isGoogleAuthenticated: false });
    }
  } catch (error) {
    if (error.message === 'invalid_grant') {
      logger.error('Refresh token is invalid or expired. User needs to re-authenticate.');
      res.status(401).send('Please re-authenticate with Google.');
    } else {
      logger.error(`Error checking Google authentication: ${error}`);
      res.status(500).send(`Something went wrong! Error: ${error.message}`);
    }
}});

// Export to server.js
module.exports = router;
