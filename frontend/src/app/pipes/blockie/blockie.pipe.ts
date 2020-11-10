import { Pipe, PipeTransform } from '@angular/core';

import makeBlockie from 'ethereum-blockies-base64';

@Pipe({
  name: 'blockie'
})
export class BlockiePipe implements PipeTransform {

  transform(item: string): string {
    if(!item || typeof item != "string") {
      return;
    }
    return makeBlockie(item);
  }

}
