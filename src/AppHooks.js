import React, { useState, useEffect } from 'react';
import { API, graphqlOperation } from 'aws-amplify';
import { withAuthenticator } from 'aws-amplify-react';
import { createNote, deleteNote, updateNote } from './graphql/mutations';
import { listNotes } from './graphql/queries';
import { onCreateNote, onDeleteNote, onUpdateNote } from './graphql/subscriptions';

const App = () => {
  // Hooks to model the state
  const [id, setId] = useState("");
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([]);

  // Hook to model the lifecycle methods (to model side effects)
  useEffect(() => {
    // This code acts as componentDidMount but also as componentDidUpdate (when state changes), 
    // to avoid acting when component update then we have to pass an empty array as second argument
    getNotes();
    const createNoteListener = API.graphql(graphqlOperation(onCreateNote)).subscribe({
      next: noteData => {
        const newNote = noteData.value.data.onCreateNote;
        setNotes(prevNotes => {
          const oldNotes = prevNotes.filter(note => note.id !== newNote.id);
          const updatedNotes = [...oldNotes, newNote];
          return updatedNotes;
        });
        setNote("");
      }
    });
    const deleteNoteListener = API.graphql(graphqlOperation(onDeleteNote)).subscribe({
      next: noteData => {
        const deletedNote = noteData.value.data.onDeleteNote;
        setNotes(prevNotes => {
          const updatedNotes = prevNotes.filter(note => note.id !== deletedNote.id);
          return updatedNotes;
        });
      }
    });
    const updateNoteListener = API.graphql(graphqlOperation(onUpdateNote)).subscribe({
      next: noteData => {
        const updatedNote = noteData.value.data.onUpdateNote;
        setNotes(prevNotes => {
          const index = prevNotes.findIndex(note => note.id === updatedNote.id);
          const updatedNotes = [
            ...prevNotes.slice(0, index),
            updatedNote,
            ...prevNotes.slice(index + 1)
          ];
          return updatedNotes;
        });
        setNote("");
        setId("");
      }
    })

    // we can return a function to act as componentWillUnmount, a cleaner function
    return () => {
      createNoteListener.unsubscribe();
      deleteNoteListener.unsubscribe();
      updateNoteListener.unsubscribe();
    };
  }, []); // passing this empty array as second argument to useEffect, we avoid execuiting when the component is updated, only acts when mounting and unmounting

  
  const getNotes = async () => {
    const result = await API.graphql(graphqlOperation(listNotes));
    setNotes(result.data.listNotes.items);
  }

  const handleChangeNote = event => setNote(event.target.value);

  const hasExistingNote = () => {
    if (id) {
      const isNote = notes.findIndex(note => note.id === id) > -1;
      return isNote;
    }
    return false;
  }

  const handleAddNote = async event => {
    event.preventDefault();
    if (hasExistingNote()) {
      handleUpdateNote();
    } else {
      const input = { note };
      await API.graphql(graphqlOperation(createNote, { input }));
    }
  };

  const handleUpdateNote = async () => {
    const input = { id, note }
    await API.graphql(graphqlOperation(updateNote, { input }))
  }

  const handleDeleteNote = async noteId => {
    const input = { id: noteId };
    await API.graphql(graphqlOperation(deleteNote, { input }));
  }

  const handleSetNote = ({ note, id }) => {
    setNote(note);
    setId(id);    
  };

  return (
    <div className="flex flex-column items-center justify-center pa3 bg-washed-red">
      <h1 className="code f2-l">Amplify Notetaker</h1>
      <form onSubmit={handleAddNote} className="mb3">
        <input 
          type="text" 
          className="pa2 f4"
          placeholder="Write your note"
          onChange={handleChangeNote}
          value={note}
        />
        <button className="pa2 f4" type="submit">
          {id ? 'Update Note' : 'Add Note'}
        </button>
      </form>
      <div>
        {notes.map(item => (
          <div key={item.id} className="flex items-center">
            <li
              onClick={() => handleSetNote(item)} 
              className="list pa1 f3"
            >
              {item.note}
            </li>
            <button 
              onClick={() => handleDeleteNote(item.id)}
              className="bg-transparent bn f4"
            >
              <span>&times;</span>
            </button>
          </div>
        ))}
      </div>
      
    </div>
  );
}

export default withAuthenticator(App, { includeGreetings: true });
