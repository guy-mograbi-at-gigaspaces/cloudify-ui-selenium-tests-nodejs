'use strict';

var logger = require('log4js').getLogger('deployments_spec');
var components = require('../../src/components');
var testConf = components.config.tests.sanity.deployments_spec;
var hotkeys = components.ui.hotkeys;

//var INSTALLED_DEPLOYMENT_NAME = 'installed_deployment';

describe('deployments page', function () {

    beforeEach(function(){ logger.info('running from ' + __filename); });

    beforeEach(function (done) {
        //components.ui.deployments.IndexPage.beforeEach(done);
        components.ui.LoginPage.goTo().login('admin', 'admin');
        components.ui.layout.goToDeployments();
        browser.sleep(1000).then(done);
    });

    describe('single deployment', function(){

        var deploymentName;
        var deploymentsOpts;

        beforeEach(function(done){

            deploymentName ='deployment_' + new Date().getTime();
            deploymentsOpts = {id : deploymentName };
            // lets deploy a blueprint to make this test rerunable.. I hate it, but what can we do
            // if deploying was a simple act, we would not care..
            components.ui.layout.goToBlueprints();
            components.ui.blueprints.IndexPage.createDeployment({ name : 'nodecellar1' });
            components.ui.blueprints.CreateDeployment.setDetails({ name : deploymentName , 'raw' : {
                'agent_private_key_path': 'ggg',
                'agent_user': 'ggg',
                'host_ip': 'ggg'
            }});
            components.ui.blueprints.CreateDeployment.confirm();

            components.ui.deployments.DeploymentPage.waitForInitializingToStop();
            browser.sleep(1000).then(done);

        });

        it('should not have any search queries in the url after creation', function(done){

            expect(browser.getCurrentUrl()).toMatch(/.+topology$/);

            browser.sleep(1000).then(done);
        });

        it('should be deletable from deployments table view', function (done) {

            logger.trace('starting: should be deletable from deployments table view');

            components.ui.layout.goToDeployments();

            var deploymentsOpts = {id : deploymentName };
            components.ui.deployments.IndexPage.deleteDeployment(deploymentsOpts);
            components.ui.deployments.DeleteDeployment.clickCancel();
            components.ui.deployments.IndexPage.deleteDeployment(deploymentsOpts);
            components.ui.deployments.DeleteDeployment.clickConfirm();
            components.ui.deployments.IndexPage.getDeployment(deploymentsOpts,true).then(function(dep){
                expect(dep).toBeUndefined('deployment ' + deploymentsOpts + ' should not exist');
            });
            browser.sleep(1000).then(done);
        });

        describe('should be deletable from deployment layout view', function (){

            beforeEach(function (done){

                components.ui.deployments.DeploymentLayout.deleteDeployment(deploymentsOpts);
                components.ui.deployments.DeleteDeployment.clickCancel();
                components.ui.deployments.DeploymentLayout.deleteDeployment(deploymentsOpts);
                components.ui.deployments.DeleteDeployment.clickConfirm();

                browser.sleep(1000).then(done);
            });

            it('and redirect to deployments table after deletion', function (done) {

                expect(browser.getCurrentUrl()).toContain('deployments');
                components.ui.deployments.IndexPage.getDeployment(deploymentsOpts,true).then(function(dep){
                    expect(dep).toBeUndefined('deployment ' + deploymentsOpts + ' should not exist');
                });

                browser.sleep(1000).then(done);
            });

            it('and not redirect to deployments if user navigated elsewhere', function (done) {
                browser.ignoreSynchronization = true;
                components.ui.deployments.DeleteDeployment.clickClose();
                components.ui.layout.goToBlueprints();
                browser.ignoreSynchronization = false;
                expect(browser.getCurrentUrl()).not.toContain('deployments');
                browser.sleep(1000).then(done);
            });
        });
    });

    describe('single deployment (existing deployment)', function(){
        beforeEach(function(){
            components.ui.deployments.IndexPage.goToDeployment({id: testConf.deployment.groupsDeployment});
        });

        describe('nodes view', function(){
            it('should have groups', function(){
                components.ui.deployments.DeploymentPage.goToNodes();
                expect(components.ui.deployments.NodesTab.getNodesGroups()).toEqual(['group2', 'mongo_and_node', 'group1', 'mongo_and_node']);
            });
        });

        describe('start execution dialog', function(){
            beforeEach(function(){
                components.ui.deployments.DeploymentLayout.executeDeployment();
            });

            describe('scale workflow', function(){
                beforeEach(function(){
                    components.ui.deployments.ExecuteWorkflowDialog.workflows.select('scale');
                });

                it('should load resources to scale', function(){
                    expect($('.select-resource').isPresent()).toBe(true);
                    expect(components.ui.deployments.ExecuteWorkflowDialog.scalingResources.getOptionsTexts()).toEqual([ 'Groups', 'group2', 'group1', 'group3', 'mongo_and_node', 'Nodes', 'host', 'nodecellar', 'mongod', 'nodejs' ]);
                    expect(components.ui.deployments.ExecuteWorkflowDialog.isSubmitDisabled()).toBe(true);
                });

                it('should show parameters', function(){
                    components.ui.deployments.ExecuteWorkflowDialog.scalingResources.select('group1');
                    expect($('[form-raw-params]').isPresent()).toBe(true);
                    expect(components.ui.deployments.ExecuteWorkflowDialog.isSubmitDisabled()).toBe(false);
                });

                describe('multiSelectMenu - groups', function(){
                    it('should navigate between options', function(){
                        components.ui.deployments.ExecuteWorkflowDialog.scalingResources.toggle();
                        hotkeys.Globals.arrowDown();
                        expect(components.ui.deployments.ExecuteWorkflowDialog.scalingResources.getMarkedText()).toBe('group2');
                        hotkeys.Globals.arrowDown();
                        expect(components.ui.deployments.ExecuteWorkflowDialog.scalingResources.getMarkedText()).toBe('group1');
                        hotkeys.Globals.arrowDown();
                        expect(components.ui.deployments.ExecuteWorkflowDialog.scalingResources.getMarkedText()).toBe('group3');
                        hotkeys.Globals.arrowDown();
                        expect(components.ui.deployments.ExecuteWorkflowDialog.scalingResources.getMarkedText()).toBe('mongo_and_node');
                        hotkeys.Globals.arrowDown();
                        expect(components.ui.deployments.ExecuteWorkflowDialog.scalingResources.getMarkedText()).toBe('host');
                        hotkeys.Globals.arrowUp();
                        expect(components.ui.deployments.ExecuteWorkflowDialog.scalingResources.getMarkedText()).toBe('mongo_and_node');
                    });

                    it('should filter and navigate between filtered options', function(){
                        components.ui.deployments.ExecuteWorkflowDialog.scalingResources.toggle();
                        components.ui.deployments.ExecuteWorkflowDialog.scalingResources.filter('no');
                        hotkeys.Globals.arrowDown();
                        expect(components.ui.deployments.ExecuteWorkflowDialog.scalingResources.getMarkedText()).toBe('mongo_and_node');
                        hotkeys.Globals.arrowDown();
                        expect(components.ui.deployments.ExecuteWorkflowDialog.scalingResources.getMarkedText()).toBe('nodecellar');
                        hotkeys.Globals.arrowDown();
                        expect(components.ui.deployments.ExecuteWorkflowDialog.scalingResources.getMarkedText()).toBe('nodejs');
                        hotkeys.Globals.arrowDown();
                        expect(components.ui.deployments.ExecuteWorkflowDialog.scalingResources.getMarkedText()).toBe('nodejs');
                        hotkeys.Globals.arrowUp();
                        expect(components.ui.deployments.ExecuteWorkflowDialog.scalingResources.getMarkedText()).toBe('nodecellar');
                        hotkeys.Globals.arrowUp();
                        expect(components.ui.deployments.ExecuteWorkflowDialog.scalingResources.getMarkedText()).toBe('mongo_and_node');
                        hotkeys.Globals.arrowUp();
                        expect(components.ui.deployments.ExecuteWorkflowDialog.scalingResources.getMarkedText()).toBe('mongo_and_node');
                    });
                });
            });
        });
    });

    it('should list all deployments', function (done) {
        logger.trace('start deployments page test');
        var deployments = components.ui.deployments.IndexPage.getDeployments();
        expect(deployments.count()).toBeGreaterThan(0);
        browser.sleep(1000).then(done);
    });

    it('should go into deployment and verify all section exists', function (done) {

        components.ui.deployments.IndexPage.goToDeployment(testConf.deployment.deploymentToRead);
        components.ui.deployments.DeploymentPage.goToNodes();
        components.ui.deployments.DeploymentPage.goToExecutions();
        components.ui.deployments.DeploymentPage.goToInputsOutputs();
        components.ui.deployments.DeploymentPage.goToSource();
        components.ui.deployments.DeploymentPage.goToMonitoring();

        browser.sleep(1000).then(done);
    });

    it('should open node details panel when clicking on node in topology section', function (done) {
        components.ui.deployments.IndexPage.goToDeployment(testConf.deployment.deploymentToRead);
        components.ui.deployments.DeploymentPage.goToTopology();

        // drag Events list down for the nodes to be click-able


        var panel = components.ui.deployments.DeploymentLayout.getNodePropertiesPanel();
        expect(panel.isDisplayed()).toEqual(false, 'panel should not exist');
        components.ui.deployments.DeploymentLayout.closeEventsPanel();
        components.ui.deployments.DeploymentPage.Topology.clickNode(testConf.deployment.nodeToClick);
        expect(panel.isDisplayed()).toEqual(true, 'panel should not exist');
        browser.sleep(1000).then(done);
    });

    //xit('should open node details panel when clicking on node in network section', function (done) {
    //
    //});
    //
    //xit('should open node details panel when clicking on node in nodes section', function (done) {
    //
    //});
    //
    //xit('should list all executions in executions section', function (done) {
    //
    //});
    //
    //xit('should show files tree in source section and selected file content', function (done) {
    //
    //});
});