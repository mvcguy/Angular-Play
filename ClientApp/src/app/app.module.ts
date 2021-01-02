import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { NavMenuComponent } from './nav-menu/nav-menu.component';
import { HomeComponent } from './home/home.component';
import { ApiAuthorizationModule } from 'src/api-authorization/api-authorization.module';
import { AuthorizeGuard } from 'src/api-authorization/authorize.guard';
import { AuthorizeInterceptor } from 'src/api-authorization/authorize.interceptor';
import { UserSearchComponent } from './chat/UserSearch/user.search.component';
import { UserConversationComponent } from './chat/UserConversation/user.conversation.component';
import { CommonModule } from '@angular/common';
import { ChatWindowComponent } from './chat/chat-window/chat-window.component';
import { UserListComponent } from './chat/user-list/user-list.component';
import { UserManagerService } from './UserManagerService';
import { UserManager } from 'oidc-client';


export async function initUserManager(userMgrService: UserManagerService): Promise<UserManager> {
  if (!!userMgrService.GetUserManger) return userMgrService.GetUserManger;
  await userMgrService.load();
  return userMgrService.GetUserManger;
}


@NgModule({
  declarations: [
    AppComponent,
    NavMenuComponent,
    HomeComponent,
    UserSearchComponent,
    UserConversationComponent,
    UserListComponent,
    ChatWindowComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'ng-cli-universal' }),
    HttpClientModule,
    FormsModule,
    ApiAuthorizationModule,
    CommonModule,
    RouterModule.forRoot([
      { path: '', component: HomeComponent, pathMatch: 'full' },
      { path: 'chat', component: UserSearchComponent, canActivate: [AuthorizeGuard] },
      { path: 'chat/userConversation/:userName', component: UserConversationComponent, canActivate: [AuthorizeGuard] }
    ])
  ],
  providers: [
    UserManagerService,
    { provide: HTTP_INTERCEPTORS, useClass: AuthorizeInterceptor, multi: true },
    { provide: 'USER_MANAGER', useFactory: initUserManager, deps: [UserManagerService], multi: false }
  ],
  bootstrap: [AppComponent]
})

export class AppModule { }
