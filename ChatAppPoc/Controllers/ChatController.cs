using ChatAppPoc.Data;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ChatAppPoc.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly ChatUsersRepository repository;

        public ChatController(ChatUsersRepository repository)
        {
            this.repository = repository;
        }

        [HttpGet("searchuser")]
        public async IAsyncEnumerable<ChatUserVm> SearchUsers(string query)
        {
            if(string.IsNullOrWhiteSpace(query) || query.Trim().Length<=1)
            {
                //
                // return empty list
                //
                yield break;
            }
            await foreach (var item in repository.SearchUser(query.Trim()))
            {
                yield return item;
            }            
        }

    }
}
