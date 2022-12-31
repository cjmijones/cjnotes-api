const User = require('../models/User')
const Note = require('../models/Note')
const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt')

const getAllNotes = asyncHandler(async (req, res) => {
    const notes = await Note.find().lean()

    // If no users 
    if (!notes?.length) {
        return res.status(400).json({ message: 'No notes found' })
    }
    // Add username to each note before sending the response 
    // See Promise.all with map() here: https://youtu.be/4lqJBBEpjRE 
    // You could also do this with a for...of loop
    const notesWithUser = await Promise.all(notes.map(async (note) => {
        const user = await User.findById(note.user).lean().exec()
        return { ...note, username: user.username }
    }))

    res.json(notesWithUser)
})

const createNewNote = asyncHandler(async (req, res) => {
    const { user, title, text } = req.body

    // Confirm data
    if (!user || !title || !text) {
        return res.status(400).json({ message: 'All fields are required' })
    }

    
    const usercheck = await User.findOne({ user }).lean().exec()

    if (!usercheck) {
        return res.status(400).json({ message: 'Notes must attatch to existing users' })
    }

    // Check for duplicate title
    const duplicate = await Note.findOne({ title }).collation({ locale: 'en', strength: 2}).lean().exec()

    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate note title' })
    }

    const noteObject = { user, title, text}

    const note = await Note.create(noteObject)

    if (note) {
        res.status(201).json({ message: `New note "${title}" created` })
    } else {
        res.status(400).json({ message: 'Invalid user data received' })
    }
})

// @desc Update a note
// @route PATCH /notes
// @access Private
const updateNote = asyncHandler(async (req, res) => {
    const { id, user, title, text, completed } = req.body

    // Confirm data
    if (!id || !user || !title || !text || typeof completed !== 'boolean') {
        return res.status(400).json({ message: 'All fields are required' })
    }

    // Confirm note exists to update
    const note = await Note.findById(id).exec()

    if (!note) {
        return res.status(400).json({ message: 'Note not found' })
    }

    // Check for duplicate title
    const duplicate = await Note.findOne({ title }).collation({ locale: 'en', strength: 2}).lean().exec()

    // Allow renaming of the original note 
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate note title' })
    }

    note.user = user
    note.title = title
    note.text = text
    note.completed = completed

    const updatedNote = await note.save()

    res.json(`'${updatedNote.title}' updated`)
})

// @desc Delete a note
// @route DELETE /notes
// @access Private
const deleteNote = asyncHandler(async (req, res) => {
    const { id } = req.body

    // Confirm data
    if (!id) {
        return res.status(400).json({ message: 'Note ID required' })
    }

    // Confirm note exists to delete 
    const note = await Note.findById(id).exec()

    if (!note) {
        return res.status(400).json({ message: 'Note not found' })
    }

    const result = await note.deleteOne()

    const reply = `Note '${result.title}' with ID ${result._id} deleted`

    res.json(reply)
})

module.exports = {
    getAllNotes,
    createNewNote,
    updateNote,
    deleteNote
}