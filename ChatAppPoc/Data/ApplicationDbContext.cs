using ChatAppPoc.Models;
using IdentityServer4.EntityFramework.Options;
using Microsoft.AspNetCore.ApiAuthorization.IdentityServer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Threading.Tasks;

namespace ChatAppPoc.Data
{
    public class ApplicationDbContext : ApiAuthorizationDbContext<ApplicationUser>
    {
        public ApplicationDbContext(
            DbContextOptions options,
            IOptions<OperationalStoreOptions> operationalStoreOptions) : base(options, operationalStoreOptions)
        {
        }
    }

    public class ChatUserVm
    {
        public string Name { get; set; }

        public string UserName { get; set; }

        public string Email { get; set; }

        

    }

    public static class ModelExtentions
    {
        public static ChatUserVm ToChatUserVm(this ApplicationUser applicationUser)
        {
            return new ChatUserVm
            {
                UserName = applicationUser.UserName,
                Email = applicationUser.Email
            };
        }
    }
}
