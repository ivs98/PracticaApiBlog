import express from 'express';
import morgan from 'morgan';
import routerPosts from './routes/posts.routes.js';
//import mysql2 from './config/database';

const app = express();
const port = 3000;

// Middleware para parsear el cuerpo de las solicitudes
app.use(express.json());
app.use(morgan('dev')); // muestra las solicitudes HTTP en la consola

app.get('/', (req, res) => {
  res.send('¡Hola, mundo!');
});


// Endpoint para crear una nueva publicación de blog
app.use('/posts', routerPosts);

// Sincronizar el modelo con la base de datos y luego iniciar el servidor
/* mysql2.getConnection((err, connection) => {
  if (err) {
    console.error('Unable to connect to the database:', err);
    return;
  }
  console.log('Connected to the database');
  app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
  });
  connection.release();
}); */

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
  });