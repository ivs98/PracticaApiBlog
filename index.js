const express = require('express');
const bodyParser = require('body-parser');
const sequelize = require('./config/database');
const Post = require('./models/Post');

const app = express();
const port = 3002;

// Middleware para parsear el cuerpo de las solicitudes
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('¡Hola, mundo!');
});

app.listen(port, () => {
  console.log(`Aplicación escuchando en http://localhost:${port}`);
});

// Endpoint para crear una nueva publicación de blog
app.post('/blog', async (req, res) => {
    const { title, content } = req.body;

    if (!title || !content) {
        return res.status(400).json({ error: 'El título y el contenido de la entrada son campos obligatorios.' });
    }

    // Aquí puedes añadir la lógica para guardar la publicación en una base de datos
    try {
      const newPost = await Post.create({
        title,
        content,
        category,
        tags
      });
  
      res.status(201).json(newPost);
    } catch (error) {
      res.status(500).json({ error: 'Error creating post' });
    }

    // Por ahora, simplemente devolveremos la publicación creada
    /* const newPost = {
        id: Date.now(), // Generar un ID único
        title,
        content,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    res.status(201).json(newPost); */
});

// Sincronizar el modelo con la base de datos y luego iniciar el servidor
sequelize.sync().then(() => {
  app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
  });
}).catch(error => {
  console.error('Unable to connect to the database:', error);
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
  });