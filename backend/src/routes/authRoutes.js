const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const OauthUsers = require('../models/OAuth');


// verify creds & generate access token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if(email!=='admin@nbm.com' || password!=='maniisadmin') {
      return res.status(401).json({message: 'Invalid Credentials'});
    }

    // Create JWT token for any credentials
    const token = jwt.sign(
      { 
        email: email,
        role: 'admin'
      },
      //env.JWT_SECRET,
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const refresh = jwt.sign(
      { 
        email: email,
        role: 'admin'
      },
      //env.JWT_SECRET,
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Return success response with token

    res.cookie('access_token',token,{
      httpOnly: true,
      sameSite: 'none',
      secure: true
    })
    
    res.json({
      success: true,
      message: 'Login successful',
      token: 'Active',
      //refresh: refresh,
      user: {
        email: email,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login'
    });
  }
});

//verify refresh token & create new access token
router.post('/regenerateAccessToken', (req, res) => {

  const { refreshToken } = req.body;

  if (!refreshToken) return res.status(401).json({ message: 'Missing token' });

  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });

    const newAccessToken = jwt.sign({ email: user.email, role: user.role }, 
    process.env.JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({ accessToken: newAccessToken });
  });

});

//Verify access token
router.post('/verifyAccessToken', (req, res) => {

  //const token = req.headers.authorization;
  const token = req.cookies.access_token;

  if (!token) return res.status(401).json({ message: 'Missing token' });

  //jwt.verify(token.split(' ')[1], process.env.JWT_SECRET, (err, user) => {
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {

    if (err) return res.status(401).json({ message: 'Invalid token' });

    //const newAccessToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.status(200).json({ message: 'Token is Valid' });
  });

});

router.post('/googleSignIn', async (req, res) => {
  try {
      const accessToken = String(req.body.access_token || '');
      if (!accessToken || accessToken.length > 4096) {
        return res.status(401).json({ message: 'Missing or invalid Google access token.' });
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      let googleResponse;
      try {
        googleResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeout);
      }

      if (!googleResponse.ok) {
        return res.status(401).json({ message: 'Invalid Google access token.' });
      }

      const googleUser = await googleResponse.json();
      const email = String(googleUser.email || '').trim().toLowerCase();
      const name = String(googleUser.name || '').trim().slice(0, 100);
      if (!email || email.length > 254 || googleUser.email_verified !== true) {
        return res.status(401).json({ message: 'Google account email is not verified.' });
      }

      const userDetails = {
        sub: String(googleUser.sub || '').slice(0, 255),
        email,
        name,
        picture: String(googleUser.picture || '').slice(0, 2048)
      };

      await OauthUsers.findOneAndUpdate(
        { email },
        {
            $set: {
              name: name || email,
              user_data: [{ user_details: userDetails }],
              updatedAt: Date.now()
            }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      const token = jwt.sign(
        {
          email,
          role: 'user'
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.cookie('access_token',token,{
        httpOnly: true,
        sameSite: 'none',
        secure: true
      })

      res.status(200).json({
        success: true,
        message: 'Login successful',
        token: 'Active',
        //refresh: refresh,
        user: {
          email,
          role: 'user',
          name: name || email
        }
      });
  } catch (error) {
      console.error('Google sign-in error:', error);
      res.status(500).json({ message: 'Could not complete Google sign-in.' });
  }
});


module.exports = router; 
