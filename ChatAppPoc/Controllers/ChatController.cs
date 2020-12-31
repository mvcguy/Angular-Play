using ChatAppPoc.Data;
using ChatAppPoc.Models;
using ChatAppPoc.Services.SignalArServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Text.Encodings.Web;
using System.Threading.Tasks;

namespace ChatAppPoc.Controllers
{

    [Authorize]
    [ApiController]
    [Route("[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly ChatUsersRepository repository;
        private readonly MessageSender messageSender;

        public ChatController(ChatUsersRepository repository
            , MessageSender messageSender)
        {
            this.repository = repository;
            this.messageSender = messageSender;
        }
                
        [HttpGet("searchuser")]
        public async IAsyncEnumerable<ChatUserVm> SearchUsers(string query)
        {
            if (string.IsNullOrWhiteSpace(query) || query.Trim().Length <= 1)
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

        [HttpGet("userlist")]
        public async IAsyncEnumerable<ChatUserVm> Userlist()
        {
            //
            // returns TOP 10 users for now
            //

            await foreach (var item in repository.GetUsers())
            {
                yield return item;
            }
        }

        [HttpPost("sendmessage")]
        public async Task<IActionResult> SendMessage([FromBody] ChatMessageVm message)
        {
            if (message == null || string.IsNullOrWhiteSpace(message.Message)
                || string.IsNullOrWhiteSpace(message.FromUser)
                || string.IsNullOrWhiteSpace(message.ToUser)
                ) return BadRequest();

            await repository.SaveMessage(message);

            await messageSender.SendMessage(message.ToPublicMessage());

            return Ok();
        }

        [HttpGet("messagehistory")]
        public async IAsyncEnumerable<ChatMessageVm> MessageHistory(string currentUser, string opponentUser)
        {

            // TODO: refactor the "bad-ugly-design" of currentUser and opponentUser

            var result = repository.GetMessageHistory(currentUser, opponentUser);

            await foreach (var item in result)
            {
                yield return item;
            }
        }

    }
}
