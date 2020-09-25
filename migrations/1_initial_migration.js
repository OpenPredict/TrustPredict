var Migrations = artifacts.require("Migrations");

module.exports = function(deployer, network) {
  // Deploy the Migrations contract as our only task
  process.env.NETWORK = network;
  deployer.deploy(Migrations);
};