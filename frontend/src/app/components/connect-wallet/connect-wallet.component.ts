import { Component, OnInit } from '@angular/core';
import { AuthService } from '@app/services/auth-service/auth.service';
import { AuthQuery } from '@app/services/auth-service/auth.service.query';
import { CryptoService } from '@services/crypto-service/crypto.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-connect-wallet',
  templateUrl: './connect-wallet.component.html',
  styleUrls: ['./connect-wallet.component.scss'],
})
export class ConnectWallet implements OnInit {

  wallets: string[] | null;
  connectedWallet: string;


  constructor(
    public crypto: CryptoService,
    private auth: AuthService,
    private authQry: AuthQuery
     ) { }

  ngOnInit() {
    this.authQry.isLoggedIn2$.subscribe( res => this.connectedWallet = res );
    console.log(this.connectedWallet);
  }

  async connectWallet() {
    this.auth.logout();
    this.wallets = await this.crypto.connectWallet();
    console.log(`Wallet address ${this.wallets}`);
    // this.auth.login(this.wallets[0])
  }
}
