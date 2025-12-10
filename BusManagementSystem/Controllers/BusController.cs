using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BusManagementSystem.Data;
using BusManagementSystem.Models;
using BusManagementSystem.DTOs;

namespace BusManagementSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BusController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<BusController> _logger;

        public BusController(ApplicationDbContext context, ILogger<BusController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/bus
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetBuses([FromQuery] int? tripId = null)
        {
            try
            {
                var query = _context.Buses.AsQueryable();

                if (tripId.HasValue)
                {
                    query = query.Where(b => b.TripId == tripId.Value);
                }

                var buses = await query
                    .Include(b => b.LeaderUser)
                    .Select(b => new
                    {
                        Id = b.Id,
                        Name = b.Name,
                        PlateNumber = b.Name,
                        Capacity = b.Capacity,
                        LeaderUserId = b.LeaderUserId,
                        LeaderName = b.LeaderUser != null ? b.LeaderUser.UserName : "",
                        Description = b.Description,
                        AssignedCount = b.Assignments.Count(),
                        OnBoardCount = b.Boardings.Count()
                    })
                    .ToListAsync();

                return Ok(buses);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "取得車輛列表失敗");
                return StatusCode(500, new { message = "取得車輛列表失敗" });
            }
        }

        // GET: api/bus/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetBus(int id)
        {
            try
            {
                var bus = await _context.Buses
                    .Include(b => b.LeaderUser)
                    .Where(b => b.Id == id)
                    .Select(b => new
                    {
                        Id = b.Id,
                        Name = b.Name,
                        PlateNumber = b.Name,
                        Capacity = b.Capacity,
                        LeaderUserId = b.LeaderUserId,
                        LeaderName = b.LeaderUser != null ? b.LeaderUser.UserName : "",
                        Description = b.Description,
                        AssignedCount = b.Assignments.Count(),
                        OnBoardCount = b.Boardings.Count()
                    })
                    .FirstOrDefaultAsync();

                if (bus == null)
                {
                    return NotFound(new { message = "車輛不存在" });
                }

                return Ok(bus);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "取得車輛詳細資訊失敗");
                return StatusCode(500, new { message = "取得車輛詳細資訊失敗" });
            }
        }

        // POST: api/bus
        [HttpPost]
        public async Task<ActionResult<object>> CreateBus([FromBody] BusDTO busDto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(busDto.PlateNumber))
                {
                    return BadRequest(new { message = "車牌號碼為必填" });
                }

                if (busDto.Capacity <= 0)
                {
                    return BadRequest(new { message = "座位數必須大於0" });
                }

                // 檢查是否有TripId
                if (busDto.TripId <= 0)
                {
                    return BadRequest(new { message = "行程ID為必填" });
                }

                var bus = new Bus
                {
                    TripId = busDto.TripId,
                    Name = busDto.PlateNumber, // 使用PlateNumber作為Name
                    Capacity = busDto.Capacity,
                    LeaderUserId = busDto.LeaderUserId ?? "system",
                    Description = busDto.Description,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Buses.Add(bus);
                await _context.SaveChangesAsync();

                var result = new
                {
                    Id = bus.Id,
                    Name = bus.Name,
                    PlateNumber = bus.Name,
                    Capacity = bus.Capacity,
                    LeaderUserId = bus.LeaderUserId,
                    Description = bus.Description
                };

                return CreatedAtAction(nameof(GetBus), new { id = bus.Id }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "建立車輛失敗");
                return StatusCode(500, new { message = "建立車輛失敗" });
            }
        }

        // PUT: api/bus/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBus(int id, [FromBody] BusDTO busDto)
        {
            try
            {
                var bus = await _context.Buses.FindAsync(id);

                if (bus == null)
                {
                    return NotFound(new { message = "車輛不存在" });
                }

                if (!string.IsNullOrWhiteSpace(busDto.PlateNumber))
                {
                    bus.Name = busDto.PlateNumber;
                }
                if (busDto.Capacity > 0)
                {
                    bus.Capacity = busDto.Capacity;
                }
                if (!string.IsNullOrWhiteSpace(busDto.LeaderUserId))
                {
                    bus.LeaderUserId = busDto.LeaderUserId;
                }
                if (!string.IsNullOrWhiteSpace(busDto.Description))
                {
                    bus.Description = busDto.Description;
                }

                bus.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "更新車輛失敗");
                return StatusCode(500, new { message = "更新車輛失敗" });
            }
        }

        // DELETE: api/bus/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBus(int id)
        {
            try
            {
                var bus = await _context.Buses.FindAsync(id);

                if (bus == null)
                {
                    return NotFound(new { message = "車輛不存在" });
                }

                // 檢查是否有關聯的分配記錄
                var hasAssignments = await _context.Set<Assignment>()
                    .AnyAsync(a => a.BusId == id);

                if (hasAssignments)
                {
                    return BadRequest(new { message = "此車輛已有人員分配，無法刪除" });
                }

                _context.Buses.Remove(bus);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "刪除車輛失敗");
                return StatusCode(500, new { message = "刪除車輛失敗" });
            }
        }

        // GET: api/bus/{id}/roster - 取得車輛名單
        [HttpGet("{id}/roster")]
        public async Task<ActionResult<object>> GetBusRoster(int id)
        {
            try
            {
                var bus = await _context.Buses.FindAsync(id);
                if (bus == null)
                {
                    return NotFound(new { message = "車輛不存在" });
                }

                var assignments = await _context.Set<Assignment>()
                    .Where(a => a.BusId == id)
                    .Include(a => a.Person)
                    .Select(a => new
                    {
                        PersonId = a.PersonId,
                        Name = a.Person.Name,
                        DharmaName = a.Person.DharmaName,
                        Monastery = a.Person.Monastery,
                        BoardingStatus = a.Person.Boardings
                            .Where(b => b.BusId == id)
                            .OrderByDescending(b => b.Timestamp)
                            .Select(b => new { b.Timestamp, Action = b.Action.ToString() })
                            .FirstOrDefault()
                    })
                    .ToListAsync();

                return Ok(new
                {
                    BusId = id,
                    BusName = bus.Name,
                    Capacity = bus.Capacity,
                    AssignedCount = assignments.Count,
                    OnBoardCount = assignments.Count(a => a.BoardingStatus != null),
                    Roster = assignments
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "取得車輛名單失敗");
                return StatusCode(500, new { message = "取得車輛名單失敗" });
            }
        }

        // GET: api/bus/my - 取得我負責的車輛 (領隊用)
        [HttpGet("my")]
        public async Task<ActionResult<IEnumerable<object>>> GetMyBuses()
        {
            try
            {
                // TODO: 從認證取得當前使用者ID
                // var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                
                // 目前暫時返回所有車輛
                var buses = await _context.Buses
                    .Include(b => b.LeaderUser)
                    .Select(b => new
                    {
                        Id = b.Id,
                        Name = b.Name,
                        PlateNumber = b.Name,
                        Capacity = b.Capacity,
                        LeaderName = b.LeaderUser != null ? b.LeaderUser.UserName : "",
                        AssignedCount = b.Assignments.Count(),
                        OnBoardCount = b.Boardings.Count()
                    })
                    .ToListAsync();

                return Ok(buses);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "取得我的車輛失敗");
                return StatusCode(500, new { message = "取得我的車輛失敗" });
            }
        }
    }
}
