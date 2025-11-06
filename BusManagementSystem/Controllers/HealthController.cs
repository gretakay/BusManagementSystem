using Microsoft.AspNetCore.Mvc;

namespace BusManagementSystem.Controllers
{
    [ApiController]
    [Route("/")]
    public class HealthController : ControllerBase
    {
        [HttpGet]
        public IActionResult Health()
        {
            return Ok(new
            {
                status = "healthy",
                service = "遊覽車管理系統 API",
                timestamp = DateTime.UtcNow,
                version = "1.0.0"
            });
        }

        [HttpGet("api")]
        public IActionResult ApiHealth()
        {
            return Ok(new
            {
                status = "API is running",
                endpoints = new[]
                {
                    "/api/auth/login",
                    "/api/trips",
                    "/api/buses/my",
                    "/api/scan",
                    "/api/people"
                }
            });
        }
    }
}