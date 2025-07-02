// src/TodoForm.jsx (Example React Todo Form component)

import React, { useState } from 'react';

function TodoForm({ onAddTodo }) {
    const [todoText, setTodoText] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (todoText.trim()) {
            onAddTodo(todoText);
            setTodoText('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="todo-form">
            <input
                type="text"
                value={todoText}
                onChange={(e) => setTodoText(e.target.value)}
                placeholder="Add a new todo..."
            />
            <button type="submit">Add Todo</button>
        </form>
    );
}

export default TodoForm;