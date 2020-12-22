using System;
using System.Collections.Generic;
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
    }
}
