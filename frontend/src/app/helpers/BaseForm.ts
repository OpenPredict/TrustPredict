import {AbstractControl, FormArray, FormControl, FormGroup, ValidationErrors} from '@angular/forms';
import {OnInit} from '@angular/core';

export abstract class BaseForm implements OnInit {

    form!: FormGroup;
    serverError!: string | null;
    submitted = false;
    events: any[] = []; // list of form changes

    abstract ngOnInit(): void;

    /**
     * Sets submitted to true, serverError to null and marks all the form controls as touched, which triggers the validations
     */
    setSubmitted() {
        this.serverError = null;
        this.submitted = true;
        this._markAsTouched(this.form);
    }

    private _markAsTouched(group: FormGroup | FormArray) {
        group.markAsTouched();
        // controls is an object in FormGroup and an Array in FormArray
        // TODO probably missing hasOwnProperty
        for (const i in group.controls) {
            const control = ( group.controls as any)[i];
            if (control instanceof FormControl) {
                // group.controls[i].updateValueAndValidity()
                // group.controls[i].markAsDirty()
                control.markAsTouched();
            } else {
                this._markAsTouched(control);
            }
        }
    }

    /**
     * @param control the control name
     * @returns {any} the control value
     */
    value(control: string): string {
        return this.form.controls[control].value;
    }


    confirmPassword(control: FormControl, group: FormGroup, passwordconfirm: string) {
        if (!control.value || group.controls[passwordconfirm].value !== null || group.controls[passwordconfirm].value === control.value) {
            return null;
        }
        return { mismatch: true };
    }

    /**
     * @author Paddy O'Sullivan @REPTILEHAUS
     * solved issue with google places form not updating when selected
     * @param control the control name
     * @param value the control value
     * @returns {void}
     */
    setValue(control: string, value: string ): void {
        return this.form.controls[control].setValue(value);
    }


    /**
     * @author Paddy O'Sullivan @REPTILEHAUS
     * solved issue with google places form not updating when selected
     * @param control the control name
     * @param value the control value
     * @returns {void}
     */
    setError(control: string, value: any ): void {
        return this.form.controls[control].setErrors({ [value]: true });
    }


    getFormValidationErrors() {



        console.log('Checking for errors...' +         this.form.getError('allornone'));
        return Object.keys(this.form.controls).forEach(key => {
         console.log('Checking for errors...' + key);
         const controlErrors: ValidationErrors = this.form.get(key).errors;
         if (controlErrors != null) {
                Object.keys(controlErrors).forEach(keyError => {
                console.log('Key control: ' + key + ', keyError: ' + keyError + ', err value: ', controlErrors[keyError]);
                return  `Key control: ${key}, keyError: ${keyError}, err value: ${controlErrors[keyError]}`;
                });
        }
        });
    }




    /**
     * Get the value of a control as an int
     * @param {string} control
     * @returns {number}
     */
    int(control: string): number {
        return parseInt(this.form.controls[control].value);
    }

    /**
     * Get the value of a control as a float
     * @param {string} control
     * @returns {number}
     */
    float(control: string): number {
        return parseFloat(this.form.controls[control].value);
    }

    /**
     * @param {string} field
     * @returns {boolean} if the field has errors
     */
    errors(field: string): boolean {
        const control = this.form.controls[field];
        if (!control) {
            throw new Error('Control ' + field + ' does not exist on the form');
        }
        return this.submitted && control.errors !== null && Object.keys(control.errors).length > 0;
    }

    /**
     * @param {string} fieldName the field to check
     * @param {string} errorName the particular error to check
     * @returns {boolean} if the field has a particular error and the field has been touched
     */
    hasError(fieldName: string, errorName: string){
        const control: AbstractControl = this.form.controls[fieldName];
        return control.touched
            && control.errors !== null
            && control.errors[errorName];
    }



}
