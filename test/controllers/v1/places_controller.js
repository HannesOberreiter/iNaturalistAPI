const { expect } = require( "chai" );
const PlacesController = require( "../../../lib/controllers/v1/places_controller" );

describe( "PlacesController", ( ) => {
  describe( "nearbyQueryBody", ( ) => {
    it( "community queries use min area of 1.5", ( ) => {
      const req = {
        query: {
          community: true,
          nelat: 0.0001,
          nelng: 0.00011,
          swlat: 0.0001,
          swlng: 0.00011
        }
      };
      const body = PlacesController.nearbyQueryBody( req );
      const filters = body.query.bool.filter;
      expect( filters ).to.deep.include( { range: { bbox_area: { lte: 1.5, gt: 0 } } } );
    } );

    it( "limits max latitude to 90", ( ) => {
      const req = {
        query: {
          community: true,
          nelat: 100,
          nelng: 100,
          swlat: 100,
          swlng: 100
        }
      };
      const body = PlacesController.nearbyQueryBody( req );
      const filters = body.query.bool.filter;
      expect( filters ).to.deep.include( {
        geo_shape: {
          geometry_geojson: {
            shape: {
              type: "envelope",
              coordinates: [
                [100, 90],
                [100, 90]
              ]
            }
          }
        }
      } );
    } );

    it( "limits min latitude to -90", ( ) => {
      const req = {
        query: {
          community: true,
          nelat: -100,
          nelng: -100,
          swlat: -100,
          swlng: -100
        }
      };
      const body = PlacesController.nearbyQueryBody( req );
      const filters = body.query.bool.filter;
      expect( filters ).to.deep.include( {
        geo_shape: {
          geometry_geojson: {
            shape: {
              type: "envelope",
              coordinates: [
                [-100, -90],
                [-100, -90]
              ]
            }
          }
        }
      } );
    } );

    it( "limits min latitude to -90", ( ) => {
      const req = {
        query: {
          name: "Massachusetts",
          nelat: 0.0001,
          nelng: 0.00011,
          swlat: 0.0001,
          swlng: 0.00011
        }
      };
      const body = PlacesController.nearbyQueryBody( req );
      const { filter } = body.query.bool;
      expect( filter ).to.deep.include( {
        match: {
          display_name_autocomplete: "Massachusetts"
        }
      } );
    } );
  } );
} );
