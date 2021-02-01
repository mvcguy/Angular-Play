using ChatAppPoc.Data;
using ChatAppPoc.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using SharedServices;
using System;
using System.Collections;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Runtime.CompilerServices;
using System.Threading;
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

        public async Task ForwardAudioStream2(IAsyncEnumerable<ChatStreamVm> stream)
        {
            var destKey = "";
            await foreach (var item in stream)
            {
                destKey = item.ToUser + "-audio";

                //
                // TODO: need to define/limit max buffer size
                //
                var userBuffer = Buffer.GetOrAdd(destKey, new ConcurrentQueue<ChatStreamVm>());
                userBuffer.Enqueue(item);
            }

            SaveStream(destKey);

        }

        private void SaveStream(string destKey)
        {
            AudioHeader header = new AudioHeader();
            AudioProcessor.SavePcm(Buffer[destKey], header);
        }

        public async IAsyncEnumerable<ChatStreamVm> DownloadAudioStream(string user,
            [EnumeratorCancellation] CancellationToken cancellationToken)
        {

            if (!Buffer.TryGetValue(user, out var value)) yield break;

            while (true)
            {
                cancellationToken.ThrowIfCancellationRequested();

                if (!value.IsEmpty && value.TryDequeue(out var result))
                    yield return result;
                else
                {
                    await Task.Delay(1000, cancellationToken);
                }
            }
        }

        private static readonly
            ConcurrentDictionary<string, ConcurrentQueue<ChatStreamVm>> Buffer =
             new ConcurrentDictionary<string, ConcurrentQueue<ChatStreamVm>>();

    }

    

}
