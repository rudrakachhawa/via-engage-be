import prisma from "../../../config/prisma"

type Automation = {
    id: string
    keywords: string[]
    // add other properties if used elsewhere
}

function normalize(
    text: string
): string {
    return text
        .toLowerCase()
        .trim()
        .replace(
            /[^\w\s]/g,
            ""
        )
}

export async function findDmAutomation(
    igUserId: string,
    message: string
) {
    const automations: Automation[] =
        await prisma.automation.findMany({
            where: {
                igUserId,
                triggerType: "DM",
                isActive: true
            }
        })

    const normalizedMessage: string =
        normalize(message)
    return automations.find(
        (automation: Automation) =>
            automation.keywords.some(
                (keyword: string) =>
                    normalizedMessage.includes(
                        normalize(keyword)
                    )
            )
    )
}

export async function findStoryAutomation(
    igUserId: string,
    storyId: string,
    message: string
) {
    const automations: Automation[] =
        await prisma.automation.findMany({
            where: {
                igUserId,
                triggerType: "STORY_REPLY",
                targetContentId: storyId,
                isActive: true
            }
        })

    const normalized: string =
        normalize(message)

    return automations.find(
        (automation: Automation) =>
            automation.keywords.some(
                (keyword: string) =>
                    normalized.includes(
                        normalize(keyword)
                    )
            )
    )
}

export async function findCommentAutomation(
    igUserId: string,

    mediaId: string,

    comment: string
) {

    const automations =
        await prisma.automation.findMany({

            where: {

                igUserId,

                triggerType:
                    "COMMENT",

                targetContentId:
                    mediaId,

                isActive: true

            }

        })

    const normalized =
        normalize(comment)

    return automations.find(
        (automation: Automation) =>
            automation.keywords.some(
                (keyword: string) =>
                    normalized.includes(
                        normalize(keyword)
                    )
            )
    )

}

export async function findAutomationById(automationId: string) {
    const automation = await prisma.automation.findUnique({

        where: {

            id: automationId,

            isActive: true

        }

    })
    return automation

}