import React, { useState } from 'react';

function TodoForm({ onSave, initial = {} }) {
  const [title, setTitle] = useState(initial.title || '');
  const [description, setDescription] = useState(initial.description || '');
  const [dueDate, setDueDate] = useState(initial.dueDate || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ title, description, dueDate });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" required />
      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" />
      <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
      <button type="submit">Save</button>
    </form>
  );
}

export default TodoForm;
