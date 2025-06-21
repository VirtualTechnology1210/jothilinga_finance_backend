"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "nature_of_business",
      [
        {
          businessCategoryId: 1,
          natureOfBusiness: "Agri",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Hardware",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Electrical and electronic shop",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Rice and Flour Mill",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Scrap Shop",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Timber, wood and Carpenter work",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Bricks and Hallow block",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Ironing and Laundry shop",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Tailoring",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Photo Studio and Frame works",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Traders",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Furniture",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Browsing and E-sevai",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Water wash service",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Milk Products",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Chicken, mutton and fish stall",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Textiles and Readymade",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Metal, steel and plastic vessels shop",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Rice and Oil shop",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Fertilizer shop",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Pet and Aquarium shop",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Nursery Garden",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Watch and service shop",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Construction Materials",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Batteries shop",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Home appliances service",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Water can Suppliers",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    // Delete only the records inserted by this migration
    await queryInterface.bulkDelete("nature_of_business", {
      natureOfBusiness: [
        "Agri",
        "Hardware",
        "Electrical and electronic shop",
        "Rice and Flour Mill",
        "Scrap Shop",
        "Timber, wood and Carpenter work",
        "Bricks and Hallow block",
        "Ironing and Laundry shop",
        "Tailoring",
        "Photo Studio and Frame works",
        "Traders",
        "Furniture",
        "Browsing and E-sevai",
        "Water wash service",
        "Milk Products",
        "Chicken, mutton and fish stall",
        "Textiles and Readymade",
        "Metal, steel and plastic vessels shop",
        "Rice and Oil shop",
        "Fertilizer shop",
        "Pet and Aquarium shop",
        "Nursery Garden",
        "Watch and service shop",
        "Construction Materials",
        "Batteries shop",
        "Home appliances service",
        "Water can Suppliers",
      ],
    });
  },
};
