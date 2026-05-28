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
            include: {
                _count: { select: { events: true } },
                instaAccount: true
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
            'commentReplies', 'igUserId'
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
            // Compute effective values (new or old)
            const effective: Record<string, any> = {};
            for (const field of fields) {
                effective[field] = req.body[field] !== undefined ? req.body[field] : (existing as any)[field];
            }
            const required = [
                'name', 'description', 'triggerType', 'messageTemplate', 'targetContentId',
                'targetContentType', 'targetContentUrl', 'targetThumbnailUrl', 'keywords', 'commentReplies', 'igUserId'
            ];
            if (!hasAllRequiredFields(effective, required)) {
                return res.status(400).json({
                    error: 'All fields (name, description, triggerType, messageTemplate, targetContentId, targetContentType, targetContentUrl, targetThumbnailUrl, keywords, commentReplies, igUserId) are required while automation is active'
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
            let requiredFields: string[] = [];
            let errorMsg = '';

            if (current.triggerType === 'DM') {
                requiredFields = ['igUserId', 'keywords', 'messageTemplate'];
                errorMsg = "All fields (igUserId, keywords, messageTemplate) must be present to publish DM automation";
            } else {
                requiredFields = [
                    'triggerType', 'messageTemplate', 'targetContentId', 'targetContentType', 'targetContentUrl', 'igUserId'
                ];
                errorMsg = "All fields (triggerType, messageTemplate, targetContentId, targetContentType, targetContentUrl, igUserId) must be present to publish automation";
            }

            if (!hasAllRequiredFields(current, requiredFields)) {
                return res.status(400).json({
                    error: errorMsg
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