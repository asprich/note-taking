const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(bodyParser.json());
app.use(cors());

// Rough code to let us store notes in memory with out any DB complexity
const notes = {
  1: {
    id: 1,
    title: 'Test Note',
    body: 'This is a test note object that will be available by default',
    created_at: Date.now(),
    created_by: 'admin',
    edit_history: [{
      edited_at: Date.now(),
      edited_by: 'A User',
    }],
  },
  2: {
    "id": 2,
    "title": "Test Note 2",
    "body": "This is a second test note object that will be available by default",
    "created_at": 1631767852081,
    "created_by": "admin",
    "edit_history": [
        {
            "edited_at": 1631767852081,
            "edited_by": "A User"
        }
    ],
    "tags": [
        "orange",
        "blue",
        "yellow"
    ]
  },
  3: {
    "id": 3,
    "title": "Test Note 3",
    "body": "This is a third test note object that will be available by default",
    "created_at": 1631767852081,
    "created_by": "admin",
    "edit_history": [
        {
            "edited_at": 1631767852081,
            "edited_by": "A User"
        }
    ],
    "tags": [
        "red",
        "blue",
        "green"
    ]
  }
};


const getNextId = () => Number.parseInt(Math.max(...Object.keys(notes).map(Number.parseInt)), 10) + 1;

const addNote = ({ title, body, created_by }) => {
  const id = getNextId();
  notes[id] = {
    id,
    title,
    body,
    created_by,
    created_at: Date.now(),
    edit_history: [],
    tags: []
  };
  return notes[id];
};

const getNotes = () => notes;

const getNote = (id) => {
  const note = getNotes()[id];
  return note || null;
};

const updateNote = (id, update = {}) => {
  const note = getNote(id);

  const { title, body } = update;
  Object.assign(note, { title, body });

  if (update.edited_by) {
    note.edit_history.push({
      edited_by: update.edited_by,
      edited_at: Date.now(),
    });
  }
  return note;
};

const removeNote = (id) => {
  if (getNote(id)) {
    delete getNotes()[id];
    return true;
  }
  return false;
};

app.post('/notes', (req, res) => {
  const note = addNote(req.body);
  res.json(note);
});

app.get('/notes', (req, res) => {
  res.json(Object.values(getNotes()));
});

//Get the tags for a note
app.get('/notes/tags/:id', (req,res) => {
  const note = getNote(req.params.id);
  
  //404 if a note doesn't exist
  if (!note)
    return res.sendStatus(404);

  //return an empty array if tags hasn't been defined
  res.json(note.tags || []);
});

app.post('/notes/tags/:id', (req,res) => {
  const note = getNote(req.params.id);

  //404 if a note doesn't exist
  if (!note)
    return res.sendStatus(404);

  //Get the tag array from the request
  const tagsFromQueryBody = req.body;

  //If the body of the request isn't an array return a 400
  if (!Array.isArray(tagsFromQueryBody))
    return res.status(400).send("you must pass in an array of tags");

  //Ensure the note the tags field and it's an array
  if (!Array.isArray(note.tags))
    note.tags = [];

  tagsFromQueryBody.map(tag => {
    //If the incoming item isn't a string, then it's not a valid tag
    if (typeof tag !== "string") return;
    
    //If the note already has this tag, then we don't need to add it
    //this will also dedup user entered tags
    if (note.tags.includes(tag)) return;

    note.tags.push(tag);
  });

  res.json(note);
});

app.delete('/notes/tags/:id', (req, res) => {
  const note = getNote(req.params.id);

  //404 if a note doesn't exist
  if (!note)
    return res.status(404);

  //Ensure the note the tags field and it's an array
  if (!Array.isArray(note.tags))
    note.tags = [];

  //If the body of the request isn't an array return a 400
  const tagsToRemove = req.body;
  if (!Array.isArray(tagsToRemove))
    return res.status(400).send("you must pass in an array of tags");

  //Remove the requested tags from the array
  note.tags = note.tags.filter(tag => !tagsToRemove.includes(tag));

  res.json(note);
});

//Helper method to compare two strings, also case insensitive
const insensitiveCompare = (a, b) => {
  return new RegExp(`^${a}$`,"i").test(b);
};

//Supports ?q=searchtext
app.get('/notes/search', (req, res) => {
  const notes = Object.values(getNotes());

  //Get the search text from the query string
  const searchText = req.query.q;

  //If they're not looking for anything,
  //we don't need to send them anything
  if (searchText) {
    //In this simple search we'll check through the tags
    //to see if any of them match the supplied query
    const results = notes.filter(note => {
      //This variable is for debugability
      let isMatch = Array.isArray(note.tags) 
        && note.tags.filter(tag => insensitiveCompare(tag, searchText)).length > 0

      return isMatch;
    });

    //If we have matches then we're done!
    if (results && results.length)
      return res.json(results);
  }
    
  //If they're here then they either didn't
  //supply a search term, or there were no
  //matching records
  res.status(404).json([]);
});

app.get('/notes/:id', (req, res) => {
  const note = getNote(req.params.id);
  res.json(note);
});

app.post('/notes/:id', (req, res) => {
  const note = updateNote(req.params.id, req.body);
  res.json(note);
});

app.delete('/notes/:id', (req, res) => {
  const result = removeNote(req.params.id);
  res.json(result);
});

app.listen(5000, () => console.log('Server running on port 5000'));