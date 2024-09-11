import { Router } from 'express';

const router = Router();

router.post('/', (req, res) => {
    const { title, content, category, tags } = req.body;

    console.log(title, content, category, tags);

    //hacer comprobaciones de los datos que llegan - validaciones!!!!

    if (!title || !content || !category || !tags) {
        return res.status(400).send("Faltan datos");
    }

    if (typeof title !== 'string' || typeof content !== 'string' || typeof category !== 'string' || !Array.isArray(tags)) {
        return res.status(400).send("Los datos son incorrectos, revísalos");
    }

    //insertar en la base de datos
    try {
        const [result] = connection.execute(
            'INSERT INTO post (title, content, category, createdAt) VALUES (?, ?, ?, ?, ?)',
            [title, content, category, now()]
        );

        const postId = result.insertId;

        //si es correcto, me devuelve el id, lo cojo y hago un select para devolver el post entero
        if (postId){
            const [rows] = connection.execute('SELECT * FROM post WHERE id = ?', [postId]);
            //return res.status(201).json(rows[0]);
            for (const tag of tags) {
                const [result] = connection.execute(
                    'SELECT id FROM tag WHERE tag = ?', [tag]);
                
                const tagId = result.insertId;

                if (tagId) {
                    const [result2] = connection.execute(
                        'INSERT INTO post_tag (postId, tagId) VALUES (?, ?)',
                        [postId, tagId]
                    );
                }else{
                    const [result3] = connection.execute(
                        'INSERT INTO tag (tag) VALUES (?)',
                        [tag]
                    );
                    const tagId = result3.insertId;
                    const [result4] = connection.execute(
                        'INSERT INTO post_tag (postId, tagId) VALUES (?, ?)',
                        [postId, tagId]
                    );
                }
            }
        }
        
    } catch (error) {
        console.error('Error al insertar en la base de datos:', error);
        throw error;
    }


    return res.status(201).send("Created");
});

export default router;