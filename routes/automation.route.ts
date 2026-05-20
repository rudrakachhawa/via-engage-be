import express from "express";
import verifyFirebaseToken from "../middlewares/user.middleware";
import {
    createAutomation,
    getAutomations,
    getAutomation,
    updateAutomation,
    deleteAutomation,
    toggleAutomation
} from "../controllers/automation.controller";
import requireInstaUser from "../middlewares/usermetainfo.middleware";

const router = express.Router();

router.post('/', verifyFirebaseToken, requireInstaUser, createAutomation);   // create
router.get('/', verifyFirebaseToken, requireInstaUser, getAutomations);      // list all for this IG account
router.get('/:id', verifyFirebaseToken, requireInstaUser, getAutomation);    // get single
router.put('/:id', verifyFirebaseToken, requireInstaUser, updateAutomation); // update
router.delete('/:id', verifyFirebaseToken, requireInstaUser, deleteAutomation); // delete
router.patch('/:id/toggle', verifyFirebaseToken, requireInstaUser, toggleAutomation); // pause / resume

export default router;