import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'trimAddress'
})
export class TrimAddressPipe implements PipeTransform {

  transform(address: string): string {
    return address.substr(0, 9) + "..." + address.substr(-4)
  }

}
