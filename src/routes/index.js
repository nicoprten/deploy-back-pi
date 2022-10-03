const { Router } = require('express');
const { getAll, getGameByName, getGameDetail, getGenre } = require('./controlers');
const { Videogame, Genre } = require('./../db'); 
const { default: axios } = require('axios');
const { API_KEY} = process.env;
// Importar todos los routers;
// Ejemplo: const authRouter = require('./auth.js');


const router = Router();

// Configurar los routers
// Ejemplo: router.use('/auth', authRouter);
router.get('/videogames', async (req, res)=>{
    try{
        let { name } = req.query;
        if(name){
            const gamesName = await getGameByName(name);
            if(gamesName.length > 0){
                res.send(gamesName);
            }else{
                res.send('No games found.');
            }
        }else{
            const gamesApi = await getAll();
            res.send(gamesApi);
        }
    }
    catch(err){
        res.status(400).send(err);
    }
})

router.get('/videogame/:idGame/:createInDb', async (req, res) => {
    try{
        let { idGame, createInDb } = req.params;
        console.log(idGame)
        if(idGame){
            const gameDetail = await getGameDetail(idGame, createInDb);
            res.send(gameDetail);
        }else{
            res.send('There is no game detail available.');
        }
    }catch(err){
        res.send('There is no game detail available.');
    }
})

router.get('/genres', async (req, res) => {
    try{
        const genres = await getGenre();
        res.send(genres);
    }catch(err){
        return err;
    }
})

router.post('/videogames', async (req, res) =>{
    const {name, description, date, rating, platforms, image, genres} = req.body;
    const newGame = await Videogame.create({
        name, 
        description,
        released: date,
        rating,
        platforms,
        image
    });
    const genresDb = await Genre.findAll({
        where: {
            name: genres
        }
    });
    newGame.addGenre(genresDb);
    return res.status(200).send('New game created.');

})

module.exports = router;
