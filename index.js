// index.js
const express = require('express');
const bodyParser = require('body-parser'); //no lo entiendo

const app = express();
const port = 3000;

// Middleware para parsear el cuerpo de las solicitudes
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('¡Hola, mundo!');
});

app.listen(port, () => {
  console.log(`Aplicación escuchando en http://localhost:${port}`);
});

app.post('/blog', (req, res) => {
    const { title, content } = req.body;

    if (!title || !content) {
        return res.status(400).json({ error: 'El título y el contenido de la entrada son campos obligatorios.' });
    }

    // Aquí puedes añadir la lógica para guardar la publicación en una base de datos
    // Por ahora, simplemente devolveremos la publicación creada
    const newPost = {
        id: Date.now(), // Generar un ID único
        title,
        content,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    res.status(201).json(newPost);
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
  });