const Joi = require( "joi" );
const transform = require( "../../../../joi_to_openapi_parameter" );
const UsersController = require( "../../../../../lib/controllers/v2/users_controller" );

module.exports = sendWrapper => {
  async function POST( req, res ) {
    await UsersController.mute( req );
    sendWrapper( req, res, null, null );
  }

  POST.apiDoc = {
    tags: ["Users"],
    summary: "Mute a user",
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
        description: "No response body; success implies creation"
      }
    }
  };

  async function DELETE( req, res ) {
    await UsersController.unmute( req );
    sendWrapper( req, res, null, null );
  }

  DELETE.apiDoc = {
    tags: ["Users"],
    summary: "Remove a user mute",
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
        description: "No response body; success implies deletion"
      }
    }
  };

  return {
    POST,
    DELETE
  };
};
