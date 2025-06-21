import Stripe from "stripe";
import { prisma } from "./prisma";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export interface CreateEscrowParams {
  userId: string;
  amount: number;
  description: string;
  metadata?: Record<string, string>;
}

export interface EscrowPaymentResult {
  success: boolean;
  paymentIntentId?: string;
  clientSecret?: string;
  error?: string;
}

export class StripeEscrowManager {
  
  /**
   * Create a Stripe customer for a user if they don't have one
   */
  async ensureStripeCustomer(userId: string, email: string, name?: string): Promise<string> {
    // Check if user already has a Stripe customer ID
    const wallet = await prisma.userWallet.findUnique({
      where: { userId },
    });

    if (wallet?.stripeCustomerId) {
      return wallet.stripeCustomerId;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email,
      name: name || undefined,
      metadata: {
        userId,
      },
    });

    // Update or create wallet with Stripe customer ID
    await prisma.userWallet.upsert({
      where: { userId },
      update: { stripeCustomerId: customer.id },
      create: {
        userId,
        stripeCustomerId: customer.id,
      },
    });

    return customer.id;
  }

  /**
   * Create a payment intent for escrow funding
   */
  async createEscrowPaymentIntent({
    userId,
    amount,
    description,
    metadata = {},
  }: CreateEscrowParams): Promise<EscrowPaymentResult> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { wallet: true },
      });

      if (!user) {
        return { success: false, error: "User not found" };
      }

      // Ensure user has a Stripe customer
      const customerId = await this.ensureStripeCustomer(
        userId,
        user.email,
        user.name || undefined
      );

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        customer: customerId,
        description,
        metadata: {
          userId,
          type: "escrow_deposit",
          ...metadata,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret || undefined,
      };
    } catch (error) {
      console.error("Error creating escrow payment intent:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Create an escrow account for a wager
   */
  async createWagerEscrow(
    wagerId: string,
    creatorAmount: number,
    opponentAmount: number,
    creatorUserId: string,
    opponentUserId?: string
  ): Promise<{
    success: boolean;
    escrowId?: string;
    creatorPaymentIntent?: string;
    opponentPaymentIntent?: string;
    error?: string;
  }> {
    try {
      const totalAmount = creatorAmount + opponentAmount;

      // Create escrow account in database
      const escrow = await prisma.escrowAccount.create({
        data: {
          totalAmount,
          creatorAmount,
          opponentAmount,
          status: "ACTIVE",
        },
      });

      // Create payment intent for creator
      const creatorPayment = await this.createEscrowPaymentIntent({
        userId: creatorUserId,
        amount: creatorAmount,
        description: `Wager escrow deposit - ${wagerId}`,
        metadata: {
          wagerId,
          escrowId: escrow.id,
          side: "creator",
        },
      });

      if (!creatorPayment.success) {
        // Cleanup escrow account if payment intent creation failed
        await prisma.escrowAccount.delete({ where: { id: escrow.id } });
        return { success: false, error: creatorPayment.error };
      }

      let opponentPaymentIntentId: string | undefined;

      // Create payment intent for opponent if they exist
      if (opponentUserId && opponentAmount > 0) {
        const opponentPayment = await this.createEscrowPaymentIntent({
          userId: opponentUserId,
          amount: opponentAmount,
          description: `Wager escrow deposit - ${wagerId}`,
          metadata: {
            wagerId,
            escrowId: escrow.id,
            side: "opponent",
          },
        });

        if (!opponentPayment.success) {
          // Cleanup if opponent payment fails
          await prisma.escrowAccount.delete({ where: { id: escrow.id } });
          return { success: false, error: opponentPayment.error };
        }

        opponentPaymentIntentId = opponentPayment.paymentIntentId;
      }

      // Update escrow with payment intent ID
      await prisma.escrowAccount.update({
        where: { id: escrow.id },
        data: {
          stripePaymentIntentId: creatorPayment.paymentIntentId,
        },
      });

      return {
        success: true,
        escrowId: escrow.id,
        creatorPaymentIntent: creatorPayment.paymentIntentId,
        opponentPaymentIntent: opponentPaymentIntentId,
      };
    } catch (error) {
      console.error("Error creating wager escrow:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Release escrow funds to the winner
   */
  async releaseEscrow(
    escrowId: string,
    winnerId: string,
    reason: string = "Wager settled"
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const escrow = await prisma.escrowAccount.findUnique({
        where: { id: escrowId },
        include: {
          transactions: true,
        },
      });

      if (!escrow) {
        return { success: false, error: "Escrow account not found" };
      }

      if (escrow.status !== "ACTIVE") {
        return { success: false, error: "Escrow is not active" };
      }

      const winner = await prisma.user.findUnique({
        where: { id: winnerId },
        include: { wallet: true },
      });

      if (!winner) {
        return { success: false, error: "Winner not found" };
      }

      // Ensure winner has Stripe customer
      const customerId = await this.ensureStripeCustomer(
        winnerId,
        winner.email,
        winner.name || undefined
      );

      // Calculate total winnings
      const winnings = escrow.totalAmount;

      // Create transfer to winner's Stripe account or update their balance
      // For now, we'll update their wallet balance
      await prisma.$transaction(async (tx) => {
        // Update escrow status
        await tx.escrowAccount.update({
          where: { id: escrowId },
          data: {
            status: "RELEASED",
            releasedAt: new Date(),
            releasedToId: winnerId,
          },
        });

        // Update winner's wallet
        await tx.userWallet.upsert({
          where: { userId: winnerId },
          update: {
            balance: { increment: winnings },
            totalWon: { increment: winnings },
          },
          create: {
            userId: winnerId,
            balance: winnings,
            totalWon: winnings,
          },
        });

        // Create transaction record
        await tx.escrowTransaction.create({
          data: {
            escrowId,
            userId: winnerId,
            type: "ESCROW_RELEASE",
            amount: winnings,
            status: "COMPLETED",
            description: reason,
            processedAt: new Date(),
          },
        });
      });

      return { success: true };
    } catch (error) {
      console.error("Error releasing escrow:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Refund escrow funds to original payers
   */
  async refundEscrow(
    escrowId: string,
    reason: string = "Wager cancelled"
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const escrow = await prisma.escrowAccount.findUnique({
        where: { id: escrowId },
        include: {
          wager: {
            include: {
              creator: { include: { wallet: true } },
              opponent: { include: { wallet: true } },
            },
          },
          bounty: {
            include: {
              creator: { include: { wallet: true } },
              participants: {
                include: {
                  participant: { include: { wallet: true } },
                },
              },
            },
          },
        },
      });

      if (!escrow) {
        return { success: false, error: "Escrow account not found" };
      }

      if (escrow.status !== "ACTIVE") {
        return { success: false, error: "Escrow is not active" };
      }

      await prisma.$transaction(async (tx) => {
        // Update escrow status
        await tx.escrowAccount.update({
          where: { id: escrowId },
          data: {
            status: "REFUNDED",
            refundedAt: new Date(),
          },
        });

        // Refund wager participants
        if (escrow.wager) {
          const { creator, opponent } = escrow.wager;

          // Refund creator
          if (escrow.creatorAmount > 0) {
            await tx.userWallet.upsert({
              where: { userId: creator.id },
              update: {
                balance: { increment: escrow.creatorAmount },
              },
              create: {
                userId: creator.id,
                balance: escrow.creatorAmount,
              },
            });

            await tx.escrowTransaction.create({
              data: {
                escrowId,
                userId: creator.id,
                type: "REFUND",
                amount: escrow.creatorAmount,
                status: "COMPLETED",
                description: reason,
                processedAt: new Date(),
              },
            });
          }

          // Refund opponent
          if (opponent && escrow.opponentAmount > 0) {
            await tx.userWallet.upsert({
              where: { userId: opponent.id },
              update: {
                balance: { increment: escrow.opponentAmount },
              },
              create: {
                userId: opponent.id,
                balance: escrow.opponentAmount,
              },
            });

            await tx.escrowTransaction.create({
              data: {
                escrowId,
                userId: opponent.id,
                type: "REFUND",
                amount: escrow.opponentAmount,
                status: "COMPLETED",
                description: reason,
                processedAt: new Date(),
              },
            });
          }
        }

        // Refund bounty participants
        if (escrow.bounty) {
          const { creator, participants } = escrow.bounty;

          // Refund bounty creator
          await tx.userWallet.upsert({
            where: { userId: creator.id },
            update: {
              balance: { increment: escrow.bounty.bountyAmount },
            },
            create: {
              userId: creator.id,
              balance: escrow.bounty.bountyAmount,
            },
          });

          // Refund participants
          for (const participant of participants) {
            await tx.userWallet.upsert({
              where: { userId: participant.participantId },
              update: {
                balance: { increment: participant.stakeAmount },
              },
              create: {
                userId: participant.participantId,
                balance: participant.stakeAmount,
              },
            });

            await tx.escrowTransaction.create({
              data: {
                escrowId,
                userId: participant.participantId,
                type: "REFUND",
                amount: participant.stakeAmount,
                status: "COMPLETED",
                description: reason,
                processedAt: new Date(),
              },
            });
          }
        }
      });

      return { success: true };
    } catch (error) {
      console.error("Error refunding escrow:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case "payment_intent.succeeded":
        await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case "payment_intent.payment_failed":
        await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const { userId, escrowId, type } = paymentIntent.metadata;

    if (type === "escrow_deposit" && escrowId) {
      // Mark escrow transaction as completed
      await prisma.escrowTransaction.updateMany({
        where: {
          escrowId,
          userId,
          stripeTransactionId: paymentIntent.id,
        },
        data: {
          status: "COMPLETED",
          processedAt: new Date(),
        },
      });

      // Check if all payments for this escrow are completed
      const escrow = await prisma.escrowAccount.findUnique({
        where: { id: escrowId },
        include: { transactions: true },
      });

      if (escrow) {
        const completedTransactions = escrow.transactions.filter(
          t => t.type === "ESCROW_LOCK" && t.status === "COMPLETED"
        );

        const expectedAmount = escrow.totalAmount;
        const completedAmount = completedTransactions.reduce((sum, t) => sum + t.amount, 0);

        if (completedAmount >= expectedAmount) {
          // All payments completed, activate the wager/bounty
          if (escrow.wager) {
            await prisma.wager.update({
              where: { escrowId },
              data: { status: "ACTIVE" },
            });
          } else if (escrow.bounty) {
            await prisma.bounty.update({
              where: { escrowId },
              data: { status: "ACTIVE" },
            });
          }
        }
      }
    }
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const { userId, escrowId, type } = paymentIntent.metadata;

    if (type === "escrow_deposit" && escrowId) {
      // Mark escrow transaction as failed
      await prisma.escrowTransaction.updateMany({
        where: {
          escrowId,
          userId,
          stripeTransactionId: paymentIntent.id,
        },
        data: {
          status: "FAILED",
        },
      });

      // Cancel the wager/bounty
      const escrow = await prisma.escrowAccount.findUnique({
        where: { id: escrowId },
      });

      if (escrow) {
        if (escrow.wager) {
          await prisma.wager.update({
            where: { escrowId },
            data: { status: "CANCELLED" },
          });
        } else if (escrow.bounty) {
          await prisma.bounty.update({
            where: { escrowId },
            data: { status: "CANCELLED" },
          });
        }

        // Refund any successful payments
        await this.refundEscrow(escrowId, "Payment failed");
      }
    }
  }
}

export const stripeEscrowManager = new StripeEscrowManager();