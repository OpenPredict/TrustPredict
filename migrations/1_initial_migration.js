const TrustPredict = artifacts.require("TrustPredict");

module.exports = function (deployer) {
  deployer.deploy(TrustPredict);
};
