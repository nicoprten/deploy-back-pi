require('dotenv').config();
const { default: axios } = require("axios");
const { API_KEY} = process.env;
const { Videogame, Genre } = require('./../db'); 

const filterDataGame = (dataGame) => {
    const gamesFiltered = dataGame.map(game => {
        return {
            id: game.id, 
            name: game.name, 
            image: game.background_image,
            genres: game.genres.map(genre => genre.name),
            rating: game.rating,
            createInDb: false
            // platforms: Array.isArray(game.platforms) ? game.platforms.map(platform => platform.platform.name) : 'No information'
        }
    });
    let obj = {};
    const gamesNoRepeated = gamesFiltered.filter( (game) => {
        if(!obj[game.id]){
            obj[game.id] = game.name;
            return game;
        }
    })
    return gamesNoRepeated;
}

const getAllApi = async () => {
    const games01 = await axios.get(`https://api.rawg.io/api/games?key=${API_KEY}&page_size=40`);
    const games02 = await axios.get(`https://api.rawg.io/api/games?key=${API_KEY}&page=2&page_size=40`);
    const games03 = await axios.get(`https://api.rawg.io/api/games?key=${API_KEY}&page=2&page_size=20`);
    const initialGames = filterDataGame(games01.data.results.concat(games02.data.results).concat(games03.data.results));
    return initialGames;
}


// const getAllDb = async () => {
//     const gamesDb = await Videogame.findAll(
//         {
//             include: [{
//                 model: Genre,
//                 attributes: ['name']
//             }],
//             attributes: ['id', 'name', 'image', 'createInDb']
//         }
//     );
//     return gamesDb;
// }

const getAllDb = async () => {
    const genres = await Videogame.findAll(
        {
        include: {
            model: Genre,
            attributes: ["name"],
            through: {
                attributes: []
            }
        }
    }
    );

    const allDbGames = genres.map (e => {
        return {
            id : e.id,
            name : e.name,
            description: e.description,
            releaseDate: e.released,
            rating: e.rating,
            platform: e.platforms,
            image: e.image,
            genres: e.genres.map(e => e.name),
            createInDb: true
    }})
    ;   
    return allDbGames;
};

const getAll = async () => {
    const gamesFromApi = await getAllApi();
    const gamesFromDb = await getAllDb();
    return [...gamesFromApi, ...gamesFromDb];
    // return gamesFromDb.concat(gamesFromApi);
}

const getGameByName = async (name) => {
    if(name){
        const games = await axios.get(`https://api.rawg.io/api/games?key=${API_KEY}&search=${name}&page_size=15`);
        const gamesFromApi = games.data.results;
        const gamesFromDb = await getAllDb();
        const gamesDbByName = await gamesFromDb.filter((e) => e.name.toLowerCase().includes(name));
        const allGamesByName = gamesFromApi.concat(gamesDbByName);
        console.log("dbnn", allGamesByName)
        return filterDataGame(allGamesByName);
    }
}

const getGameDetail = async (id, createInDb) => {
    if(createInDb === 'true') {
        let gameDetail = await Videogame.findByPk(
            id,
            {
                include: [{
                    model: Genre,
                    attributes: ['name']
                }],
                attributes: ['id', 'name', 'description', 'released', 'rating', 'platforms', 'image', 'createInDb']
            }
            );

        return gameDetail
    }else{
        gameDetail = await axios.get(`https://api.rawg.io/api/games/${id}?key=${API_KEY}`);
        let gameFiltered = {
            id: gameDetail.data.id, 
            name: gameDetail.data.name, 
            image: gameDetail.data.background_image,
            genres: gameDetail.data.genres.map(genre => genre.name),
            description: gameDetail.data.description,
            released: gameDetail.data.released,
            rating: gameDetail.data.rating,
            platforms: Array.isArray(gameDetail.data.platforms) ? gameDetail.data.platforms.map(platform => platform.platform.name) : 'No information',
            createInDb: false
        }
        return gameFiltered;
    }
    
}

const getGenre = async () =>{
    const genreDb = await Genre.findAll();
    if(genreDb.length > 0){
        return genreDb;
    }else{
        const genres = await axios.get(`https://api.rawg.io/api/genres?key=${API_KEY}`);
        const finalGenres = genres.data.results.map(genre => genre.name);
        const newGenres = [];
        finalGenres.forEach(async (genre) => {
            newGenres.push(
                await Genre.create(
                    {name: genre}
                )
            )
        })
        return newGenres;
    }
}

module.exports = {
    getAll,
    getGameByName,
    getGameDetail,
    getGenre
};