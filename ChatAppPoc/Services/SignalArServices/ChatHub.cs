using ChatAppPoc.Data;
using ChatAppPoc.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ChatAppPoc.Services.SignalArServices
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly ILogger<ChatHub> logger;
        private readonly ChatUsersRepository repository;
        private readonly MessageSender messageSender;

        public ChatHub(ILogger<ChatHub> logger
            , ChatUsersRepository repository
            , MessageSender messageSender)
        {
            this.logger = logger;
            this.repository = repository;
            this.messageSender = messageSender;
        }

        public override Task OnConnectedAsync()
        {
            logger.Log(LogLevel.Information, "Client is connected");
            return base.OnConnectedAsync();
        }

        public override Task OnDisconnectedAsync(Exception exception)
        {
            logger.LogInformation("Client is disconnected");
            return base.OnDisconnectedAsync(exception);
        }

        public async Task SendMessage(ChatMessageVm message)
        {
            if (message == null || string.IsNullOrWhiteSpace(message.Message)
                || string.IsNullOrWhiteSpace(message.FromUser)
                || string.IsNullOrWhiteSpace(message.ToUser)
                )
            {

                logger.LogInformation("Bad request arrived");
                return;
            }

            await repository.SaveMessage(message);
            await messageSender.SendMessage(message.ToPublicMessage());

            logger.LogInformation("Request is processed Ok");
        }

        public async Task MarkAsSeen(IList<ChatMessageVm> messages)
        {
            await repository.MarkAsSeen(messages);
            logger.LogInformation("Messages are marked as seen.");
        }

        public async Task ForwardAudioStream(ChatStreamVm stream)
        {
            var destKey = stream.ToUser + "-audio";
            await this.Clients.All.SendAsync(destKey, stream);
        }

    }

    public class ChatStreamVm
    {
        public string FromUser { get; set; }

        public string ToUser { get; set; }

        public float[] PcmStream { get; set; }
    }

    public class StreamItem
    {
        public int index { get; set; }
        public float P { get; set; }
    }
}
