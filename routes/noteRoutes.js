const express = require('express')
const router2 = express.Router()
const notesController = require('../controllers/notesController')
const verifyJWT = require('../middleware/verifyJWT')

router2.use(verifyJWT)

router2.route('/')
    .get(notesController.getAllNotes)
    .post(notesController.createNewNote)
    .patch(notesController.updateNote)
    .delete(notesController.deleteNote)

module.exports = router2