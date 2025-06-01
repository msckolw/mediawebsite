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
      sameSite: 'lax',
      secure: false
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

router.post('/googleSignIn', async (req,res) => {

  const { email, name } = req.body;
  const newUserData = {
      user_details: req.body
  };

  try {
      const userDoc = await OauthUsers.findOneAndUpdate(
        { email },
        { 
            $push: { name: name, user_data: newUserData }, 
            $set: { updatedAt: Date.now() } 
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      //console.log(await OauthUsers.find())

      const token = jwt.sign(
        { 
          email: email,
          role: 'user'
        },
        //env.JWT_SECRET,
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.cookie('access_token',token,{
        httpOnly: true,
        sameSite: 'lax',
        secure: false
      })

      res.status(200).json({
        success: true,
        message: 'Login successful',
        token: 'Active',
        //refresh: refresh,
        user: {
          email: email,
          role: 'user',
          name: name
        }
      });

      
  } catch (error) {
      res.status(400).json({error: error});
  }

})


module.exports = router; 