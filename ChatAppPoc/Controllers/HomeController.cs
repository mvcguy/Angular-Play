using IdentityServer4.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
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

        public HomeController(IWebHostEnvironment environment, ILogger<HomeController> logger,
            IIdentityServerInteractionService interaction)
        {
            Environment = environment;
            Logger = logger;
            this.interaction = interaction;
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
            return Redirect($"http://localhost:4200/authentication/login?{this.Request.QueryString}");
        }

        [HttpGet("error")]
        public IActionResult Error()
        {
            return BadRequest();
        }

    }
}
