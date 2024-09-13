import { Router } from 'express';
import connectDB from '../config/database.js';

const router = Router();

router.post('/', async (req, res) => {
    const { title, content, category, tags } = req.body;

    console.log(title, content, category, tags);

    //hacer comprobaciones de los datos que llegan - validaciones!!!!

    if (!title || !content || !category || !tags) {
        return res.status(400).send("Faltan datos");
    }

    if (typeof title !== 'string' || typeof content !== 'string' || typeof category !== 'string' || !Array.isArray(tags)) {
        return res.status(400).send("Los datos son incorrectos, revísalos");
    }

    let connection;
    //insertar en la base de datos
    try {
        connection = await connectDB();

        await connection.beginTransaction();

        const [result] = await connection.execute( //query vs execute, buscar diferencias
            'INSERT INTO post (title, content, category) VALUES (?, ?, ?)',
            [title, content, category]
        );

        const postId = result.insertId;

        //si es correcto, me devuelve el id, lo cojo y hago un select para devolver el post entero
        if (postId){
            const [rows] = await connection.execute('SELECT * FROM post WHERE id = ?', [postId]);
            //return res.status(201).json(rows[0]);
            for (const tag of tags) {
                const [result] = await connection.execute(
                    'SELECT id FROM tag WHERE tag = ?', [tag]);
                
                const tagId = result.insertId;

                if (tagId) {
                    const [result2] = await connection.execute(
                        'INSERT INTO post_tag (id_post, id_tag) VALUES (?, ?)',
                        [postId, tagId]
                    );
                }else{
                    const [result3] = await connection.execute(
                        'INSERT INTO tag (tag) VALUES (?)',
                        [tag]
                    );
                    const tagId = result3.insertId;
                    const [result4] = await connection.execute(
                        'INSERT INTO post_tag (id_post, id_tag) VALUES (?, ?)',
                        [postId, tagId]
                    );
                }
            }
            
            await connection.commit();

            //Select para obtener los datos del post introducido
            // Seleccionar el post recién creado
            const [rows2] = await connection.execute('SELECT * FROM post WHERE post.id = ?', [postId]);
            /* const [tags] = await connection.execute(
                'SELECT tag.tag FROM tag INNER JOIN post_tag ON tag.id = post_tag.id_tag WHERE post_tag.id_post = ?', [postId]
            );
            rows2[0].tags = tags; */
            console.log(rows2[0]);
            
            return res.status(201).json(rows2[0]); //faltan los tags


        }
        
        
    } catch (error){
        await connection.rollback();
        console.error('Error al insertar en la base de datos:', error);
        return res.status(400).send("Bad Request");
    }


    return res.status(201).send("Created");
});

export default router;