const db = require("../models");

module.exports = getModelData = async (req, res) => {
  try {
    const { modelName } = req.params;
    const {
      filter,
      limit,
      offset,
      fields,
      exclude,
      includeDepth,
      notInclude,
      includeModels,
    } = req.query; // includeDepth to control depth

    const relationshipType = req.query.relationshipType || "parentToChild";
    // Parse includeModels if provided, expected format: ["Model1", "Model2.SubModel1", "Model3"]
    const allowedModels = includeModels ? JSON.parse(includeModels) : null;

    // Check if the model exists in Sequelize
    const model = db[modelName];
    if (!model) {
      return res.status(404).json({ error: `Model '${modelName}' not found` });
    }

    // Get the associations for the model
    const associations = model.associations;

    // Default depth control to limit recursion depth
    const maxDepth = includeDepth ? parseInt(includeDepth) : 0;

    // Helper function to build the include array with depth control
    const buildIncludeArray = (associations, depth, relationshipType, parentPath = '') => {
      if (depth <= 0) return [];

      return Object.keys(associations)
        .filter((associationKey) => {
          const association = associations[associationKey];
          const currentPath = parentPath
            ? `${parentPath}.${association.as}`
            : association.as;

          // First, check if this model is allowed based on includeModels
          if (allowedModels) {
            const isAllowed = allowedModels.some((path) => {
              // Check if the current association path matches the allowed path
              // or if it's a parent path of an allowed nested association
              return path === currentPath || path.startsWith(`${currentPath}.`);
            });
            if (!isAllowed) return false;
          }

          // Then apply relationship type filter
          if (relationshipType === "parentToChild") {
            return (
              association.associationType === "HasOne" ||
              association.associationType === "HasMany"
            );
          } else if (relationshipType === "childToParent") {
            return association.associationType === "BelongsTo";
          } else if (relationshipType === "both") {
            return (
              association.associationType === "HasOne" ||
              association.associationType === "HasMany" ||
              association.associationType === "BelongsTo"
            );
          }
          return true;
        })
        .map((associationKey) => {
          const association = associations[associationKey];
          const currentPath = parentPath
            ? `${parentPath}.${association.as}`
            : association.as;

          const nestedIncludes = buildIncludeArray(
            association.target.associations,
            depth - 1,
            relationshipType,
            currentPath
          );

          return {
            model: association.target,
            as: association.as,
            include: nestedIncludes,
          };
        });
    };

    // Update the buildIncludeArray call to include the parentPath parameter
    // Build the include array (single declaration)
    const includeArray = buildIncludeArray(
      associations,
      maxDepth,
      relationshipType,
      ''
    );

    // Prepare query options
    const queryOptions = {
      include: includeArray,
      where: filter ? JSON.parse(filter) : {}, // Apply filters from the query string
      offset: offset ? parseInt(offset) : 0, // Default offset to 0
    };

    if (limit) {
      queryOptions.limit = parseInt(limit); // Apply limit if present
    }

    // If fields are specified, add them to the query options
    // if (fields) {
    //   queryOptions.attributes = fields.split(","); // Split the fields by comma
    // }
    if (fields) {
      const mainAttributes = [];
      const childAttributes = {};

      fields.split(",").forEach((field) => {
        if (field.includes(".")) {
          // Child attribute (e.g., childModel.childField)
          const [childModelName, childField] = field.split(".");
          if (!childAttributes[childModelName]) {
            childAttributes[childModelName] = [];
          }
          childAttributes[childModelName].push(childField);
        } else {
          // Main model attribute
          mainAttributes.push(field);
        }
      });

      // Set attributes for the main model
      queryOptions.attributes = mainAttributes.length
        ? mainAttributes
        : undefined;

      // Add attributes for child models in include array
      const setChildAttributes = (includes) => {
        return includes.map((include) => {
          if (childAttributes[include.as]) {
            include.attributes = childAttributes[include.as];
          }
          if (include.include) {
            include.include = setChildAttributes(include.include);
          }
          return include;
        });
      };

      queryOptions.include = setChildAttributes(queryOptions.include || []);
    }

    // If exclude is specified, use it to exclude fields
    if (exclude) {
      // Set the `exclude` fields in the `attributes` option for exclusion
      queryOptions.attributes = queryOptions.attributes || {};
      queryOptions.attributes.exclude = exclude.split(","); // Specify the fields to exclude
    }

    if (notInclude) {
      const exclusions = JSON.parse(notInclude); // Expects JSON like {"fieldName": ["value1", "value2"]}
      for (const field in exclusions) {
        queryOptions.where[field] = {
          [db.Sequelize.Op.notIn]: exclusions[field], // Sequelize operator for 'not in'
        };
      }
    }

    // Fetch data with associations, filters, and pagination
    const data = await model.findAll(queryOptions);

    // console.log(model + " data: " + JSON.stringify(data));

    // Return the data along with the model name
    return res.status(200).json({ model: modelName, data });
  } catch (error) {
    console.error("Error fetching model data:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
