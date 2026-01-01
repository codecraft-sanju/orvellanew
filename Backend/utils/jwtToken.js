// Token generate karke cookie me store karne ka helper
const sendToken = (user, statusCode, res) => {
  const token = user.getJWTToken();

  // Cookie options
  const options = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, // Javascript se access nahi hoga (Security)
    secure: process.env.NODE_ENV === 'production', // HTTPS par chalega production me
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
  };

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    user,
    token,
  });
};

module.exports = sendToken;