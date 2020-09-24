
export const environment = {
  production: false,
  appId: "com.daomaker.open-predict",  
  appName: "Yield Shield",
  apiVersion: 1,
  environment: "dev",

  serverUrl: "http://192.168.3.20:1337",

  gcpProjectId: "open-predict-dev",
  gcpProjectNumber: "xxxxxx",
  gcpApiKey: "xxxxx-xxxxxxxx",
    
  stripeKey: "",

  referralShareWebsite: "https://daomaker.com",
  
  playStoreUrl: "",
  itunesUrl: "",

  facebookAppId: "",
  facebookAppName: "",
  linkedInId: "",
  linkedInSecret: "",
  
  termsAndConditions: "https://daomaker.com/terms-and-conditions/",  
  privacyPolicy: "https://daomaker.com/privacy-policy",      
  walletDerivationPath: "m/44'/60'/0'/0/0",    
  etherscanApiKey: "XXXXXXXXXXXXXXXXXXXXX",    
  ethplorerApiKey: "XXXXXXXXXXXXXXXXXXXXX",     
  
  gaeVersionHeaders: {"X-REPTILEHAUS":"development","X-HACKERS":"contact hello@reptile.haus","GOOGAPPUID":"1"},  
  
  oAuth: {
    facebook: {
      appId: "XXXXXXXXXXXXXXXXXXXXX",
      authorizationBaseUrl: "XXXXXXXXXXXXXXXXXXXXX",
      resourceUrl: "XXXXXXXXXXXXXXXXXXXXX",      
      web: {
        responseType: "token",    
        redirectUrl: "XXXXXXXXXXXXXXXXXXXXX",
        windowOptions: "XXXXXXXXXXXXXXXXXXXXX",
      },  
      android: {
        customHandlerClass: "XXXXXXXXXXXXXXXXXXXXX",    
      },       
      ios: {
        customHandlerClass: "XXXXXXXXXXXXXXXXXXXXX",    
      },                
    },
    google: {
      authorizationBaseUrl: "XXXXXXXXXXXXXXXXXXXXX",
      accessTokenEndpoint: "XXXXXXXXXXXXXXXXXXXXX",
      scope: "XXXXXXXXXXXXXXXXXXXXX",
      resourceUrl: "XXXXXXXXXXXXXXXXXXXXX",
      web: {        
        appId: "XXXXXXXXXXXXXXXXXXXXX",        
        accessTokenEndpoint: "",   
        responseType: "XXXXXXXXXXXXXXXXXXXXX",
        scope: "XXXXXXXXXXXXXXXXXXXXX",             
        redirectUrl:"XXXXXXXXXXXXXXXXXXXXX",
        windowOptions: "XXXXXXXXXXXXXXXXXXXXX",        
      },
      android: {
        appId: "XXXXXXXXXXXXXXXXXXXXX",
        responseType: "XXXXXXXXXXXXXXXXXXXXX",
        redirectUrl: "XXXXXXXXXXXXXXXXXXXXX",
      },      
      ios: {
        appId: "xxxxxxxxxx",
        responseType: "code",
        redirectUrl: "XXXXXXXXXXXXXXXXXXXXX",
      }                    
  },
  twitterServerEndpoint: "http://localhost:1337/twitter",
  twitterCallbackURL: "http://localhost:1337/twitter/callback",
  twitterCallbackDomain: "http://localhost:8100"    
  
    
    
  }  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
}
