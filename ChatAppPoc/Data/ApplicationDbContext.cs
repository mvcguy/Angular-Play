using ChatAppPoc.Models;
using IdentityServer4.EntityFramework.Options;
using Microsoft.AspNetCore.ApiAuthorization.IdentityServer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System;
using System.ComponentModel.DataAnnotations;
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

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<ChatMessage>((b) =>
            {
                b.Property(x => x.Id).UseIdentityColumn().HasColumnType("int");
                b.Property(x => x.FromUser).HasMaxLength(256).HasColumnType("nvarchar(256)");
                b.Property(x => x.ToUser).HasMaxLength(256).HasColumnType("nvarchar(256)");
                b.Property(x => x.Message).HasMaxLength(256).HasColumnType("nvarchar(MAX)");
                b.Property(x => x.CreatedAt).HasMaxLength(256).HasColumnType("datetime2");
            });
        }

        public virtual DbSet<ChatMessage> ChatMessages { get; set; }
    }

    public class ChatMessage
    {
        [Key]
        public virtual int Id { get; set; }

        public virtual string FromUser { get; set; }

        public virtual string ToUser { get; set; }

        public virtual string Message { get; set; }

        public virtual DateTime CreatedAt { get; set; }
    }

    public class ChatUserVm
    {
        public string Name { get; set; }

        public string UserName { get; set; }

        public string Email { get; set; }

        public string Phone { get; set; }



    }

    public static class ModelExtentions
    {
        public static ChatUserVm ToChatUserVm(this ApplicationUser applicationUser)
        {
            return new ChatUserVm
            {
                UserName = applicationUser.UserName,
                Email = applicationUser.Email,
                Phone = applicationUser.PhoneNumber
            };
        }
    }
}
