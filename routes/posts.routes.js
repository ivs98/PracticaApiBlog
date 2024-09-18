import { Router } from 'express';
import connectDB from '../config/database.js';

const router = Router();

//TAREA 1: Crear una entrada de blog
router.post('/', async (req, res) => {
    const { title, content, category, tags } = req.body;

    //comprobaciones de los datos que llegan
    if (!validateData(title, content, category, tags)) {
        return res.status(400).send("Bad Request"); //cuando los datos no son correctos, hay errores de validación
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
        if ( validateId(postId)) {//comprobar que es un número y que no es undefined
            //Insertar los tags
            /* for (const tag of tags) {
                const [result] = await connection.execute(
                    'SELECT id FROM tag WHERE tag = ?', [tag]);
                
                let tagId;
                if(result.length){ //El tag exista
                    tagId = result[0].id;
                }else{
                    //Si no existe
                    const [result2] = await connection.execute(
                        'INSERT INTO tag (tag) VALUES (?)',
                        [tag]
                    );
                    tagId = result2.insertId;
                }

                await connection.execute(
                    'INSERT INTO post_tag (id_post, id_tag) VALUES (?, ?)',
                    [postId, tagId]
                );
            } */
            insertTags(connection, tags, postId);
            
            await connection.commit();

            //Select para obtener los datos del post introducido
            const [rows] = await connection.execute('SELECT * FROM post WHERE post.id = ?', [postId]);
           
            return res.status(201).json({
                id: rows[0].id,
                title: rows[0].title,
                content: rows[0].content,
                category: rows[0].category,              
                tags,
                createdAt: rows[0].createdAt,
                updatedAt: rows[0].updatedAt
            });
        }
        
    } catch (error){
        await connection.rollback();
        console.error('Error al insertar en la base de datos:', error);
        return res.status(400).send("Bad Request");
    }

    return res.status(201).send("Created");
});

