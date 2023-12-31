'use strict';

// When running the seeder command it needs to be name of Database table and not the models files! 

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Artists', [{
    artistName: 'test Artist Name',
    artistImage: 'test Artist image',
    artistAge: 27,
    profileID: 1,
    createdAt: new Date(),
    updatedAt: new Date() 
  }]);
},
down: (queryInterface, Sequelize) => {
  return queryInterface.bulkDelete('Artists', null, {});
  }
};
