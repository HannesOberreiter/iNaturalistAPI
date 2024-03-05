const Joi = require( "joi" );
const transform = require( "../../../joi_to_openapi_parameter" );
const PhotosController = require( "../../../../lib/controllers/v2/photos_controller" );

module.exports = sendWrapper => {
  async function PUT( req, res ) {
    const results = await PhotosController.update( req );
    sendWrapper( req, res, null, results );
  }

  PUT.apiDoc = {
    tags: ["Photos"],
    summary: "Update a photo",
    security: [{
      userJwtRequired: []
    }],
    parameters: [
      transform(
        Joi.number( ).integer( )
          .label( "id" )
          .meta( { in: "path" } )
          .required( )
          .description( "A single ID" )
      )
    ],
    responses: {
      200: {
        description: "An array of photos.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsPhotos"
            }
          }
        }
      },
      default: {
        $ref: "#/components/responses/Error"
      }
    }
  };

  return {
    PUT
  };
};
