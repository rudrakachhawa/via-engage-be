import { Request, Response } from 'express';
import prisma from '../config/prisma';

// ── CREATE ──────────────────────────────────────────
async function createAutomation(req: Request, res: Response) {
    try {
        // Accept nothing from body: all fields default except igUserId and name
        const automation = await prisma.automation.create({
            data: {
                userId: (req as any).user.id,
                name: 'Untitled',
                description: 'Add some information about this automation',
                isActive: false
            }
        });

        return res.status(201).json({ automation });

    } catch (err: any) {
        console.error('createAutomation error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// ── GET ALL ─────────────────────────────────────────
async function getAutomations(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id
        const automations = await prisma.automation.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { events: true }
                },
                instaAccount: true,
            }
        });

        return res.status(200).json({ automations });

    } catch (err: any) {
        console.error('getAutomations error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// ── GET ONE ─────────────────────────────────────────
async function getAutomation(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id
        const automation = await prisma.automation.findUnique({
            where: { id: typeof id === 'string' ? id : id[0], userId },
            include: {
                instaAccount: true,
                _count: {
                    select: { events: true }
                }
            }
        });


        if (!automation) {
            return res.status(404).json({ error: 'Automation not found' });
        }

        return res.status(200).json({ automation });

    } catch (err: any) {
        console.error('getAutomation error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// ── UPDATE ──────────────────────────────────────────
async function updateAutomation(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id
        const {
            name,
            description,
            triggerType,
            messageTemplate,
            targetContentId,
            targetContentType,
            targetContentUrl,
            targetThumbnailUrl,
            keywords,
            isActive,
            commentReplies,
            igUserId
        } = req.body;

        // Only allow updating fields that are actually present
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (triggerType !== undefined) updateData.triggerType = triggerType;
        if (messageTemplate !== undefined) updateData.messageTemplate = messageTemplate;
        if (targetContentId !== undefined) updateData.targetContentId = targetContentId;
        if (targetContentType !== undefined) updateData.targetContentType = targetContentType;
        if (targetContentUrl !== undefined) updateData.targetContentUrl = targetContentUrl;
        if (targetThumbnailUrl !== undefined) updateData.targetThumbnailUrl = targetThumbnailUrl;
        if (keywords !== undefined) {
            if (!Array.isArray(keywords)) {
                return res.status(400).json({ error: 'keywords must be an array' });
            }
            updateData.keywords = keywords;
        }
        if (commentReplies !== undefined) {
            if (!Array.isArray(commentReplies)) {
                return res.status(400).json({ error: 'commentReplies must be an array' });
            }
            updateData.commentReplies = commentReplies;
        }

        if (isActive !== undefined) updateData.isActive = isActive;
        if (igUserId !== undefined) updateData.igUserId = igUserId;

        // Fetch current automation to know its active state
        const automationId = typeof id === 'string' ? id : id[0];
        const existing = await prisma.automation.findUnique({
            where: { id: automationId, userId }
        });
        if (!existing) {
            return res.status(404).json({ error: 'Automation not found' });
        }

        // If automation is currently active or will be active after update, do strict field checks
        const willBeActive = isActive === true || (isActive === undefined && existing.isActive === true);
        if (willBeActive) {
            // Determine the effective values, prioritize new values from the request body, otherwise keep previous
            const effectiveName = name !== undefined ? name : existing.name;
            const effectiveDescription = description !== undefined ? description : existing.description;
            const effectiveTriggerType = triggerType !== undefined ? triggerType : existing.triggerType;
            const effectiveMessageTemplate = messageTemplate !== undefined ? messageTemplate : (existing as any).messageTemplate;
            const effectiveTargetContentId = targetContentId !== undefined ? targetContentId : existing.targetContentId;
            const effectiveTargetContentType = targetContentType !== undefined ? targetContentType : existing.targetContentType;
            const effectiveTargetContentUrl = targetContentUrl !== undefined ? targetContentUrl : existing.targetContentUrl;
            const effectiveTargetThumbnailUrl = targetThumbnailUrl !== undefined ? targetThumbnailUrl : existing.targetThumbnailUrl;
            const effectiveKeywords = keywords !== undefined ? keywords : existing.keywords;
            const effectiveCommentReplies = commentReplies !== undefined ? commentReplies : existing.commentReplies;

            const effectiveIgUserId = igUserId !== undefined ? igUserId : existing.igUserId;

            if (
                !effectiveName ||
                !effectiveDescription ||
                !effectiveTriggerType ||
                !effectiveMessageTemplate ||
                !effectiveTargetContentId ||
                !effectiveTargetContentType ||
                !effectiveTargetContentUrl ||
                !effectiveTargetThumbnailUrl ||
                (Array.isArray(effectiveKeywords) && effectiveKeywords.length === 0) ||
                (Array.isArray(effectiveCommentReplies) && effectiveCommentReplies.length === 0) ||
                !effectiveIgUserId
            ) {
                return res.status(400).json({
                    error: 'All fields (name, description, triggerType, messageTemplate, targetContentId, targetContentType, targetContentUrl, targetThumbnailUrl, keywords) are required while automation is active'
                });
            }
        }
        // else: if automation is NOT active and update won't make it active, allow all changes with no checks

        const automation = await prisma.automation.update({
            where: { id: automationId, userId },
            data: updateData,
            include: {
                _count: { select: { events: true } }
            }
        });

        return res.status(200).json({ automation });

    } catch (err: any) {
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'Automation not found' });
        }
        console.error('updateAutomation error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// ── DELETE ──────────────────────────────────────────
async function deleteAutomation(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id
        // Fetch existing automation to check if it is active
        const existing = await prisma.automation.findUnique({ where: { id: typeof id === 'string' ? id : id[0], userId } });
        if (!existing) {
            return res.status(404).json({ error: 'Automation not found' });
        }

        // If active, prevent deletion unless you want to allow (this logic assumes deletion is allowed always)
        // If you want to restrict deletion of active automations, uncomment below
        // if (existing.isActive) {
        //     return res.status(400).json({ error: 'Cannot delete active automation. Please pause it first.' });
        // }

        await prisma.automation.delete({ where: { id: typeof id === 'string' ? id : id[0], userId } });

        return res.status(200).json({ message: 'Automation deleted' });

    } catch (err: any) {
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'Automation not found' });
        }
        console.error('deleteAutomation error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// ── TOGGLE (pause / resume) ──────────────────────────
async function toggleAutomation(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id
        const automationId = typeof id === 'string' ? id : id[0];

        const current = await prisma.automation.findUnique({ where: { id: automationId, userId } });
        if (!current) {
            return res.status(404).json({ error: 'Automation not found' });
        }

        // If user tries to activate ("publish") from toggle, check all fields
        const willBeActive = !current.isActive;
        if (willBeActive) {
            if (
                !current.triggerType ||
                !current.messageTemplate ||
                !current.targetContentId ||
                !current.targetContentType ||
                !current.targetContentUrl
            ) {
                return res.status(400).json({
                    error: 'All fields (triggerType, messageTemplate, targetContentId, targetContentType, targetContentUrl) must be present to publish automation'
                });
            }
        }

        const automation = await prisma.automation.update({
            where: { id: automationId, userId },
            data: { isActive: willBeActive }
        });

        return res.status(200).json({
            automation,
            message: automation.isActive ? 'Automation resumed' : 'Automation paused'
        });

    } catch (err: any) {
        console.error('toggleAutomation error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export {
    createAutomation,
    getAutomations,
    getAutomation,
    updateAutomation,
    deleteAutomation,
    toggleAutomation
};