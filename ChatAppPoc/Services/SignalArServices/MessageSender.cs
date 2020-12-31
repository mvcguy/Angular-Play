using ChatAppPoc.Models;
using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace ChatAppPoc.Services.SignalArServices
{
    public class MessageSender
    {
        private readonly IHubContext<ChatHub> hubContext;

        public MessageSender(IHubContext<ChatHub> hubContext)
        {
            this.hubContext = hubContext;
        }
        public async Task SendMessage(PublicMessage message)
        {
            var from = message.Props["FromUser"] as string;
            var to = message.Props["ToUser"] as string;
            await hubContext.Clients.All.SendAsync(to + from, message);
        }
    }
}
