
const jwt = require('jsonwebtoken');


//Function to validate JWT
function validateJWT(token=null) {

    if(token==null) {
      return { 
        message: 'Access Token is Mandatory',
        code: 401
      };
    }
  
    else if(token!=null) {
      try {
        const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
        return { 
          message: 'Token Valid',
          code: 1,
          role: decoded.role
        };
      } catch (err) {
        return { 
          message: 'Access Token is Invalid or Expired',
          code: 401
        };
      }
    }
    
    else {
      return { 
        message: 'Token is Valid',
        code: 1,
        role: decoded.role
      };
    }
  
  }

  module.exports = {
    validateJWT
  }