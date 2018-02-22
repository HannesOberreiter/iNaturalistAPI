"use strict";
var _ = require( "lodash" ),
    esClient = require( "../../es_client" ),
    ESModel = require( "../../models/es_model" ),
    ControlledTerm = require( "../../models/controlled_term" );

var ControlledTermsController = class ControlledTermsController {

  static forTaxon( req, callback ) {
    if( !req.query.taxon_id ) {
      return callback({ error: "Missing required parameter `taxon_id`", status: 422 });
    }
    var ors = [ { bool: { must_not: [ { exists: { field: "taxon_ids" } } ] } } ];
    ors.push( esClient.termFilter( "taxon_ids", req.query.taxon_id ) );
    var query = { filters: [
      { term: { is_value: false } },
      { bool: { should: ors } }
    ] };
    ESModel.elasticResults( req, query, "controlled_terms", { }, ( err, data ) => {
      if( err ) { return callback( err ); }
      var terms = _.map( data.hits.hits, h => {
        var term = new ControlledTerm( h._source );
        term.values = term.values.map( v => ( new ControlledTerm( v ) ) );
        return term;
      });
      if( err ) { return callback( err ); }
      callback( null, {
        total_results: data.hits.total,
        page: Number( req.elastic_query.page ),
        per_page: Number( req.elastic_query.per_page ),
        results: terms
      });
    });
  }

  static search( req, callback ) {
    var query = { filters: [
      { term: { is_value: false } }
    ] };
    ESModel.elasticResults( req, query, "controlled_terms", { }, ( err, data ) => {
      if( err ) { return callback( err ); }
      var terms = _.map( data.hits.hits, h => {
        var term = new ControlledTerm( h._source );
        if ( term.values ) {
          term.values = term.values.map( v => ( new ControlledTerm( v ) ) );
        }
        return term;
      });
      if( err ) { return callback( err ); }
      callback( null, {
        total_results: data.hits.total,
        page: Number( req.elastic_query.page ),
        per_page: Number( req.elastic_query.per_page ),
        results: terms
      });
    });
  }

};

module.exports = ControlledTermsController;
