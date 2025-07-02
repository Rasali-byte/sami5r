// src/App.jsx (Example React App component)

import React, { useState, useEffect } from 'react';
import axios from './axios'; // Your custom axios instance
import TodoForm from './TodoForm';
import './App.css';

function App() {
    const [todos, setTodos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTodos = async () => {
            try {
                const response = await axios.get('/api/todos');
                setTodos(response.data);
            } catch (err) {
                setError('Failed to fetch todos.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchTodos();
    }, []);

    const addTodo = async (newTodoText) => {
        try {
            const response = await axios.post('/api/todos', { text: newTodoText, completed: false });
            setTodos([...todos, response.data.todo]);
        } catch (err) {
            setError('Failed to add todo.');
            console.error(err);
        }
    };

    if (loading) return <div>Loading todos...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="App">
            <h1>My Todo List</h1>
            <TodoForm onAddTodo={addTodo} />
            <div className="todo-list">
                {todos.map((todo) => (
                    <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                        {todo.text}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App;