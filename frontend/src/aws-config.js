// src/aws-config.js
// Values come from .env file (VITE_ prefix required for Vite)
// Copy .env.example → .env and fill in your values
const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID || "us-east-1_CmAd2k09E",
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || "78724kq2of1k85anep3bddtq97",
    },
  },
};

export default awsConfig;