using Microsoft.AspNetCore.Mvc;
using BusManagementSystem.Services;
using BusManagementSystem.DTOs;
using Microsoft.AspNetCore.Authorization;

namespace BusManagementSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "AdminWrite")]
    public class ImportController : ControllerBase
    {
        private readonly ImportService _importService;

        public ImportController(ImportService importService)
        {
            _importService = importService;
        }

        [HttpPost("preview")]
        public async Task<ActionResult<List<ImportPreviewItem>>> Preview(IFormFile file)
        {
            if (file == null) return BadRequest(new { message = "File is required" });
            using var stream = file.OpenReadStream();
            var list = await _importService.ParseCsvPreviewAsync(stream);
            return Ok(list);
        }

        [HttpPost("execute")]
        public async Task<ActionResult<ImportResultDto>> Execute(IFormFile file, [FromQuery] bool forceReassign = false)
        {
            if (file == null) return BadRequest(new { message = "File is required" });
            var userId = User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "system";
            using var stream = file.OpenReadStream();
            var result = await _importService.ExecuteImportAsync(stream, userId, forceReassign);
            return Ok(result);
        }

        [HttpPost("rollback")]
        public async Task<IActionResult> Rollback([FromBody] RollbackRequest req)
        {
            var ok = await _importService.RollbackImportAsync(req.ImportRecordId);
            if (!ok) return BadRequest(new { message = "Rollback failed or already rolled back" });
            return Ok(new { message = "Rollback successful" });
        }
    }
}
