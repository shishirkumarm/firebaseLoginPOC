import { Component, OnInit, ViewChild } from '@angular/core';
import { ValidationService } from '../providers/validation-service';
import { AuthService } from '../providers/auth.service';
import { FormGroup, FormControl, Validators, FormBuilder, FormArray } from '@angular/forms';
import { ShowHideInputDirective } from '../directive/showHideInput/show-hide-input.directive';
import { Router } from '@angular/router';
import { Expressions } from '../constants/regex-constants';
import { ToasterService } from 'angular2-toaster';
import { STATIC_STRING } from './static-string-constants';
import { GLOBAL_STATIC_STRING } from '../constants/global-static-string-constants';

@Component({
  selector: 'app-sign-up-with-email',
  templateUrl: './sign-up-with-email.component.html',
  styleUrls: ['./sign-up-with-email.component.css']
})
export class SignUpWithEmailComponent implements OnInit {

  form: FormGroup;
  errorMessage: Boolean;
  show: Boolean = false;
  isFormSubmitted: Boolean = false;
  @ViewChild(ShowHideInputDirective) input: ShowHideInputDirective;

  static_string = STATIC_STRING;
  global_static_string = GLOBAL_STATIC_STRING;

  constructor(private _fb: FormBuilder,
    public router: Router,
    public authService: AuthService,
    private _toasterService: ToasterService) {
      this.errorMessage = false;
  }

  ngOnInit() {
    this.form = this._fb.group({
      'first_name': ['', Validators.required],
      'last_name': [],
      'passwordCheckbox': [false],
      'email': ['', Validators.required, ValidationService.emailValidator],
      'password': ['', Validators.required, ValidationService.passwordValidator],
      'country': ['', Validators.required]
    });
    // this.initPasswordValidation();
  }

  get checkFormValidation(): boolean {
    if (this.form.invalid) {
      return false;
    } else {
      return true;
    }
  }

  submit(data) {
    this.isFormSubmitted = true;
    if (this.checkFormValidation) {
      const res = this.authService.emailSignUp(data).then(data => {
        if (data && data.status) {
          this._toasterService.clear();
          this._toasterService.pop('success', 'Success', "Account successfully created. Please verify your email and login again.");
          this.router.navigate(['loginWithEmail']);
        } else {
          this._toasterService.clear();
          this._toasterService.pop('error', 'Error', data.message);
        }
      }, error => {
        this._toasterService.clear();
        this._toasterService.pop('error', 'Error', error.message);
      });
    }
  }

  exisitingUser() {
    this.router.navigate(['loginWithEmail']);
  }

  toggleShow() {
    this.show = !this.show;
    if (this.show) {
      this.input.changeType("text");
    } else {
      this.input.changeType("password");
    }
  }

  initPasswordValidation() {

    // Declare security policy
    var lowParams = { min: [6, 6, 6, 6, 6], max: 40, passphrase_words: 3, match_length: 4, similar_deny: 1, random_bits: 47, flags: 3, retry: 3 },
      mediumParams = { min: [8, 8, 8, 7, 6], max: 40, passphrase_words: 3, match_length: 4, similar_deny: 1, random_bits: 47, flags: 3, retry: 3 };

    // CSS classes for levels
    var clsMap = ["", "password-strength-very-weak", "password-strength-weak", "password-strength-medium", "password-strength-very-strong"];

    var oldCls = "", timeout;

    // Checking value
    let check = (val) => {
      if (val.length == 0) {
        return 0;
      }

      if (!passwdqc_check(val)) {
        return 4;
      }

      if (!passwdqc_check(val, undefined, undefined, undefined, mediumParams)) {
        return 3;
      }

      if (!passwdqc_check(val, undefined, undefined, undefined, lowParams)) {
        return 2;
      }

      return 1;
    }

    // Changes view
    let changeView = (level) => {
      dojoDomClass.replace("strength", clsMap[level], oldCls);
      oldCls = clsMap[level];
    };

    // Listens events
    dojoQuery("#password").on("keyup", function (e) {
      var val = this.value;
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(function () {
        changeView(check(val));
      }, 100);
    });
  }

}
