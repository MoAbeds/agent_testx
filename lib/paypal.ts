import { 
  Client, 
  Environment, 
  LogLevel,
  OrdersController,
  SubscriptionsController
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
  logging: {
    level: LogLevel.Info,
    logApiRequests: true,
    logApiResponseLevel: LogLevel.Info,
  },
});

export const ordersController = new OrdersController(client);
export const subscriptionsController = new SubscriptionsController(client);
export default client;
