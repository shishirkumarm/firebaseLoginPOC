import { Injectable } from '@angular/core';
import { AngularFireDatabase, FirebaseListObservable, FirebaseObjectObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { PostMessageService } from './post-message-service';
import { ToasterService } from 'angular2-toaster';
import { Router } from '@angular/router';
import * as firebase from 'firebase';
import { FirebaseApp } from 'angularfire2';

@Injectable()
export class AuthService {

  authState: any = null;
  locationList: FirebaseListObservable<any>;
  doctorCollection: FirebaseListObservable<any>;
  patientCollection: FirebaseListObservable<any>;
  
  usersList: FirebaseListObservable<any>;

  state = {
    loggedIn: false
  };

  constructor(public afAuth: AngularFireAuth,
    private db: AngularFireDatabase,
    private router: Router,
    private _toasterService: ToasterService,
    private postMessageService: PostMessageService) {

    this.afAuth.authState.subscribe((auth) => {
      this.authState = auth;
    });

    this.locationList = db.list('/location_table');
    this.doctorCollection = db.list('/doctorsList');
    this.patientCollection = db.list('/patientsList');
  }

  get authenticated(): boolean {
    return this.authState !== null;
  }

  get currentUser(): any {
    return this.authenticated ? this.authState : null;
  }

  get currentUserObservable(): any {
    return this.afAuth.authState;
  }

  get currentUserId(): string {
    return this.authenticated ? this.authState.uid : '';
  }

  get userPhotoUrl(): string {
    return this.authenticated ? this.authState['photoURL'] : '';
  }

  get userPhoneNumber(): string {
    return this.authenticated ? this.authState['phoneNumber'] : '';
  }

  get userEmail(): string {
    return this.authenticated ? this.authState['email'] : '';
  }

  get userEmailVerified(): string {
    if (!this.authState) {
      return 'false';
    } else {
      return this.authState['emailVerified'] ? 'true' : 'false';
    }
  }

  get currentUserAnonymous(): boolean {
    return this.authenticated ? this.authState.isAnonymous : false;
  }

  get currentUserDisplayName(): string {
    if (!this.authState) {
      return 'Guest';
    } else if (this.currentUserAnonymous) {
      return 'Anonymous';
    } else {
      return this.authState['displayName'] || '';
    }
  }

  get serviceProviderId(): string {
    if (!this.authState) {
      return null;
    } else if(this.authState.providerData[0]) {
      return this.authState.providerData[0].providerId;
    } else {
      return 'Unknown';
    }
  }

  loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    return this.socialSignIn(provider);
  }

  loginWithFacebook() {
    const provider = new firebase.auth.FacebookAuthProvider();
    return this.socialSignIn(provider);
  }

  validateApplicationId(applicationId: Number): FirebaseListObservable<any> {
    const applicationStatus = this.db.list('/applicationList', {
      query: {
        orderByChild: 'applicationId',
        equalTo: applicationId,
      }
    });
    return applicationStatus;
  }

  emailSignUp(formData) {
    return this.afAuth.auth.createUserWithEmailAndPassword(formData.email, formData.password)
      .then((user) => {
        this.authState = user;
        this.postMessageService.idToken = user.idToken;
        this.postMessageService.accessToken = user.accessToken;
        this.sendEmailVerification();
        this.newUserData(formData);
        user.status = true;
        return user;
      })
      .catch(error => {
        return error;
      });
  }

  sendEmailVerification() {
    const user: any = firebase.auth().currentUser;
    user.sendEmailVerification()
      .then((success) => {
        console.log('Please verify your email');
      })
      .catch(error => {
        return error;
      });
  }

  emailLogin(email: string, password: string) {
    return this.afAuth.auth.signInWithEmailAndPassword(email, password)
      .then((user) => {
        this.authState = user;
        if (user.emailVerified) {
          this.postMessageService.idToken = user.idToken;
          this.postMessageService.accessToken = user.accessToken;
          this.registerUserLog(user);
          user.status = true;
          return user;
        } else {
          user.message = 'Please verify your email, then log in.';
          return user;
        }
      })
      .catch(error => {
        return error;
      });
  }

  verifyUserEmailId(code) {
    const auth: any = firebase.auth();
    return auth.applyActionCode(code)
      .then((resp) => {
        return resp = 'success';
      })
      .catch((error) => {
        return error;
      });
  }

  verifyPasswordCode(code) {
    const auth: any = firebase.auth();

    return auth.verifyPasswordResetCode(code)
      .then((email) => {
        return email;
      })
      .catch((error) => {
        return error;
      });
  }

  updateUserPassword(code, newPassword) {
    const auth: any = firebase.auth();

    return auth.confirmPasswordReset(code, newPassword)
      .then((data) => {
        return data = 'success';
      })
      .catch((error) => {
        return error;
      });
  }

  resetPassword(email: string) {
    const auth: any = firebase.auth();

    return auth.sendPasswordResetEmail(email)
      .then((data) => {
        return data = 'success';
      })
      .catch((error) => {
        return error;
      });
  }

  signOut(): void {
    this.afAuth.auth.signOut();
    this.router.navigate(['']);
  }

  updateUserLocation(formData): void {
    const path = `userRegistry/${this.currentUserId}/`;
    const locationData = {
      location: formData.country
    }

    this.db.object(path).update(locationData).then(data => {
      this.respondToParentApplication(locationData);
      this.router.navigate(['home']);
    })
      .catch(error => {
        console.log(error);
      });
  }

  respondToParentApplication(userLocation) {
    const location = userLocation.location;
    this.postMessageService.userLocation = location;
    let userData = this.setUserDetailsToStaorage();
    if(!userData.userDisplayName) {
        userData.userDisplayName = userLocation.name ? userLocation.name : '';
    }
    const originApp = this.postMessageService.postData;
    if (originApp && !!originApp.origin) {
      originApp.source.postMessage(userData, originApp.origin);
    } else {
      this._toasterService.clear();
      this._toasterService.pop('error', 'Error', "Application accessed without the source. Parent Application not found");
    }
  }

  setUserDetailsToStaorage(){
    const data = {
            'userDisplayName': this.currentUserDisplayName,
            'userEmail': this.userEmail,
            'providerId': this.serviceProviderId,
            'userLocation': this.postMessageService.userLocation,
            'userUid': this.currentUserId,
            'accessToken': this.postMessageService.accessToken,
            'idToken': this.postMessageService.idToken,
            'redirecturl': this.postMessageService.redirectUrl
          };
    return data;
  }

  private socialSignIn(provider) {
    return this.afAuth.auth.signInWithPopup(provider)
      .then((respObject) => {
        this.authState = respObject.user;
        this.postMessageService.idToken = respObject.credential.idToken;
        this.postMessageService.accessToken = respObject.credential.accessToken;
        this.getUserDetails(this.authState.email).subscribe((details) => {
          if (details && details.length > 0 && details[0].location) {
            this.registerUserLog(details);
            this.respondToParentApplication(details[0]);
            this.router.navigate(['home']);
          } else {
            this.newUserData(null);
            this.router.navigate(['locationupdate']);
          }
        });
      })
      .catch(error => {
        return error;
      });
  }

  getUserDetails(emailId: String): FirebaseListObservable<any> {
    this.usersList = this.db.list('/userRegistry', {
      query: {
        orderByChild: 'email',
        equalTo: emailId,
      }
    });
    return this.usersList;
  }

  private registerUserLog(userDetails): void {
    const path = `registerUserLog/${this.currentUserId}`;
    const data = {
      loginTime: Date.now()
    }
    this.db.object(path).update(data)
      .catch(error => {
        console.log(error)
      });
  }

  private newUserData(formData): void {
    let name: String = '';
    let email: String = '';
    let location: String = '';

    if (formData) {
      name = formData.first_name + formData.last_name;
      email = formData.email;
      location = formData.country;
    } else {
      name = this.authState.displayName;
      email = this.authState.email;
      location = '';
    }

    const data = {
      email: email,
      name: name,
      location: location
    }

    const path = `userRegistry/${this.currentUserId}`;

    this.db.object(path).update(data)
      .catch(error => {
        console.log(error)
      });
  }

  userLoggedIn() {
    return new Promise(function (resolve, reject) {
      firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
          resolve(user.email);
          console.log(user);
        } else {
          reject(Error('It broke'));
        }
      });
    });
  }

  blockUser(key, value): void {
    const path = `userRegistry/${key}`;
    const data = {
      blocked: value
    };

    this.db.object(path).update(data)
      .catch(error => console.log(error));
  }


}
