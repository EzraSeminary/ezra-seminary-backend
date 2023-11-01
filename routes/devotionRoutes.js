const express = require('express')
const router = express.Router()
const devotionController = require('../controllers/devotionController')

// const verifyJWT = require('../middleware/verifyJWT')

// router.use(verifyJWT)

router.route('/create')
    // .get(notesController.getAllNotes)
    .post(devotionController.createDevotion)
    // .patch(notesController.updateNote)
    // .delete(notesController.deleteNote)

module.exports = router
