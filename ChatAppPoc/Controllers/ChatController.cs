using ChatAppPoc.Data;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Text.Encodings.Web;
using System.Threading.Tasks;

namespace ChatAppPoc.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly ChatUsersRepository repository;
        private readonly MessageSender messageSender;

        public ChatController(ChatUsersRepository repository, MessageSender messageSender)
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

            var result = repository.GetMessageHistory(currentUser, opponentUser);

            await foreach (var item in result)
            {
                yield return item;
            }
        }

    }

    public class ChatMessageVm
    {
        /* 
         * //client side
            class ChatMessage {
                userName?: string;
                message?: string;
                timestamp?: string;
                index?: number;
            }
         */

        public string FromUser { get; set; }

        public string ToUser { get; set; }

        public string Message { get; set; }

        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// time at user machine when message was sent
        /// </summary>
        public string Timestamp { get; set; }

        public int Index { get; set; }

        internal PublicMessage ToPublicMessage()
        {
            return new PublicMessage
            {
                Props = new Dictionary<string, object>
                {
                    {nameof(CreatedAt), DateTime.Now },
                    {nameof(FromUser), FromUser },
                    {nameof(ToUser), ToUser },
                    {nameof(Index), Index },
                    {nameof(Timestamp), Timestamp },
                },
                Body = Message
            };
        }

        internal ChatMessage ToDbMessage()
        {
            return new ChatMessage
            {
                CreatedAt = DateTime.Now,
                FromUser = FromUser,
                ToUser = ToUser,
                Message = HtmlEncoder.Default.Encode(Message)
            };
        }
    }

    public class MessageSender
    {
        public async Task SendMessage(PublicMessage message)
        {
            var task = Task.Run(() => { });
            await task;
        }
    }

    public class PublicMessage
    {
        public IDictionary<string, object> Props { get; set; }

        public string Body { get; set; }
    }
}