//TAREA 2: Actualizar post del blog
router.put('/:id_post', async (req, res) => {
    const { title, content, category, tags } = req.body;
    const { id_post } = req.params;

    if (!validateData(title, content, category, tags)) {
        return res.status(400).send("Bad Request"); //cuando los datos no son correctos, hay errores de validación
    }

    if (!validateId(id_post)) {
        return res.status(404).send("Not Found"); //cuando no encuentra el id
    }

    let connection;
    try {
        connection = await connectDB();
        await connection.beginTransaction();

        //Actualizar post
        await connection.query(
            'UPDATE post SET title = ?, content = ?, category = ? WHERE id = ?',
            [title, content, category, id_post]
        );

        //borrar tags
        await connection.query(
            'DELETE FROM post_tag WHERE id_post = ?',
            [id_post]
        );

        //Insertar tags de nuevo
        await insertTags(connection, tags, id_post);

        await connection.commit();

        //Select para obtener los datos del post introducido
        const [rows] = await connection.execute('SELECT * FROM post WHERE post.id = ?', 
            [id_post]
        );
           
        return res.status(200).json({
            id: rows[0].id,
            title: rows[0].title,
            content: rows[0].content,
            category: rows[0].category,              
            tags,
            createdAt: rows[0].createdAt,
            updatedAt: rows[0].updatedAt
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error al conectar a la base de datos:', error);
        return res.status(400).send("Bad Request");
    }
});

//TAREA 3: Borrar un post del blog
router.delete('/:id_post', async (req, res) => {
    const { id_post } = req.params;

    if (!validateId(id_post)) {
        return res.status(400).send("Bad Request"); //cuando el dato no es correcto
    }

    let connection;
    try {
        connection = await connectDB();
        await connection.beginTransaction();

        //comprobar que el id existe en la bbdd
        await checkId(connection, id_post);

        //borrar post (delete cascade para los tags)
        await connection.query(
            'DELETE FROM post WHERE id = ?',
            [id_post]
        );

        await connection.commit();

        return res.status(204).send("No Content");

    } catch (error) {
        await connection.rollback();
        console.error('Error al conectar a la base de datos:', error);
        return res.status(400).send("Bad Request");
    }
});


//TAREA 4: Obtener un post del blog
router.get('/:id_post', async (req, res) => {
    const { id_post } = req.params;

    if (!validateId(id_post)) {
        return res.status(400).send("Bad Request"); //cuando el dato no es correcto
    }

    let connection;
    try {
        connection = await connectDB();
        //await connection.beginTransaction();

        //comprobar que el id existe en la bbdd
        await checkId(connection, id_post);

        //Select para obtener los datos del post introducido en la ruta
        const [rows] = await connection.execute('SELECT * FROM post WHERE post.id = ?', 
            [id_post]
        );

        //Select para obtener los tags del post
        let tags = await getTags(connection, id_post);
        
        return res.status(200).json({
            id: rows[0].id,
            title: rows[0].title,
            content: rows[0].content,
            category: rows[0].category,              
            tags,
            createdAt: rows[0].createdAt,
            updatedAt: rows[0].updatedAt
        });

    } catch (error) {
        //await connection.rollback();
        console.error('Error al conectar a la base de datos:', error);
        return res.status(400).send("Bad Request");
    }
});

//TAREA 5: Obtener todas las entradas de blog + filtros en la búsqueda
router.get('/', async (req, res) => {
    const { term } = req.query;

    let connection;
    try {
        connection = await connectDB();

        let query = 'SELECT * FROM post';
        let queryParams = [];

        /**
         *  La ruta ahora acepta un parámetro de consulta term que se utiliza para buscar en 
         * los campos de título, contenido o categoría.
         */
        if (term) {
            query += ' WHERE title LIKE ? OR content LIKE ? OR category LIKE ?';
            const wildcardTerm = `%${term}%`;
            queryParams = [wildcardTerm, wildcardTerm, wildcardTerm];
        }

        // Select para obtener todos los posts o los posts filtrados
        const [rows] = await connection.execute(query, queryParams);

        let posts = [];
        for (const row of rows) {
            let tags = await getTags(connection, row.id);

            //vamos añadiendo los posts al array
            posts.push({
                id: row.id,
                title: row.title,
                content: row.content,
                category: row.category,              
                tags,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt
            });
        }

        //devolvemos el array de posts
        return res.status(200).json(posts);

    } catch (error) {
        console.error('Error al conectar a la base de datos:', error);
        return res.status(500).send("Internal Server Error");

    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

//FUNCIONES:

/**
 * Validar datos:
 * @param {string} title - El título del post
 * @param {string} content - El contenido del post
 * @param {string} category - La categoría del post
 * @param {Array<string>} tags - Los tags del post
 * @returns {boolean}
 * true: si los datos son correctos
 * false: si los datos no son correctos
 */
function validateData(title, content, category, tags) {
    //comprobar que los datos no son undefined
    if (!title || !content || !category || !tags) {
        return false;
    }

    //comprobar que los datos son del tipo correcto
    if (typeof title !== 'string' || typeof content !== 'string' || typeof category !== 'string' || !Array.isArray(tags)) {
        return false;
    }

    //comprobar que los datos no están vacíos
    if (title.trim() === '' || content.trim() === '' || category.trim() === '' || tags.length === 0) {
        return false;
    }

    //comprobar que los tags son strings
    for (const tag of tags) {
        if (typeof tag !== 'string' || tag.trim() === '') {
            return false;
        }
    }

    return true;
}

/**
 * Validar id de post:
 * @param {number} id_post - El id del post a validar
 * @returns {boolean} 
 * true: si el ID es válido
 * false: si el ID no es válido
 */
function validateId(id_post) {
    if (id_post !== undefined && isNaN(id_post) === false ) { //comprobar que el id es un número y que no es undefined
        return true;
    }

    return false;
}

/**
 * Insertar tags:
 * @param {mysql.Connection} connection - La conexión a la base de datos
 * @param {Array<string>} tagsArray - Una lista de tags a insertar
 * @param {number} id_post - El id del post al que se asociarán los tags
 * @returns {Promise<void>}
 */
async function insertTags(connection, tagsArray, id_post) {
    for (const tag of tagsArray) {
        const [result] = await connection.execute(
            'SELECT id FROM tag WHERE tag = ?',
            [tag]
        );
        
        let tagId;
        if(result.length){ //si el tag existe
            tagId = result[0].id;
            
        }else{ //si no existe
            const [result2] = await connection.execute(
                'INSERT INTO tag (tag) VALUES (?)',
                [tag]
            );
            tagId = result2.insertId;
        }

        await connection.execute(
            'INSERT INTO post_tag (id_post, id_tag) VALUES (?, ?)',
            [id_post, tagId]
        );
    }
}

 // función comprobar que el id existe en la bbdd
async function checkId(connection, id_post) {
    const [result] = await connection.query(
        'SELECT * FROM post WHERE id = ?',
        [id_post]
    );

    //compruebo la longitud del select, si no existe, false
    if (result.length === 0) {
        return false;
    }

    return true;
}

//función para obtener los tags de un post
async function getTags(connection, id_post) {
    const [result] = await connection.query(
        'SELECT tag FROM tag JOIN post_tag ON tag.id = post_tag.id_tag WHERE post_tag.id_post = ?',
        [id_post]
    );
    /**
     * La función getTags ejecuta una consulta a la base de datos para obtener los tags.
    La consulta devuelve un array de objetos, donde cada objeto representa una fila de la tabla de tags.
    La función map se utiliza para transformar este array de objetos en un array de valores de la propiedad tag de cada objeto.
    */
    return result.map(row => row.tag);
}

//Borrar tags
/* async function deleteTags(connection, id_post) {
    await connection.query(
        'DELETE FROM post_tag WHERE id_post = ?',
        [id_post]
    );    
} */

//Insertar en la base de datos
//Actualizar en la base de datos
//Borrar en la base de datos
//Obtener de la base de datos


export default router;