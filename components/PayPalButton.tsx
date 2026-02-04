'use client';

import { useEffect, useRef } from 'react';
import { loadScript } from "@paypal/paypal-js";

interface PayPalButtonProps {
  planId: string;
  userId: string;
  onSuccess: (data: any) => void;
  onError: (err: any) => void;
}

export default function PayPalButton({ planId, userId, onSuccess, onError }: PayPalButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let paypal: any;

    const initPayPal = async () => {
      try {
        paypal = await loadScript({ 
          clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
          vault: "true",
          intent: "subscription"
        });

        if (paypal && buttonRef.current) {
          paypal.Buttons({
            style: {
              shape: 'rect',
              color: 'gold',
              layout: 'vertical',
              label: 'subscribe'
            },
            createSubscription: (data: any, actions: any) => {
              return actions.subscription.create({
                plan_id: planId,
                custom_id: userId // CRITICAL: Link the payment to the user
              });
            },
            onApprove: (data: any, actions: any) => {
              onSuccess(data);
            },
            onError: (err: any) => {
              onError(err);
            }
          }).render(buttonRef.current);
        }
      } catch (error) {
        console.error("failed to load the PayPal JS SDK script", error);
      }
    };

    initPayPal();

    return () => {
      // Cleanup if necessary
    };
  }, [planId, onSuccess, onError]);

  return <div ref={buttonRef}></div>;
}
