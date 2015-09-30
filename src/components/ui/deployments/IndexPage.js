'use strict';

var logger = require('log4js').getLogger('DeploymentIndexPage');
var common = require('../common');

exports.getDeployments = function(){
    return element.all(by.css('#deploymentTable tbody'));
};

/**
 *
 * @description returns a promise the fulfills with the first deployment found according to opts specification.
 * <p>
 * for example:
 * if opts.id = 'X' - then it will return the first deployment with name X.
 * </p>
 *
 * @param {object} opts contains information to find the deployment
 * @param {string} opts.id the name of the deployment
 * @returns {webdriver.promise.Deferred.promise|*}
 */
exports.getDeployment = function( opts ){
    logger.trace('getting deployment by ', opts );
    var deferred = protractor.promise.defer();
    exports.getDeployments().filter(function(deployment){
        return deployment.element(by.css('.id')).getText().then(function( text ){
            return text === opts.id;
        });
    }).then(function(filtered){
        expect(filtered.length > 0).toBe(true, 'deployment ' + JSON.stringify(opts) + ' should exist');
        deferred.fulfill(filtered[0]);
    });

    return deferred.promise;
};

exports.goToDeployment = function( opts ){
    return exports.getDeployment(opts).then(function(deployment){
        return deployment.all(by.css('.id')).click();
    });
};

exports.deleteDeployment = function(opts) {
    return exports.getDeployment(opts).then(function(deployment){
        new common.ActionsDropdown(deployment).clickMenuOption('Delete');
    });
};