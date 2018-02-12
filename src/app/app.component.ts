import { Component } from '@angular/core';
import { AngularFireAuthModule, AngularFireAuth } from 'angularfire2/auth';
import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabaseModule, AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';
import { Router } from '@angular/router';
import { ToasterService } from 'angular2-toaster';
import { AuthService } from './providers/auth.service';
import { PostMessageService } from './providers/post-message-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {

  constructor(public authService: AuthService,
              private postMessageService: PostMessageService,
              private _toasterService: ToasterService) {
    if (window.addEventListener) {
      window.addEventListener("message", this.receiveMessage.bind(this), true);
    }
   }

  receiveMessage: any = (event: any) =>  {
    if (event.data.applicationId) {
      // event.source.postMessage('Hello', event.origin);
      this.authService.validateApplicationId(event.data.applicationId).subscribe(data => {
        if (data.length === 0) {
          this._toasterService.clear();
          this._toasterService.pop('error', 'Error', data.message);
        }
      }, error => {
        this._toasterService.clear();
        this._toasterService.pop('error', 'Error', error.message);
      });
      this.postMessageService.postData = event;
      this.postMessageService.redirectUrl = event.data.redirecturl;
    }
  }
}
