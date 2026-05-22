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

const router = express.Router();

router.post('/', verifyFirebaseToken, createAutomation);   // create
router.get('/', verifyFirebaseToken, getAutomations);      // list all for this IG account
router.get('/:id', verifyFirebaseToken, getAutomation);    // get single
router.put('/:id', verifyFirebaseToken, updateAutomation); // update
router.delete('/:id', verifyFirebaseToken, deleteAutomation); // delete
router.patch('/:id/toggle', verifyFirebaseToken, toggleAutomation); // pause / resume

export default router;