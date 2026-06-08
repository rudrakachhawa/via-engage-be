import "dotenv/config";
import prisma from "../config/prisma";
import { connectRabbitMQ, QUEUE_NAME } from "../queues/outbound.queue";
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

async function startWorker() {
  const channel = await connectRabbitMQ();

  channel.consume(QUEUE_NAME, async (msg) => {
    if (!msg) return;

    let eventId: string;
    try {
      ({ eventId } = JSON.parse(msg.content.toString()));
    } catch {
      channel.nack(msg, false, false); // malformed, discard
      return;
    }

    console.log("Job Received", eventId);

    const event = await prisma.metaEvents.findUnique({ where: { id: eventId } });

    if (!event) {
      channel.ack(msg); // nothing to process
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
        // Replaces: job.moveToDelayed(nextHour.getTime())
        // nack without requeue → message goes to DLX → RETRY_QUEUE (1hr TTL) → back here
        channel.nack(msg, false, false);

        await prisma.metaEvents.update({
          where: { id: event.id },
          data: { status: "PENDING" }, // reset so it can be retried
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
        case 'POSTBACK_MESSAGE': {

          const convertToFollower = automation.convertToFollower
          if (convertToFollower) {

            const senderProfileInfo = await getSenderProfileInfo(
              event.recipientIgId || "",
              oauth.accessToken
            )
            if (!senderProfileInfo.is_user_follow_business) {
              const convertToFollowerMessage = automation.convertToFollowerMessage as any;

              const messageText =
                typeof convertToFollowerMessage === "object" && convertToFollowerMessage !== null && "message" in convertToFollowerMessage
                  ? (convertToFollowerMessage.message as string)
                  : "Please follow our profile!";

              const buttons =
                typeof convertToFollowerMessage === "object" &&
                  convertToFollowerMessage !== null &&
                  Array.isArray((convertToFollowerMessage as any).buttons)
                  ? (convertToFollowerMessage as any).buttons
                  : [];

              const messagePayload = {
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

              response = await sendInstagramDM(
                oauth.accessToken,
                event.recipientIgId,
                messagePayload
              );
              break
            } else {
              response = await sendInstagramDM(
                oauth.accessToken,
                event.recipientIgId,
                { text: automation.messageTemplate }
              );
              break
            }
          } else {
            response = await sendInstagramDM(
              oauth.accessToken,
              event.recipientIgId,
              { text: automation.messageTemplate }
            );
          }
          break;
        }
        case "COMMENT": {
          const replyMessage = (automation.commentReplies as any[])?.length
            ? (automation.commentReplies as any[])[
            Math.floor(
              Math.random() * (automation.commentReplies as any[]).length,
            )
            ]
            : "Check your DM";

          await publicReplyToComment(
            oauth.accessToken,

            event.commentId!,

            replyMessage,
          );

          const messagePayload =
            (automation.conversationStarter as any)?.message ||
              (automation.conversationStarter as any)?.buttonText
              ? {
                attachment: {
                  type: "template",
                  payload: {
                    template_type: "button",
                    text: (automation.conversationStarter as any)
                      ?.message as string,
                    buttons: [
                      {
                        type: "postback",
                        payload: JSON.stringify({
                          automationId: automation.id,
                          commentId: event.commentId,
                        }),
                        title: (automation.conversationStarter as any)
                          ?.buttonText as string,
                      },
                    ],
                  },
                },
              }
              : { text: automation.messageTemplate };
          response = await privateDMReplyToComment(
            oauth.accessToken,
            event.commentId || "",
            messagePayload,
            event.igUserId,
          );
          break;
        }

        case "DM":

        case "STORY_REPLY": {
          const messagePayload = {
            text: automation.messageTemplate
          }
          response = await sendInstagramDM(
            oauth.accessToken,
            event.recipientIgId,
            messagePayload
          );

          break;
        }
      }

      await incrementMessageCount(rateLimit.key);

      await prisma.metaEvents.update({
        where: { id: event.id },
        data: { status: "COMPLETED", processedAt: new Date() },
      });

      channel.ack(msg); // ✅ success

    } catch (error) {
      console.log(error);

      await prisma.metaEvents.update({
        where: { id: event.id },
        data: { status: "FAILED", errorLog: (error as any).toString() },
      });

      // nack without requeue — goes to DLX for retry after 1hr
      channel.nack(msg, false, false);
    }
  });

  console.log("Outbound Worker Started");
}

startWorker().catch(console.error);