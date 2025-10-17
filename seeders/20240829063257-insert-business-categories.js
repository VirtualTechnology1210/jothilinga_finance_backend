"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Insert into business_categories with explicit IDs
    await queryInterface.bulkInsert(
      "business_categories",
      [
        {
          id: 1,
          business_category: "Agri and Agri allied",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          business_category: "Service",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 3,
          business_category: "Manufacturing",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 4,
          business_category: "Others",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );

    // Insert into nature_of_business using the explicit IDs
    await queryInterface.bulkInsert(
      "nature_of_business",
      [
        {
          businessCategoryId: 1,
          natureOfBusiness: "Dairy",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 1,
          natureOfBusiness: "Cattles",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 1,
          natureOfBusiness: "Poultry",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Petty Shop",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Super market",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Vegetable and fruits shop",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Kirana shop",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Tea shop",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Hotel",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Bakery",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Juice shop",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Mobile shop",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Laptop and desktop sales and service",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Automobile accessory shop",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Bike and car service",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Painting and tinkering shop",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Xerox shop",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Stationary shop",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Book shop",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Fancy and gift store",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Slipper store",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Saloon shop",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Beauty parlour",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Spa",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 2,
          natureOfBusiness: "Medical shop",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 3,
          natureOfBusiness: "Garments",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 3,
          natureOfBusiness: "Plastic wear",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 3,
          natureOfBusiness: "Steel and Furniture",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 3,
          natureOfBusiness: "Timber and wood and Carboard",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 3,
          natureOfBusiness: "Lathe and turning",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          businessCategoryId: 3,
          natureOfBusiness: "Automobile accessory",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    // First, delete from nature_of_business
    await queryInterface.bulkDelete("nature_of_business", null, {});

    // Then, delete from business_categories
    await queryInterface.bulkDelete("business_categories", null, {});
  },
};
