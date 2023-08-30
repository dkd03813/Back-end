const { Profile, Song, Album, ProfileSong } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');


const songGet = async (req, res) => {
  const userProfileID = req.user.id;
  const limit = 21; // Number of songs displayed per page.
  const page = req.query.page ? Number(req.query.page) : 1; // Page number, defaults to 1 if not provided.
  const offset = (page - 1) * limit;

  // Fetch the total count of songs and the songs for the current page.
  const { count, rows: songs } = await Song.findAndCountAll({
    attributes: { exclude: ['ArtistId', 'songID'] },
    include: {
      model: Album,
      attributes: ['albumCover', 'genre']
    },
    offset,
    limit
  });

  res.render('song', {
    title: "Songs",
    songs,
    userProfileID,
    page,
    limit,
    count // Pass the total count to the template.
  });
};

const songSearchPost = async (req, res) => {
  const { textbox } = req.body;
  const userProfileID = req.user.id;
  const limit = 21;
  const page = req.query.page ? Number(req.query.page) : 1;
  const offset = (page - 1) * limit;

  const { count, rows: songs } = await Song.findAndCountAll({
    where: {
      songName: { [Op.iLike]: '%' + textbox + '%' }
    },
    attributes: { exclude: ['ArtistId', 'songID'] },
    include: {
      model: Album,
      attributes: ['albumCover', 'genre']
    },
    offset,
    limit
  });

  res.render('song', {
    title: "Songs",
    songs,
    limit,
    count,
    page,
    userProfileID,
    // Add other necessary data here
  });
}

/* The songPost renders all songs that contain the search bar results. */
//  More info: The iLike here allows us to search without case sensitive. The percentage signs plus textbox will bring up any song with the word you type in. The percentage signs say 'I dont care whats on the left or right of it' in SQL queries. Ex: You type in bomb and get Bombtrack, Car Bomb, Bombs Away, etc.
  const songPost = async (req, res) => {
    userProfileID = req.user.id
    console.log('User Profile ID:', userProfileID);
    try {
      const { songID, profileID } = req.body;
  
      // Find the user's profile by ID
      const userProfile = await Profile.findByPk(profileID);
      if (!userProfile) {
        return res.status(404).json({ error: 'User profile not found.' });
      }
  
     // Find the song and associated album by ID
const song = await Song.findByPk(songID, {
  attributes: ['id', 'songName'], // Include only the required attributes
  include: [{
    model: Album,
    attributes: ['albumCover']
  }]
});
if (!song) {
  return res.status(404).json({ error: 'Song not found.' });
}
if (!song.Album) {
  return res.status(404).json({ error: 'Album not found.' });
}
  
      // Check if the association already exists
      const existingAssociation = await ProfileSong.findOne({
        where: {
          profileID: userProfile.id,
          songID: song.id,
        },
      });
  
      if (existingAssociation) {
        // The association already exists, do not create a duplicate
        return res.status(409).json({ error: 'Song already in favorites.' });
      }
  
      // Create the association between the profile and the album
      await ProfileSong.create({
        profileID: userProfile.id,
        songID: song.id,
        songName: song.songName,
        albumCover: song.Album.albumCover,
      });
  
      return res.status(200).json({ message: 'Song successfully added to favorites!' });
    } catch (error) {
      console.error('Error while adding song to favorites:', error);
      return res.status(500).json({ error: 'An error occurred while adding the album to favorites.' });
    }
  }

  const songFavsGet = async (req, res) => {
    try {
        userProfileID = req.user.id;
        console.log('User Profile ID:', userProfileID);

        const userProfile = await Profile.findByPk(userProfileID, {
            include: [
                {
                    model: Song,
                    as: 'favoriteSongs',
                    attributes: ['id', 'songName'],
                    include: { // This is the key change here
                        model: Album,
                        attributes: ['albumCover']
                    },
                    through: { attributes: [] },
                },
            ],
        });

        if (!userProfile) {
            return res.status(404).send('User profile not found.');
        }

        console.log('Favorite Songs:', userProfile.favoriteSongs);

        res.render('favSongs', {
            title: 'Favorite Songs',
            favoriteSongs: userProfile.favoriteSongs,
            profileID: userProfileID
        });
    } catch (error) {
        console.error('Error while retrieving favorite songs:', error);
        res.sendStatus(500);
    }
};


module.exports = {
  songGet,
  songPost,
  songSearchPost,
  songFavsGet
  // songFavsPost,
  // songFavsGet
}