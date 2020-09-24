import { Injectable } from '@angular/core';
import { AlertController, LoadingController } from '@ionic/angular'
import { Plugins } from '@capacitor/core';
const { Browser } = Plugins;

@Injectable({
  providedIn: 'root'
})
export class UiService {
  
    constructor(
    public alertController: AlertController,
    private loadingCtrl: LoadingController ) { }
    
    async openIAB(url: string) {
      await Browser.open({ url: url });
    }  

    /**
     * Wraps an asynchronous call with the LoadingController overlay
     * @param action the action to execute
     * @param loadingMessage the loading message to display
     * @returns {Promise<T>}
     */
    async loading<T>(action: Promise<T>, loadingMessage?: string, loadingSpinner?: string, loadingDuration?: number ): Promise<T> {
       let loadingOptions: any = {} // delay: 400
      if (loadingMessage) {
          loadingOptions.message = loadingMessage
      }
      if (loadingSpinner) {
          loadingOptions.spinner = loadingSpinner
      }      
      if (loadingDuration) {
          loadingOptions.duration = loadingDuration
      }         
      let loader: any;
      try {
         loader = await this.loadingCtrl.create(loadingOptions)
          await loader.present()
      } catch (e) {
        //  this.log.error(this.log.warn)
      }            
      try {
          let result: T = await action
          await loader.dismiss()
          return result
      } catch (e) {
         await loader.dismiss()
          throw e
      }
  }
  
}
