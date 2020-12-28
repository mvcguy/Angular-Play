using IdentityServer4.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ChatAppPoc.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class HomeController : ControllerBase
    {
        private readonly IIdentityServerInteractionService interaction;
        private readonly IConfiguration configuration;

        public HomeController(IWebHostEnvironment environment, ILogger<HomeController> logger,
            IIdentityServerInteractionService interaction, IConfiguration configuration)
        {
            Environment = environment;
            Logger = logger;
            this.interaction = interaction;
            this.configuration = configuration;
        }

        public IWebHostEnvironment Environment { get; }
        public ILogger<HomeController> Logger { get; }

        [HttpGet()]
        public async Task<IActionResult> Index(string errorId)
        {
            var message = await interaction.GetErrorContextAsync(errorId);
            return BadRequest(message);
        }

        [HttpGet("returnregister")]
        public IActionResult AfterRegisterRedirect()
        {
            //return Redirect($"https://localhost/chatui/authentication/login?{this.Request.QueryString}");
            //return Redirect($"http://localhost:4200/authentication/login?{this.Request.QueryString}");
            return Redirect($"{configuration["AfterRegisterRedirect"]}?{Request.QueryString}");
        }

        [HttpGet("error")]
        public IActionResult Error()
        {
            return BadRequest();
        }

    }
}
