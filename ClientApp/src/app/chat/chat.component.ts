import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent {

  pageModel = new PageModel();


  constructor(private http: HttpClient,
    @Inject('API_URL') private apiUrl: string) {
    console.log("init");
  }

  public OnSubmit() {
    this.pageModel.submitted = true;
  }

  public async SearchUser() {
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
}

export class ChatUserModel {
  name: string;
  userName: string;
  email: string;
}

export class PageModel {
  txtUserSearchQuery: string;
  searchResults: ChatUserModel[];
  submitted: boolean;
}
