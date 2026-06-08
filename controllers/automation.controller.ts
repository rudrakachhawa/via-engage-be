import { Request, Response } from 'express';
import prisma from '../config/prisma';

// Helper: Ensure id param is always a string
const getId = (id: string | string[]) => (Array.isArray(id) ? id[0] : id);

// Helper: Field existence/validity checker for activate scenarios
function hasAllRequiredFields(obj: Record<string, any>, fields: string[]): boolean {
    return fields.every(field => {
        const value = obj[field];
        if (Array.isArray(value)) return value.length > 0;
        return value !== undefined && value !== null && value !== "";
    });
}

// ── CREATE ──────────────────────────────
async function createAutomation(req: Request, res: Response) {
    try {
        const automation = await prisma.automation.create({
            data: {
                userId: (req as any).user.id,
                name: 'Untitled',
                isActive: false
            }
        });
        return res.status(201).json({ automation });
    } catch (err: any) {
        console.error('createAutomation error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// ── GET ALL ─────────────────────────────
async function getAutomations(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const automations = await prisma.automation.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                instaAccount: true,
                name: true,
                description: true,
                triggerType: true,
                isActive: true,
                createdAt: true
            }
        });
        return res.status(200).json({ automations });
    } catch (err: any) {
        console.error('getAutomations error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// ── GET ONE ─────────────────────────────
async function getAutomation(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const id = getId(req.params.id);
        const automation = await prisma.automation.findUnique({
            where: { id, userId },
            include: {
                instaAccount: true,
                _count: { select: { events: true } }
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

// ── UPDATE ──────────────────────────────
async function updateAutomation(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const id = getId(req.params.id);
        const fields = [
            'name', 'description', 'triggerType', 'messageTemplate', 'targetContentId',
            'targetContentType', 'targetContentUrl', 'targetThumbnailUrl', 'keywords',
            'commentReplies', 'igUserId', 'conversationStarter', 'convertToFollower', 'convertToFollowerMessage', 'responseFlow'
        ];
        const {
            isActive
        } = req.body;

        // Only include present fields
        const updateData: any = {};
        for (const field of fields) {
            if (req.body[field] !== undefined) {
                if ((field === 'keywords' || field === 'commentReplies') && !Array.isArray(req.body[field])) {
                    return res.status(400).json({ error: `${field} must be an array` });
                }
                updateData[field] = req.body[field];
            }
        }
        if (isActive !== undefined) updateData.isActive = isActive;

        // Fetch current
        const existing = await prisma.automation.findUnique({
            where: { id, userId }
        });
        if (!existing) {
            return res.status(404).json({ error: 'Automation not found' });
        }

        // Check for required fields if automation will be active
        const willBeActive = isActive === true || (isActive === undefined && existing.isActive === true);
        if (willBeActive) {
            // Compute effective values (incoming values overwrite existing)
            const effective: Record<string, any> = {};
            for (const field of fields) {
                effective[field] = req.body[field] !== undefined ? req.body[field] : (existing as any)[field];
            }

            let required: string[] = [];
            let missing: string[] = [];

            switch (effective.triggerType) {
                case 'DM':
                    required = ['igUserId', 'name', 'triggerType', 'messageTemplate', 'keywords'];
                    break;
                case 'STORY':
                    required = ['igUserId', 'name', 'triggerType', 'messageTemplate', 'keywords', 'targetContentId'];
                    break;
                case 'COMMENT':
                    required = [
                        'igUserId', 'name', 'triggerType', 'messageTemplate', 'keywords', 'targetContentId',
                        'commentReplies', 'conversationStarter'
                    ];
                    // Check conversationStarter.buttonText specifically
                    if (!effective.conversationStarter || typeof effective.conversationStarter !== 'object' || !effective.conversationStarter.buttonText || !effective.conversationStarter.message) {
                        missing.push('conversationStarter');
                    }
                    break;
                default:
                    // fallback, e.g. block activation due to missing/invalid triggerType
                    required = ['name', 'triggerType', 'messageTemplate', 'keywords'];
            }

            for (const field of required) {
                if (
                    effective[field] === undefined ||
                    effective[field] === null ||
                    (Array.isArray(effective[field]) && effective[field].length === 0) ||
                    (typeof effective[field] === "string" && effective[field].trim() === "")
                ) {
                    missing.push(field);
                }
            }

            // For 'COMMENT', also check convertToFollower rules
            if (effective.triggerType === 'COMMENT') {
                if (effective.convertToFollower) {
                    // convertToFollowerMessage must have message and buttons
                    if (
                        !effective.convertToFollowerMessage ||
                        typeof effective.convertToFollowerMessage !== 'object' ||
                        !effective.convertToFollowerMessage.message
                    ) {
                        missing.push('convertToFollowerMessage');
                    }
                    if (
                        !effective.convertToFollowerMessage ||
                        typeof effective.convertToFollowerMessage !== 'object' ||
                        !Array.isArray(effective.convertToFollowerMessage.buttons) ||
                        effective.convertToFollowerMessage.buttons.length === 0
                    ) {
                        missing.push('convertToFollowerMessage');
                    }
                }
            }

            if (missing.length > 0) {
                return res.status(400).json({
                    error: 'Some required fields are missing',
                    missingFields: missing
                });
            }
        }

        const automation = await prisma.automation.update({
            where: { id, userId },
            data: updateData,
            include: { _count: { select: { events: true } } }
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

// ── DELETE ──────────────────────────────
async function deleteAutomation(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const id = getId(req.params.id);
        const existing = await prisma.automation.findUnique({ where: { id, userId } });
        if (!existing) {
            return res.status(404).json({ error: 'Automation not found' });
        }
        await prisma.automation.delete({ where: { id, userId } });
        return res.status(200).json({ message: 'Automation deleted' });
    } catch (err: any) {
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'Automation not found' });
        }
        console.error('deleteAutomation error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// ── TOGGLE (pause / resume) ─────────────
async function toggleAutomation(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const id = getId(req.params.id);

        const current = await prisma.automation.findUnique({ where: { id, userId } });
        if (!current) {
            return res.status(404).json({ error: 'Automation not found' });
        }

        const willBeActive = !current.isActive;
        if (willBeActive) {
            // Replicate/update the same required field logic as in updateAutomation
            // These are the fields available to an automation object
            const fields = [
                'name', 'description', 'triggerType', 'messageTemplate', 'targetContentId',
                'targetContentType', 'targetContentUrl', 'targetThumbnailUrl', 'keywords',
                'commentReplies', 'igUserId', 'conversationStarter', 'convertToFollower', 'convertToFollowerMessage'
            ];

            // Use values from current automation from DB
            const effective: Record<string, any> = {};
            for (const field of fields) {
                effective[field] = (current as any)[field];
            }

            let required: string[] = [];
            let missing: string[] = [];

            switch (effective.triggerType) {
                case 'DM':
                    required = ['igUserId', 'name', 'triggerType', 'messageTemplate', 'keywords'];
                    break;
                case 'STORY':
                    required = ['igUserId', 'name', 'triggerType', 'messageTemplate', 'keywords', 'targetContentId'];
                    break;
                case 'COMMENT':
                    required = [
                        'igUserId', 'name', 'triggerType', 'messageTemplate', 'keywords', 'targetContentId',
                        'commentReplies', 'conversationStarter'
                    ];
                    // Check conversationStarter.buttonText specifically
                    if (!effective.conversationStarter || typeof effective.conversationStarter !== 'object' || !effective.conversationStarter.buttonText || !effective.conversationStarter.message) {
                        missing.push('conversationStarter');
                    }
                    break;
                default:
                    required = ['name', 'triggerType', 'messageTemplate', 'keywords'];
            }

            for (const field of required) {
                if (
                    effective[field] === undefined ||
                    effective[field] === null ||
                    (Array.isArray(effective[field]) && effective[field].length === 0) ||
                    (typeof effective[field] === "string" && effective[field].trim() === "")
                ) {
                    missing.push(field);
                }
            }

            // For 'COMMENT', also check convertToFollower rules
            if (effective.triggerType === 'COMMENT') {
                if (effective.convertToFollower) {
                    // convertToFollowerMessage must have message and buttons
                    if (
                        !effective.convertToFollowerMessage ||
                        typeof effective.convertToFollowerMessage !== 'object' ||
                        !effective.convertToFollowerMessage.message
                    ) {
                        missing.push('convertToFollowerMessage');
                    }
                    if (
                        !effective.convertToFollowerMessage ||
                        typeof effective.convertToFollowerMessage !== 'object' ||
                        !Array.isArray(effective.convertToFollowerMessage.buttons) ||
                        effective.convertToFollowerMessage.buttons.length === 0
                    ) {
                        missing.push('convertToFollowerMessage');
                    }
                }
            }

            if (missing.length > 0) {
                return res.status(400).json({
                    error: 'Some required fields are missing',
                    missingFields: missing
                });
            }
        }

        const automation = await prisma.automation.update({
            where: { id, userId },
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