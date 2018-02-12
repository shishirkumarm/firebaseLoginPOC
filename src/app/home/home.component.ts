import { NgModule } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../providers/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  private isLoggedIn: Boolean;

  constructor(public authService: AuthService, public router: Router){
    this.authService.afAuth.authState.subscribe(
      (auth) => {
        if (auth == null) {
          this.isLoggedIn = false;
          this.router.navigate(['']);
        }
      });
    
  }

  logout(){
    this.authService.signOut();
    this.router.navigate(['']);
  }
}
