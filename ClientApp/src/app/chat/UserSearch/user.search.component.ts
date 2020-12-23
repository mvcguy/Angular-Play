import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';

@Component({
  selector: 'app-chat-user-search',
  templateUrl: './user.search.component.html',
  styleUrls: ['./user.search.component.css']
})
export class UserSearchComponent implements OnInit {

  pageModel = new PageModel();


  constructor(private http: HttpClient,
    @Inject('API_URL') private apiUrl: string) {
    console.log("init");
  }
  ngOnInit() {
    
    this.http.get<ChatUserModel[]>(this.apiUrl + '/chat/userlist')
      .subscribe(
        result => { this.OnTopUsersQueryResult(result); }
        , error => { this.OnTopUsersQueryError(error) });

  }

  public OnSubmit() {
    this.pageModel.submitted = true;
  }

  public async SearchUser() {
    this.pageModel.topUsers = [];
    this.http.get<ChatUserModel[]>(this.apiUrl + '/chat/searchUser?query=' +
      this.pageModel.txtUserSearchQuery)
      .subscribe(
        result => { this.OnSearchQueryResult(result); }
        , error => { this.OnSearchQueryError(error) });

    //
    // Notice above that we are using lambda function, to use 'this' in the context
    // of current typescript object
    //
  }

  private OnSearchQueryResult(result: ChatUserModel[]) {
    if (this.pageModel == null) {
      this.pageModel = new PageModel();
    }
    this.pageModel.searchResults = result;
  }

  private OnSearchQueryError(error) {
    console.log(error);
  }


  private OnTopUsersQueryResult(result: ChatUserModel[]) {
    if (this.pageModel == null) {
      this.pageModel = new PageModel();
    }
    this.pageModel.topUsers = result;
  }

  private OnTopUsersQueryError(error) {
    console.log(error);
  }

}


export class ChatUserModel {
  name: string;
  userName: string;
  email: string;
  phone: string;
}

export class PageModel {
  txtUserSearchQuery: string;
  searchResults: ChatUserModel[];
  submitted: boolean;
  topUsers: ChatUserModel[];
}
