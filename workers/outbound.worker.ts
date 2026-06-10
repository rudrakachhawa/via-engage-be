import "dotenv/config";
import prisma from "../config/prisma";
import { connectRabbitMQ, getChannel, QUEUE_NAME } from "../queues/outbound.queue";
import {
  canSendMessage,
  incrementMessageCount,
} from "../lib/services/rate-limit/rate-limit.service";
import {
  privateDMReplyToComment,
  publicReplyToComment,
} from "../lib/services/messaging/comment.service";
import { sendInstagramDM } from "../lib/services/messaging/messaging.service";
import { getSenderProfileInfo } from "../lib/services/messaging/instagram.service";

/**
 * Send a sequence of messages using Instagram DM API for the automation response flow.
 */
async function sendAutomationResponseFlow(responseFlow: any[], accessToken: string, recipientIgId: string) {
  for (const item of responseFlow) {
    // Ensure item is a plain object
    if (item && typeof item === "object" && !Array.isArray(item)) {
      let messagePayload = { ...item } as Record<string, any>;
      delete messagePayload.type;
      if (!messagePayload.attachment.payload.buttons.length) {
        messagePayload = {
          text: messagePayload.attachment.payload.text
        }
      }
      await sendInstagramDM(
        accessToken,
        recipientIgId,
        messagePayload
      );
    }
  }
}

/**
 * Build convert-to-follower message payload using automation options
 */
function buildFollowerMessagePayload(automation: any, buttons: any[], messageText: string) {
  return {
    attachment: {
      type: "template",
      payload: {
        template_type: "button",
        text: messageText,
        buttons: [
          {
            type: "web_url",
            url: `https://instagram.com/${automation.instaAccount?.userName || ""}`,
            title: buttons[0]?.text || "Visit Profile",
          },
          {
            type: "postback",
            payload: JSON.stringify({
              automationId: automation.id,
              action: "CONFIRM_FOLLOW",
            }),
            title: buttons[1]?.text || "I'm Following",
          },
        ],
      },
    },
  };
}

/**
 * Build DM reply to comment payload.
 */
function buildConversationStarterPayload(automation: any, event: any) {
  const starter: any = automation.conversationStarter;
  if (starter?.message || starter?.buttonText) {
    return {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: starter?.message as string,
          buttons: [
            {
              type: "postback",
              payload: JSON.stringify({
                automationId: automation.id,
                commentId: event.commentId,
              }),
              title: starter?.buttonText as string,
            },
          ],
        },
      },
    };
  }
  return { text: automation.messageTemplate };
}

export async function startWorker() {
  await connectRabbitMQ();
  const channel = getChannel();
  channel.consume(QUEUE_NAME, async (msg) => {
    if (!msg) return;

    let eventId: string;
    try {
      ({ eventId } = JSON.parse(msg.content.toString()));
    } catch {
      channel.nack(msg, false, false);
      return;
    }

    console.log("Job Received", eventId);

    const event = await prisma.metaEvents.findUnique({ where: { id: eventId } });

    if (!event) {
      channel.ack(msg);
      return;
    }

    try {
      await prisma.metaEvents.update({
        where: { id: event.id },
        data: { status: "PROCESSING" },
      });

      const rateLimit = await canSendMessage(event.igUserId);

      if (!rateLimit.allowed) {
        console.log("Rate Limited — requeueing to retry queue");
        channel.nack(msg, false, false);

        await prisma.metaEvents.update({
          where: { id: event.id },
          data: { status: "PENDING" },
        });
        return;
      }

      const automation = await prisma.automation.findUnique({
        where: { id: event.automationId },
        include: { instaAccount: true },
      });

      if (!automation) throw new Error("Automation missing");

      const oauth = await prisma.instaAccountOauth.findUnique({
        where: { igUserId: event.igUserId },
      });

      if (!oauth) throw new Error("OAuth missing");

      let response;
      switch (event.triggerType) {
        case "POSTBACK_MESSAGE": {
          if (automation.convertToFollower) {
            const senderProfileInfo = await getSenderProfileInfo(
              event.recipientIgId || "",
              oauth.accessToken
            );
            if (!senderProfileInfo.is_user_follow_business) {
              const convertMessage = automation.convertToFollowerMessage as any;
              const messageText =
                typeof convertMessage === "object" && convertMessage !== null && "message" in convertMessage
                  ? (convertMessage.message as string)
                  : "Please follow our profile!";
              const buttons =
                typeof convertMessage === "object" &&
                  convertMessage !== null &&
                  Array.isArray(convertMessage.buttons)
                  ? convertMessage.buttons
                  : [];
              const messagePayload = buildFollowerMessagePayload(automation, buttons, messageText);

              response = await sendInstagramDM(
                oauth.accessToken,
                event.recipientIgId,
                messagePayload
              );
              break;
            } else if (Array.isArray(automation.responseFlow) && automation.responseFlow.length) {
              await sendAutomationResponseFlow(
                automation.responseFlow,
                oauth.accessToken,
                event.recipientIgId
              );
              break;
            }
          }
          if (Array.isArray(automation.responseFlow) && automation.responseFlow.length) {
            await sendAutomationResponseFlow(
              automation.responseFlow,
              oauth.accessToken,
              event.recipientIgId
            );
          }
          break;
        }
        case "COMMENT": {
          const commentReplies = (automation.commentReplies as any[]) || [];
          const replyMessage =
            commentReplies.length > 0
              ? commentReplies[Math.floor(Math.random() * commentReplies.length)]
              : "Check your DM";

          await publicReplyToComment(
            oauth.accessToken,
            event.commentId!,
            replyMessage
          );

          const messagePayload = buildConversationStarterPayload(automation, event);

          response = await privateDMReplyToComment(
            oauth.accessToken,
            event.commentId || "",
            messagePayload,
            event.igUserId
          );
          break;
        }
        case "DM":
        case "STORY_REPLY": {
          if (Array.isArray(automation.responseFlow) && automation.responseFlow.length) {
            await sendAutomationResponseFlow(
              automation.responseFlow,
              oauth.accessToken,
              event.recipientIgId
            );
          }
          break;
        }
      }

      await incrementMessageCount(rateLimit.key);

      await prisma.metaEvents.update({
        where: { id: event.id },
        data: { status: "COMPLETED", processedAt: new Date() },
      });

      channel.ack(msg);
    } catch (error) {
      await prisma.metaEvents.update({
        where: { id: event.id },
        data: { status: "FAILED", errorLog: (error as any).toString() },
      });

      channel.nack(msg, false, false);
    }
  });

  console.log("Outbound Worker Started");
}