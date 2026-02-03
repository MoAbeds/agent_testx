import { 
  Client, 
  Environment
} from "@paypal/paypal-server-sdk";

const clientId = process.env.PAYPAL_CLIENT_ID || "";
const clientSecret = process.env.PAYPAL_CLIENT_SECRET || "";

const client = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: clientId,
    oAuthClientSecret: clientSecret,
  },
  timeout: 0,
  environment: process.env.PAYPAL_ENV === 'production' ? Environment.Production : Environment.Sandbox,
});

export default client;
