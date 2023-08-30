const { ProfileAlbum, Album, Profile } = require("../models");
const { Op } = require("sequelize");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const albumGet = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 21; // or the number you prefer
  const offset = (page - 1) * limit;

  const albums = await Album.findAndCountAll({
    offset: offset,
    limit: limit,
  });

  const userProfileID = req.user.id;

  const totalPages = Math.ceil(albums.count / limit);

  res.render("album", {
    title: "Albums",
    albums: albums.rows,
    userProfileID,
    page,
    count: albums.count,
    limit,
    totalPages,
  });
};

const albumSearchPost = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 21; // or the number you prefer
  const offset = (page - 1) * limit;

  const { textbox } = req.body;
  
  const albums = await Album.findAll({
    where: {
      albumName: { [Op.iLike]: "%" + textbox + "%" },
    },
  });

  const totalPages = Math.ceil(albums.count / limit);

  userProfileID = req.user.id;

  res.render("album", {
    title: "Albums",
    albums,
    page,
    count: albums.count,
    totalPages,
    limit,
    offset,
    userProfileID,
  });
};

const albumPost = async (req, res) => {
  const userProfileID = req.user.id;
  console.log("User Profile ID:", userProfileID);
  try {
    const { albumID, profileID } = req.body;

    // Find the user's profile by ID
    const userProfile = await Profile.findByPk(profileID);
    if (!userProfile) {
      return res.status(404).json({ error: "User profile not found." });
    }

    // Find the album by ID
    const album = await Album.findByPk(albumID, {
      attributes: ["id", "albumName", "albumCover"], // Include only the required attributes
    });
    if (!album) {
      return res.status(404).json({ error: "Album not found." });
    }

    // Check if the association already exists
    const existingAssociation = await ProfileAlbum.findOne({
      where: {
        profileID: userProfile.id,
        albumID: album.id,
      },
    });

    if (existingAssociation) {
      // The association already exists, do not create a duplicate
      return res.status(409).json({ error: "Album already in favorites." });
    }

    // Create the association between the profile and the album
    await ProfileAlbum.create({
      profileID: userProfile.id,
      albumID: album.id,
      albumName: album.albumName,
      albumCover: album.albumCover,
    });

    return res
      .status(200)
      .json({ message: "Album successfully added to favorites!" });
  } catch (error) {
    console.error("Error while adding album to favorites:", error);
    return res.status(500).json({
      error: "An error occurred while adding the album to favorites.",
    });
  }
};

const albumFavsGet = async (req, res) => {
  try {
    userProfileID = req.user.id;
    console.log("User Profile ID:", userProfileID);

    const userProfile = await Profile.findByPk(userProfileID, {
      include: [
        {
          model: Album,
          as: "favoriteAlbums",
          attributes: [
            "id",
            "albumName",
            "albumDate",
            "albumCover",
            "songList",
          ],
          through: { attributes: [] },
        },
      ],
    });

    if (!userProfile) {
      return res.status(404).send("User profile not found.");
    }

    console.log("Favorite Albums:", userProfile.favoriteAlbums);

    res.render("favAlbums", {
      title: "Favorite Albums",
      favoriteAlbums: userProfile.favoriteAlbums,
      profileID: userProfileID,
    });
  } catch (error) {
    console.error("Error while retrieving favorite albums:", error);
    res.sendStatus(500);
  }
};

module.exports = {
  albumGet,
  albumPost,
  albumFavsGet,
  albumSearchPost,
  albumFavsGet,
};
