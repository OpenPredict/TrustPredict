import { Component, OnInit, Input, SimpleChanges } from '@angular/core';

@Component({
  selector: 'crypto-address-display',
  templateUrl: './crypto-address-display.component.html',
  styleUrls: ['./crypto-address-display.component.scss'],
})
export class CryptoAddressDisplayComponent implements OnInit {

  @Input() address: string;

  croppedAddress: string;

  constructor() { }

  ngOnInit(): void {

  }

  // do change detection
  ngOnChanges(changes: SimpleChanges): void {
    if( changes && changes.address && changes.address.currentValue ) {
      this.croppedAddress = this.cropAddress( changes.address.currentValue );
      console.log('croppedAddress: ' + this.croppedAddress);
      console.log('address: ' + this.address);
    }
  }

  cropAddress(address: string): string {
    console.log(`ADDRESS ${address}`);
    return address.toString().substr(0, 9) + "..." + address.toString().substr(-4);
  }

}
