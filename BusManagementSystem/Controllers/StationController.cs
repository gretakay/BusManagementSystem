using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BusManagementSystem.Data;
using BusManagementSystem.Models;
using BusManagementSystem.DTOs;

namespace BusManagementSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StationController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<StationController> _logger;

        public StationController(ApplicationDbContext context, ILogger<StationController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/station
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetStations()
        {
            try
            {
                // 使用Key前綴來篩選站點
                var stations = await _context.Set<Setting>()
                    .Where(s => s.Key.StartsWith("Station_"))
                    .Select(s => new
                    {
                        Id = s.Id,
                        Name = s.Key.Replace("Station_", ""),
                        DisplayName = s.Value,
                        Description = s.Description
                    })
                    .ToListAsync();

                return Ok(stations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "取得站點清單失敗");
                return StatusCode(500, new { message = "取得站點清單失敗" });
            }
        }

        // GET: api/station/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetStation(int id)
        {
            try
            {
                var station = await _context.Set<Setting>()
                    .Where(s => s.Id == id && s.Key.StartsWith("Station_"))
                    .Select(s => new
                    {
                        Id = s.Id,
                        Name = s.Key.Replace("Station_", ""),
                        DisplayName = s.Value,
                        Description = s.Description
                    })
                    .FirstOrDefaultAsync();

                if (station == null)
                {
                    return NotFound(new { message = "站點不存在" });
                }

                return Ok(station);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "取得站點詳細資訊失敗");
                return StatusCode(500, new { message = "取得站點詳細資訊失敗" });
            }
        }

        // POST: api/station
        [HttpPost]
        public async Task<ActionResult<object>> CreateStation([FromBody] StationDTO stationDto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(stationDto.Name))
                {
                    return BadRequest(new { message = "站點名稱為必填" });
                }

                // 檢查是否已存在相同名稱的站點
                var stationKey = $"Station_{stationDto.Name}";
                var exists = await _context.Set<Setting>()
                    .AnyAsync(s => s.Key == stationKey);

                if (exists)
                {
                    return BadRequest(new { message = "此站點名稱已存在" });
                }

                var station = new Setting
                {
                    Key = stationKey,
                    Value = stationDto.DisplayName ?? stationDto.Name,
                    Description = stationDto.Description,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Set<Setting>().Add(station);
                await _context.SaveChangesAsync();

                var result = new
                {
                    Id = station.Id,
                    Name = stationDto.Name,
                    DisplayName = station.Value,
                    Description = station.Description
                };

                return CreatedAtAction(nameof(GetStation), new { id = station.Id }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "建立站點失敗");
                return StatusCode(500, new { message = "建立站點失敗" });
            }
        }

        // PUT: api/station/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateStation(int id, [FromBody] StationDTO stationDto)
        {
            try
            {
                var station = await _context.Set<Setting>()
                    .FirstOrDefaultAsync(s => s.Id == id && s.Key.StartsWith("Station_"));

                if (station == null)
                {
                    return NotFound(new { message = "站點不存在" });
                }

                if (!string.IsNullOrWhiteSpace(stationDto.Name))
                {
                    station.Key = $"Station_{stationDto.Name}";
                }
                if (!string.IsNullOrWhiteSpace(stationDto.DisplayName))
                {
                    station.Value = stationDto.DisplayName;
                }
                if (!string.IsNullOrWhiteSpace(stationDto.Description))
                {
                    station.Description = stationDto.Description;
                }

                station.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "更新站點失敗");
                return StatusCode(500, new { message = "更新站點失敗" });
            }
        }

        // DELETE: api/station/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStation(int id)
        {
            try
            {
                var station = await _context.Set<Setting>()
                    .FirstOrDefaultAsync(s => s.Id == id && s.Key.StartsWith("Station_"));

                if (station == null)
                {
                    return NotFound(new { message = "站點不存在" });
                }

                _context.Set<Setting>().Remove(station);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "刪除站點失敗");
                return StatusCode(500, new { message = "刪除站點失敗" });
            }
        }
    }
}
