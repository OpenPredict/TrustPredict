import { FormControl, FormGroup, AbstractControl } from '@angular/forms';

export class CustomValidators {
    
    /**
     * Validate an email 
     * @param c email field in the form
     */
    static validateEmail(c: FormControl) {   
        let EMAIL_REGEXP = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        return EMAIL_REGEXP.test(c.value) ? null : {emailValid: true};
    }
    
    /**
     * Count up the percentage fields of multiple array controls in other form groups
     * @param c array of AbstractControl items
     */
    static is100percent(c: AbstractControl[]) {
        let vestingActual = 0
        c.forEach( control => {
            vestingActual += Number( control.get('percentage').value )
        })
        if (vestingActual < 100) {
            return { 
              vesting_percent_low: true 
            };
          }  
          if (vestingActual > 100) {            
            return { 
              vesting_percent_high: true 
            };
          }                  
        return null;
      }        
      
      
    /**
     * Count up the sho_allocation fields of multiple array controls in other form groups
     * @param totalRaise the value set in the main offering as the total raise amount which is the sum of all the individual SHO items
     * @param c array of AbstractControl items
     */
    static shoTotalValidation(totalRaise: number, c: AbstractControl[]) {
        let shoCount: number = 0
        c.forEach( ( control: AbstractControl ) => {
            shoCount += Number( control.get('sho_allocation').value )
        })
        if (shoCount < totalRaise) {
            return { less_than_total_raise: true };
          }  
          if (shoCount > totalRaise) {       
            return { greater_than_total_raise: true };
          }                  
        return null;
      }        
    
      
    /**
     * Validate an ERC/ETh address to ensure it is formatted correctly
     */
    static isAddress(c: FormControl) {
        if (!c.value) {
          return { invalid_address: true };
        }
        if (!new RegExp('^(0x)[0-9a-fA-F]{40}$').test(c.value)) {
          return { invalid_address: true };
        }
        return null;
      }    
    
    
    static passwordValidation(c: FormGroup){
        let passwords: any = {
            password: c.controls['password'],
            passwordConfirm: c.controls['passwordConfirm']
        }
        // reset all password errors
        for (let pwdField in passwords){
            passwords[pwdField].setErrors(null);
        }
        // check if currentPassword is empty
        if (passwords.password.value == ''){
            passwords.password.setErrors({required: true});
            return null;
        }
        // check if currentPassword is empty
        if (passwords.password.value.length < 6 ){
            passwords.password.setErrors({ minlength: true});
            return null;
        }          
        if (passwords.password.value != passwords.passwordConfirm.value)
            passwords.passwordConfirm.setErrors({passwordMismatch: true})

        return null
    }

}