"use strict";
var _ = require( "lodash" ),
    projects = require( "inaturalistjs" ).projects,
    esClient = require( "../../es_client" ),
    util = require( "../../util" ),
    InaturalistAPI = require( "../../inaturalist_api" ),
    Project = require( "../../models/project" );

var ProjectsController = class ProjectsController {

  static autocomplete( req, callback ) {
    InaturalistAPI.setPerPage( req, { default: 10, max: 300 } );
    var filters = [ ];
    var inverseFilters = [ ];
    var sort;
    if( !req.query.q ) {
      if( req.query.member_id ) {
        sort = { title_exact: "asc" };
      } else {
        return InaturalistAPI.basicResponse( null, req, null, callback );
      }
    } else {
      filters.push( { bool: { should: [
        { term: { slug: req.query.q } },
        { match: { title_autocomplete: { query: req.query.q, operator: "and" } } },
        { match: { title: { query: req.query.q, operator: "and" } } }
      ] } } );
    }
    if( req.query.member_id ) {
      filters.push( { term: { user_ids: req.query.member_id } } );
    }
    if( req.query.not_id ) {
      inverseFilters.push( {
        terms: { id: util.paramArray( req.query.not_id ) }
      });
    }
    esClient.connection.search({
      preference: global.config.elasticsearch.preference,
      index: ( process.env.NODE_ENV || global.config.environment ) + "_projects",
      body: {
        query: {
          bool: {
            filter: filters,
            must_not: inverseFilters
          }
        },
        _source: Project.returnFields,
        size: req.query.per_page,
        sort: sort
      }
    }, function( err, response ) {
      InaturalistAPI.responseLocationToLatLng( response );
      InaturalistAPI.basicResponse( err, req, response, callback );
    });
  }

  static show( req, callback ) {
    InaturalistAPI.setPerPage( req, { default: 10, max: 100 } );
    var ids = _.filter( req.params.id.split(","), _.identity );
    if( ids.length > req.query.per_page ) {
      return callback({ error: "Too many IDs", status: 422 });
    }
    var numericIDs = _.filter( ids, id => Number( id ) );
    esClient.connection.search({
      preference: global.config.elasticsearch.preference,
      index: ( process.env.NODE_ENV || global.config.environment ) + "_projects",
      body: {
        sort: { id: "desc" },
        query: {
          bool: {
            should: [
              { terms: { id: numericIDs } },
              { terms: { slug: ids } }
            ]
          }
        },
        _source: Project.returnFields
      }
    }, function( err, response ) {
      InaturalistAPI.responseLocationToLatLng( response );
      InaturalistAPI.basicResponse( err, req, response, callback );
    });
  }

  static members( req, callback ) {
    InaturalistAPI.setPerPage( req, { default: 30, max: 100 } );
    req.query.page = Number( req.query.page ) || 1;
    if( req.query.page < 1 ) {
      req.query.page = 1;
    }
    Project.findByID( req.params.id, function( err, obj ) {
      if( err ) { return callback( err ); }
      if( obj ) {
        obj.members( req.query, function( err, members ) {
          if( err ) { return callback( err ); }
          var total = ( members.length > 0 ) ? Number( members[ 0 ].total_count ) : 0;
          InaturalistAPI.resultsHash({
            total: total,
            per_page: req.query.per_page,
            page: req.query.page,
            results: _.map( members, function( m ) {
              return _.omit( m, "total_count" );
            })
          }, callback )
        })
      } else {
        return callback({ error: "Unknown project_id", status: 422 });
      }
    });
  }

  static join( req, callback ) {
    InaturalistAPI.iNatJSWrap( projects.join, req ).then( function( r ) {
      return callback( null, r );
    }).catch( callback );
  }

  static leave( req, callback ) {
    InaturalistAPI.iNatJSWrap( projects.leave, req ).then( function( r ) {
      return callback( null, r );
    }).catch( callback );
  }

  static add( req, callback ) {
    InaturalistAPI.iNatJSWrap( projects.add, req ).then( function( r ) {
      return callback( null, r );
    }).catch( callback );
  }

  static remove( req, callback ) {
    InaturalistAPI.iNatJSWrap( projects.remove, req ).then( function( r ) {
      return callback( null, r );
    }).catch( callback );
  }

};

module.exports = ProjectsController;
