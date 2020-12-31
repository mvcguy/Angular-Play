﻿using ChatAppPoc.Models;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;

namespace ChatAppPoc.Data
{
    public class ChatUsersRepository
    {
        private readonly ApplicationDbContext dbContext;

        public ChatUsersRepository(ApplicationDbContext dbContext)
        {
            this.dbContext = dbContext;
        }

        public async IAsyncEnumerable<ChatUserVm> SearchUser(string query)
        {
            var task = Task.Run(() =>
            {
                var items = dbContext.Users.Where(x => x.UserName.StartsWith(query) || x.Email.StartsWith(query)).ToList();
                return items.Select(x => x.ToChatUserVm());
            });

            var result = await task;
            foreach (var item in result)
            {
                yield return item;
            }

        }

        internal async IAsyncEnumerable<ChatUserVm> GetUsers()
        {
            var task = Task.Run(() =>
            {
                try
                {
                    var items = dbContext.Users.OrderBy(x => x.Email).Take(10);
                    return items.Select(x => x.ToChatUserVm()).ToList();
                }
                catch (Exception e)
                {
                    Debug.WriteLine(e.Message);
                    throw;
                }
            });

            var result = await task;
            foreach (var item in result)
            {
                yield return item;
            }
        }

        internal async Task SaveMessage(ChatMessageVm message)
        {
            var dbMessage = message.ToDbMessage();
            dbContext.ChatMessages.Add(dbMessage);
            await dbContext.SaveChangesAsync();
            message.Index = dbMessage.Id;
        }

        internal async IAsyncEnumerable<ChatMessageVm> GetMessageHistory(string fromUser, string toUser)
        {
            var result = await Task.Run(() =>
            {
                return dbContext.ChatMessages
                .Where(x => (x.FromUser == fromUser && x.ToUser == toUser) 
                || (x.ToUser == fromUser && x.FromUser == toUser)).ToList();
            });

            foreach (var item in result)
            {
                yield return item.ToChatMessageVm();
            }

        }
    }
}
