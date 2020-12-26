using ChatAppPoc.Controllers;
using ChatAppPoc.Data;
using ChatAppPoc.Models;
using ChatAppPoc.SignalArServices;
using Microsoft.AspNetCore.ApiAuthorization.IdentityServer;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using System.Diagnostics;
using System.Threading.Tasks;

namespace ChatAppPoc
{
    public class Startup
    {
        private const string corsdef = "defaultcors";

        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(
                    Configuration.GetConnectionString("DefaultConnection")));

            services.AddScoped<ChatUsersRepository>();
            services.AddSingleton<MessageSender>();

            services.AddDatabaseDeveloperPageExceptionFilter();

            //services.AddTransient<IReturnUrlParser, IdentityServer.Local.ReturnUrlParser>();

            services.AddDefaultIdentity<ApplicationUser>(options =>
            {
                options.SignIn.RequireConfirmedAccount = false;
            }).AddEntityFrameworkStores<ApplicationDbContext>();


            services.AddCors(options =>
            {
                options.DefaultPolicyName = corsdef;
                options.AddDefaultPolicy(DefaultPolicy());
            });

            services.AddIdentityServer(options =>
            {
                options.Cors.CorsPolicyName = corsdef;
                options.UserInteraction.ErrorUrl = "~/home/error";

            }).AddApiAuthorization<ApplicationUser, ApplicationDbContext>();

            services.AddAuthentication()
                .AddIdentityServerJwt();
            services.AddControllersWithViews();
            services.AddRazorPages();

            UpdateJwtOptions(services);

            services.AddSignalR();

        }
        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
                app.UseMigrationsEndPoint();
            }
            else
            {
                app.UseExceptionHandler("/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }

            app.UseDeveloperExceptionPage();

            app.UseHttpsRedirection();
            app.UseStaticFiles();
            app.UseRouting();
            app.UseCors();

            app.UseAuthentication();
            app.UseIdentityServer();
            app.UseAuthorization();
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllerRoute(
                    name: "default",
                    pattern: "{controller}/{action=Index}/{id?}");
                endpoints.MapRazorPages();

                endpoints.MapHub<ChatHub>("/chathub");
            });

            app.Use(SayHello);

        }

        private async Task SayHello(HttpContext context, Func<Task> next)
        {
            await context.Response.WriteAsync("Hello from the Backend");
            await next();
        }

        private static void UpdateJwtOptions(IServiceCollection services)
        {
            //
            // configure the options provided/used by: (Ref: https://docs.microsoft.com/en-us/aspnet/core/security/authentication/identity-api-authorization?view=aspnetcore-5.0)
            // services.AddAuthentication()
            //   .AddIdentityServerJwt();
            //
            services.Configure<JwtBearerOptions>(IdentityServerJwtConstants.IdentityServerJwtBearerScheme,
                options =>
                {
                    // TODO: put in the config file
                    options.Authority = "https://localhost/chatpoc";


                    //
                    // we can also register our own event handlers for the auth process
                    //

                    /*
                     * In the following code, the OnTokenValidated event handler is replaced with a custom implementation. 
                     * This implementation:
                        1. Calls the original implementation provided by the API authorization support.
                        2. Run its own custom logic.
                     * 
                    */
                    var onTokenValidated = options.Events.OnTokenValidated;

                    options.Events.OnTokenValidated = async context =>
                    {
                        // call the base
                        await onTokenValidated(context);


                        //
                        // custom logic
                        //

                        //Debugger.Log(1, "IDS4", $"token is validated!. Token issue: {context.SecurityToken.Issuer} ");
                        Debug.WriteLine($"token is validated!. Token issuer: {context.SecurityToken.Issuer} ", "IDS4");
                    };

                    var error = options.Events.OnAuthenticationFailed;

                    options.Events.OnAuthenticationFailed = async context =>
                    {
                        // call the base event
                        await error(context);

                        Debug.WriteLine($"Error has occurred. Error: {context.Exception?.Message}", "IDS4");
                    };

                });
        }

        private static Action<CorsPolicyBuilder> DefaultPolicy()
        {
            return builder =>
            {
                builder
                .WithOrigins("http://localhost:4200")
                //.AllowAnyOrigin()
                //.SetIsOriginAllowedToAllowWildcardSubdomains()
                .AllowAnyMethod()
                .AllowCredentials()
                .AllowAnyHeader();
            };
        }

    }
}
