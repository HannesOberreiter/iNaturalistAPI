var expect = require( "chai" ).expect,
    request = require( "supertest" ),
    iNaturalistAPI = require( "../../../lib/inaturalist_api" ),
    fs = require( "fs" ),
    _ = require( "lodash" );
    app = iNaturalistAPI.server( );

var fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

describe( "Places", function( ) {

  describe( "nearby", function( ) {
    it( "returns json", function( done ) {
      request( app ).get( "/v1/places/nearby" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "returns standard and community places", function( done ) {
      request( app ).get( "/v1/places/nearby?swlat=41&swlng=-73&nelat=43&nelng=-70" ).
        expect( function( res ) {
          const places = _.filter( fixtures.elasticsearch.places.place, p => !_.isNil( p.geometry_geojson ) );
          const standardPlaces = _.filter( places, p => p.admin_level !== null );
          const communityPlaces = _.filter( places, p => p.admin_level === null );
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( places.length );
          expect( res.body.total_results ).to.eq( places.length );
          expect( res.body.results.standard.length ).to.eq( standardPlaces.length );
          expect( res.body.results.community.length ).to.eq( communityPlaces.length );
          expect( res.body.results.standard[ 0 ].name ).to.eq( "United States" );
          expect( res.body.results.standard[ 1 ].name ).to.eq( "Massachusetts" );
          expect( res.body.results.community[ 0 ].name ).to.eq( communityPlaces[0].name );
        }).expect( "Content-Type", /json/ ).expect( 200, done );
    });
  });

  describe( "show", function( ) {
    it( "returns json", function( done ) {
      request( app ).get( "/v1/places/1" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "returns projects by slug", function( done ) {
      request( app ).get( "/v1/places/united-states" ).
        expect( function( res ) {
          expect( res.body.results[0].slug ).to.eq( "united-states" );
        }
      ).expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "validates format of IDs", function( done ) {
      request( app ).get( "/v1/places/haw.ii" ).
        expect( function( res ) {
          expect( res.body.error ).to.eq( "Error" );
          expect( res.body.status ).to.eq( 422 );
        }).expect( "Content-Type", /json/ ).expect( 422, done );
    });

    it( "returns an error if too many IDs are requested", function( done ) {
      var ids = [ ], count = 501;
      for( var i = 1 ; i <= count ; i++ ) {
        ids.push( i );
      }
      request( app ).get( "/v1/places/" + ids.join( "," ) ).
        expect( function( res ) {
          expect( res.body.error ).to.eq( "Too many IDs" );
          expect( res.body.status ).to.eq( 422 );
        }).expect( "Content-Type", /json/ ).expect( 422, done );
    });
  });

  describe( "autocomplete", function( ) {
    it( "returns an empty response if not given a query", function( done ) {
      request( app ).get( "/v1/places/autocomplete" ).
        expect( function( res ) {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 0 );
          expect( res.body.total_results ).to.eq( 0 );
          expect( res.body.results.length ).to.eq( 0 );
        }).expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "returns partial matches", function( done ) {
      request( app ).get( "/v1/places/autocomplete?q=a-place" ).
        expect( function( res ) {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 1 );
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results[0].name ).to.eq( "a-place" );
        }).expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "filters by geo", function( done ) {
      request( app ).get( "/v1/places/autocomplete?q=a-place&geo=true" ).
        expect( function( res ) {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.total_results ).to.eq( 0 );
        }).expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "sorts by bbox area", function( done ) {
      // TODO: this isn't testing anything
      request( app ).get( "/v1/places/autocomplete?q=un&order_by=area" ).
        expect( function( res ) {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results[0].name ).to.eq( "United States" );
        }).expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "includes a bounding box if there's a geometry", function( done ) {
      request( app ).get( "/v1/places/autocomplete?q=Massachusetts" ).
        expect( function( res ) {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 1 );
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results[0].name ).to.eq( "Massachusetts" );
          expect( res.body.results[0].bounding_box_geojson ).not.to.be.undefined;
        }).expect( "Content-Type", /json/ ).expect( 200, done );
    } )
  });

});
