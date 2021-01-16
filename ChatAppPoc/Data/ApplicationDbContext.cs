using ChatAppPoc.Models;
using IdentityServer4.EntityFramework.Options;
using Microsoft.AspNetCore.ApiAuthorization.IdentityServer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace ChatAppPoc.Data
{
    public class ApplicationDbContext : ApiAuthorizationDbContext<ApplicationUser>
    {
        public ApplicationDbContext(
            DbContextOptions options,
            IOptions<OperationalStoreOptions> operationalStoreOptions)
            : base(options, operationalStoreOptions)
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
}
