import express from "express";

import { outboundQueue }
    from "../queues/outbound.queue";

const router =
    express.Router();

router.get(
    "/test-queue",

    async (_, res) => {

        await outboundQueue.add(
            "test-job",

            {
                hello: "world",
            }
        );

        res.json({
            success: true,
        });

    }
);

export default router;